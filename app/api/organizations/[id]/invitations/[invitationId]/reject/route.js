/// <reference path="../../../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * POST /api/organizations/[id]/invitations/[invitationId]/reject
 * Reject a pending invitation that requires admin approval
 * 
 * @auth {Session} User must be authenticated and be an admin of the organization
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string, invitationId: string }> }} context
 * @response 200 {OrganizationInvitations} Rejected invitation record
 * @response 400 {Error} Validation error (already processed)
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (admin only)
 * @response 404 {Error} Invitation not found
 * @returns {Promise<import('next/server').NextResponse>}
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

    // Validate organization ID (UUID format)
    const orgValidation = validateUUID(id, "organización");
    if (orgValidation) {
      return NextResponse.json(
        {
          error: orgValidation.error,
          message: orgValidation.message,
        },
        { status: orgValidation.status }
      );
    }

    // Validate invitation ID (UUID format)
    const invValidation = validateUUID(invitationId, "invitación");
    if (invValidation) {
      return NextResponse.json(
        {
          error: invValidation.error,
          message: invValidation.message,
        },
        { status: invValidation.status }
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
            "No tienes permisos para rechazar invitaciones. Solo los administradores pueden rechazar invitaciones.",
        },
        { status: 403 }
      );
    }

    // Verify the invitation belongs to the organization and is pending approval
    const { data: invitation, error: invitationError } = await supabase
      .from("organization_invitations")
      .select("id, organization_id, status")
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

    // Update invitation status to rejected
    const { data: updatedInvitation, error: updateError } = await supabase
      .from("organization_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error rejecting invitation:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al rechazar la invitación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedInvitation,
        message: "Invitación rechazada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error rejecting invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al rechazar la invitación.",
      },
      { status: 500 }
    );
  }
}




