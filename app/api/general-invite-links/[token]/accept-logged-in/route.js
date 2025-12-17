import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateMainOrganization } from "@/utils/api/profiles";
import crypto from "crypto";

/**
 * POST /api/general-invite-links/[token]/accept-logged-in
 * Accept a general invite link for a logged-in user (no password needed)
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
          message: "Token de enlace inválido.",
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

    // Get user's profile to get first_name and last_name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener el perfil del usuario.",
        },
        { status: 500 }
      );
    }

    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          error: true,
          message: "El perfil del usuario está incompleto. Por favor, completa tu nombre y apellido.",
        },
        { status: 400 }
      );
    }

    // Get general invite link details using RPC function
    const { data: linkData, error: linkError } = await supabase.rpc(
      "get_general_invite_link_by_token",
      { p_token: token }
    );

    if (linkError || !linkData || linkData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Enlace de invitación no encontrado o token inválido.",
        },
        { status: 404 }
      );
    }

    const link = linkData[0];

    // Check if link is expired
    if (link.is_expired) {
      return NextResponse.json(
        {
          error: true,
          message: "Este enlace de invitación ha expirado.",
        },
        { status: 410 }
      );
    }

    // Check if user is already a member of this organization
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", link.organization_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        {
          error: true,
          message: "Ya eres miembro de esta organización.",
        },
        { status: 409 }
      );
    }

    // Check if user already has a pending invitation for this organization
    const { data: existingInvitation } = await supabase
      .from("organization_invitations")
      .select("id, status")
      .eq("organization_id", link.organization_id)
      .eq("email", user.email?.toLowerCase().trim())
      .in("status", ["pending", "pending_approval"])
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: true,
          message: "Ya tienes una solicitud pendiente para esta organización.",
        },
        { status: 409 }
      );
    }

    // Generate secure token for the invitation record
    const invitationToken = crypto.randomBytes(32).toString("base64url");

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Determine invitation status based on requires_approval
    // Always use pending_approval if link requires approval, otherwise pending
    const invitationStatus = link.requires_approval
      ? "pending_approval"
      : "pending";

    // Create invitation record using RPC function to bypass RLS
    // This function handles validation and creation atomically
    // Include user_id so we can use it later when approving
    const { data: invitationData, error: inviteError } = await supabase.rpc(
      "create_invitation_from_general_link",
      {
        p_general_invite_link_id: link.id,
        p_email: user.email.trim(),
        p_token: invitationToken,
        p_first_name: firstName,
        p_last_name: lastName,
        p_expires_at: expiresAt.toISOString(),
        p_status: invitationStatus,
        p_user_id: user.id,
      }
    );

    // The RPC function returns an array, get the first result
    const invitation =
      invitationData && invitationData.length > 0 ? invitationData[0] : null;

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);

      // Handle specific error codes from the function
      if (inviteError.code === "P0001") {
        return NextResponse.json(
          {
            error: true,
            message: "El enlace de invitación general no existe.",
          },
          { status: 404 }
        );
      }

      if (inviteError.code === "P0002") {
        return NextResponse.json(
          {
            error: true,
            message: "Este enlace de invitación ha expirado.",
          },
          { status: 410 }
        );
      }

      if (inviteError.code === "P0003") {
        return NextResponse.json(
          {
            error: true,
            message: "El estado de la invitación no es válido.",
          },
          { status: 400 }
        );
      }

      // Handle duplicate invitation error
      if (
        inviteError.code === "23505" ||
        inviteError.message?.includes("Ya existe")
      ) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Ya existe una invitación pendiente para este email en esta organización.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message:
            inviteError.message ||
            "Error al crear la invitación. Por favor, intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo crear la invitación.",
        },
        { status: 500 }
      );
    }

    // If approval is not required, automatically accept the invitation
    // This adds the user to organization_members and updates invitation status to "accepted"
    if (!link.requires_approval) {
      const { data: memberData, error: memberError } = await supabase.rpc(
        "accept_organization_invitation",
        {
          p_token: invitationToken,
          p_user_id: user.id,
        }
      );

      if (memberError) {
        // Log the error but don't fail the request
        // The invitation was created successfully and can be manually approved later if needed
        console.error("Error auto-accepting invitation:", memberError);
        console.error(
          "Invitation created but user not automatically added to organization. Invitation ID:",
          invitation.id,
          "User ID:",
          user.id
        );

        // Log specific error codes for debugging
        if (memberError.code === "P0001") {
          console.error("Invitation not found or invalid token");
        } else if (memberError.code === "P0002") {
          console.error("Invitation expired");
        } else if (memberError.code === "P0003") {
          console.error("Invitation already accepted or cancelled");
        } else if (memberError.code === "23505") {
          console.error("User is already a member of this organization");
        }
      } else if (memberData && memberData.length > 0) {
        // Successfully added to organization - update invitation status in response
        invitation.status = "accepted";

        // Set the organization as the user's main organization
        // Only set when approval is not required (user is automatically added)
        const updateResult = await updateMainOrganization(
          user.id,
          link.organization_id
        );

        if (updateResult.error) {
          // Log the error but don't fail the request
          console.error("Error setting main organization:", updateResult.message);
        }
      }
    }

    // Return success response
    return NextResponse.json(
      {
        error: false,
        data: {
          user_id: user.id,
          invitation_id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          requires_approval: link.requires_approval,
          organization_id: link.organization_id,
          organization_name: link.organization_name,
          is_new_user: false,
        },
        message: link.requires_approval
          ? "Tu solicitud está pendiente de aprobación. Te notificaremos cuando sea aprobada."
          : "Agregado a la organización exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error accepting general invite link:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al aceptar el enlace de invitación.",
      },
      { status: 500 }
    );
  }
}



