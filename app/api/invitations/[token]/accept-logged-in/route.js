import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { updateMainOrganization } from "@/utils/api/profiles";

/**
 * @swagger
 * /api/invitations/{token}/accept-logged-in:
 *   post:
 *     summary: Accept personal invitation (logged in)
 *     description: Join an organization via a personal invitation using the current authenticated session.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Joined organization successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user_id: { type: string, format: uuid }
 *                         organization_name: { type: string }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Conflict - Already member
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    // Validate token
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Token de invitación inválido.",
        },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: true,
          message: "No estás autenticado. Por favor, inicia sesión.",
        },
        { status: 401 }
      );
    }

    // Get invitation details
    const { data: invitationData, error: inviteError } = await supabase.rpc(
      "get_invitation_by_token",
      { p_token: token }
    );

    if (inviteError || !invitationData || invitationData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Invitación no encontrada o token inválido.",
        },
        { status: 404 }
      );
    }

    const invitation = invitationData[0];

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Esta invitación es para otro usuario. Por favor, inicia sesión con el email correcto.",
        },
        { status: 403 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < now) {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ha expirado.",
        },
        { status: 410 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ya ha sido aceptada o cancelada.",
        },
        { status: 410 }
      );
    }

    // Check if user is actually a member (in case of data inconsistency)
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // User is already a member - check if there are old accepted invitations to clean up
      // This handles the case where invitation status doesn't match membership
      const { error: cleanupError } = await supabase
        .from("organization_invitations")
        .update({ status: "cancelled" })
        .eq("organization_id", invitation.organization_id)
        .eq("email", invitation.email)
        .eq("status", "accepted")
        .neq("id", invitation.id);

      if (cleanupError) {
        console.error("Error cleaning up old invitations:", cleanupError);
      }

      return NextResponse.json(
        {
          error: true,
          message: "Ya eres miembro de esta organización.",
        },
        { status: 409 }
      );
    }

    // Clean up any old accepted invitations for this email/organization
    // NOTE: RLS may block this query from seeing old accepted invitations
    // If cleanup fails due to RLS, we'll catch the constraint violation and handle it
    const { data: cleanupData, error: cleanupError } = await supabase
      .from("organization_invitations")
      .update({ status: "cancelled" })
      .eq("organization_id", invitation.organization_id)
      .eq("email", invitation.email)
      .eq("status", "accepted")
      .neq("id", invitation.id)
      .select();

    if (cleanupError) {
      console.error("Error cleaning up old accepted invitations (RLS may be blocking):", cleanupError);
      // Continue anyway - we'll handle the constraint violation if it occurs
    }

    // Use database function to add user to organization (bypasses RLS)
    const { data: memberData, error: memberError } = await supabase.rpc(
      "accept_organization_invitation",
      {
        p_token: token,
        p_user_id: user.id,
      }
    );

    if (memberError) {
      console.error("Error accepting invitation:", memberError);

      // Handle specific error codes from the function
      if (memberError.code === "P0001") {
        return NextResponse.json(
          {
            error: true,
            message: "Invitación no encontrada o token inválido.",
          },
          { status: 404 }
        );
      }

      if (memberError.code === "P0002") {
        return NextResponse.json(
          {
            error: true,
            message: "Esta invitación ha expirado.",
          },
          { status: 410 }
        );
      }

      if (memberError.code === "P0003") {
        return NextResponse.json(
          {
            error: true,
            message: "Esta invitación ya ha sido aceptada o cancelada.",
          },
          { status: 410 }
        );
      }

      if (memberError.code === "23505") {
        // Constraint violation: there's an old accepted invitation that RLS blocked us from seeing
        // Try to clean it up using service role client (bypasses RLS)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );

          // Instead of UPDATE (which can hit constraint), DELETE the old accepted invitations
          // This avoids the unique constraint violation during the update operation
          const { data: serviceCleanupData, error: serviceCleanupError } = await serviceClient
            .from("organization_invitations")
            .delete()
            .eq("organization_id", invitation.organization_id)
            .eq("email", invitation.email)
            .eq("status", "accepted")
            .neq("id", invitation.id)
            .select();

          if (!serviceCleanupError && serviceCleanupData && serviceCleanupData.length > 0) {
            // Cleanup succeeded, retry the acceptance
            const { data: retryMemberData, error: retryMemberError } = await supabase.rpc(
              "accept_organization_invitation",
              {
                p_token: token,
                p_user_id: user.id,
              }
            );

            if (!retryMemberError && retryMemberData && retryMemberData.length > 0) {
              const member = retryMemberData[0];
              const updateResult = await updateMainOrganization(
                user.id,
                member.organization_id
              );

              if (updateResult.error) {
                console.error("Error setting main organization:", updateResult.message);
              }

              return NextResponse.json(
                {
                  error: false,
                  data: {
                    user_id: user.id,
                    organization_id: member.organization_id,
                    organization_name: invitation.organization_name,
                    role_name: invitation.role_name,
                    is_new_user: false,
                  },
                  message: "Agregado a la organización exitosamente.",
                },
                { status: 200 }
              );
            }
          }
        }

        // If cleanup failed or service role not available, return error
        return NextResponse.json(
          {
            error: true,
            message: "Ya eres miembro de esta organización o hay una invitación anterior que necesita ser limpiada.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al aceptar la invitación.",
        },
        { status: 500 }
      );
    }

    if (!memberData || memberData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo agregar el usuario a la organización.",
        },
        { status: 500 }
      );
    }

    const member = memberData[0];

    // Set the organization as the user's main organization
    // This only happens when invitation status is "accepted" (not pending_approval)
    const updateResult = await updateMainOrganization(
      user.id,
      member.organization_id
    );

    if (updateResult.error) {
      // Log the error but don't fail the invitation acceptance
      // The user was added successfully, main org update is secondary
      console.error("Error setting main organization:", updateResult.message);
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          user_id: user.id,
          organization_id: member.organization_id,
          organization_name: invitation.organization_name,
          role_name: invitation.role_name,
          is_new_user: false,
        },
        message: "Agregado a la organización exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error accepting invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al aceptar la invitación.",
      },
      { status: 500 }
    );
  }
}







