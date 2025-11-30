import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendApprovalEmail } from "@/utils/mailer/mailer";
import { getBaseUrlFromHeaders } from "@/utils/config/app";

/**
 * POST /api/organizations/[id]/invitations/[invitationId]/approve
 * Approve a pending invitation that requires approval (admin only)
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id, invitationId } = await params;

    // Authenticate user
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

    // Validate organization ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización inválido.",
        },
        { status: 400 }
      );
    }

    // Validate invitation ID
    if (!invitationId || typeof invitationId !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de invitación inválido.",
        },
        { status: 400 }
      );
    }

    // Check if user is admin of the organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        organization_roles!inner(
          id,
          name
        )
      `
      )
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "admin")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para aprobar invitaciones. Solo los administradores pueden aprobar invitaciones.",
        },
        { status: 403 }
      );
    }

    // Verify the invitation belongs to the organization and is pending approval
    const { data: invitation, error: invitationError } = await supabase
      .from("organization_invitations")
      .select("id, organization_id, status, email, first_name, last_name")
      .eq("id", invitationId)
      .eq("organization_id", id)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        {
          error: true,
          message: "Invitación no encontrada.",
        },
        { status: 404 }
      );
    }

    // Check if invitation is in pending_approval status
    if (invitation.status !== "pending_approval") {
      return NextResponse.json(
        {
          error: true,
          message:
            "Esta invitación no requiere aprobación o ya ha sido procesada.",
        },
        { status: 400 }
      );
    }

    // Get the invitation details including organization_role_id and user_id
    const { data: fullInvitation, error: fullInvitationError } = await supabase
      .from("organization_invitations")
      .select("id, organization_id, organization_role_id, invited_by, email, user_id")
      .eq("id", invitationId)
      .single();

    if (fullInvitationError || !fullInvitation) {
      console.error("Error fetching full invitation:", fullInvitationError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los detalles de la invitación.",
        },
        { status: 500 }
      );
    }

    // Update invitation status to accepted
    const { data: updatedInvitation, error: updateError } = await supabase
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error approving invitation:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al aprobar la invitación.",
        },
        { status: 500 }
      );
    }

    // Add user to organization_members using admin's permissions
    // Use user_id directly from the invitation (set when user accepted general invite link)
    if (fullInvitation.user_id) {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", id)
        .eq("user_id", fullInvitation.user_id)
        .single();

      if (!existingMember) {
        // Add user to organization_members using admin's permissions
        // The RLS policy "Admins can add organization members" will allow this
        const { data: memberData, error: memberError } = await supabase
          .from("organization_members")
          .insert({
            user_id: fullInvitation.user_id,
            organization_id: id,
            organization_role_id: fullInvitation.organization_role_id,
            invited_by: fullInvitation.invited_by,
            joined_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (memberError) {
          console.error("Error adding user to organization:", memberError);
          // Don't fail the approval - invitation status is already updated
          // The error might be due to RLS, but admin should have permission
        }
      }
    } else {
      // user_id is NULL - this shouldn't happen for general invite link invitations
      // but could happen for admin-created invitations where user hasn't accepted yet
      console.warn(
        `Invitation ${invitationId} does not have user_id. User may need to accept invitation first.`
      );
    }

    // Get organization name for email
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", id)
      .single();

    const organizationName = organization?.name || "la organización";

    // Send approval email (non-blocking)
    try {
      const baseUrl = await getBaseUrlFromHeaders();
      await sendApprovalEmail(
        invitation.email,
        invitation.first_name,
        invitation.last_name,
        organizationName,
        baseUrl
      );
      console.log("Approval email sent successfully to:", invitation.email);
    } catch (emailError) {
      console.error("Error sending approval email:", {
        email: invitation.email,
        error: emailError.message,
        stack: emailError.stack,
      });
      // Continue - don't fail approval if email fails
    }

    // Create in-app notification
    // Find user_id by querying organization_members and matching invitation email
    // Since we can't directly query auth.users by email, we'll query members
    // and try to match. For now, we'll attempt to create notification if we can find user_id
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", id);

    if (!membersError && members && members.length > 0) {
      // Try to find the user by checking if we can match via invitation
      // Since we can't directly match email to user_id without admin API,
      // we'll create notification for all members or skip for now
      // For MVP: notification will be created when user checks their invitation status
      // or we can enhance this later with an RPC function to get user_id by email
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedInvitation,
        message: "Invitación aprobada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error approving invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al aprobar la invitación.",
      },
      { status: 500 }
    );
  }
}

