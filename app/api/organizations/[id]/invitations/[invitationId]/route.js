/// <reference path="../../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * @swagger
 * /api/organizations/{id}/invitations/{invitationId}:
 *   delete:
 *     summary: Delete a pending invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       '200':
 *         description: Invitation deleted successfully
 *       '400':
 *         description: Cannot delete invitation (e.g., already accepted)
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 */
export async function DELETE(request, { params }) {
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

    // Check if user has permission to manage invitations
    const { data: hasPermission, error: permissionError } = await supabase.rpc(
      "has_permission",
      {
        p_user_id: user.id,
        p_org_id: id,
        p_permission_code: "members:manage",
      }
    );

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para eliminar invitaciones.",
        },
        { status: 403 }
      );
    }

    // Verify the invitation belongs to the organization
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

    // Prevent deletion of accepted invitations
    if (invitation.status === "accepted") {
      return NextResponse.json(
        {
          error: true,
          message:
            "No se puede eliminar una invitación que ya ha sido aceptada.",
        },
        { status: 400 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("organization_invitations")
      .delete()
      .eq("id", invitationId);

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar la invitación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Invitación eliminada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar la invitación.",
      },
      { status: 500 }
    );
  }
}
















