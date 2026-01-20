import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * @swagger
 * /api/organizations/{id}/general-invite-links/{linkId}:
 *   delete:
 *     summary: Delete/revoke a general invite link (admin only)
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
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invite link ID
 *     responses:
 *       '200':
 *         description: Invite link deleted successfully
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
    const { id, linkId } = await params;

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

    // Validate link ID (UUID format)
    const linkValidation = validateUUID(linkId, "enlace");
    if (linkValidation) {
      return NextResponse.json(
        {
          error: linkValidation.error,
          message: linkValidation.message,
        },
        { status: linkValidation.status }
      );
    }

    // Check if user has permission to manage members (which includes invite links)
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
            "No tienes permisos para eliminar enlaces de invitación.",
        },
        { status: 403 }
      );
    }

    // Verify the link belongs to the organization
    const { data: link, error: linkError } = await supabase
      .from("general_invite_links")
      .select("id, organization_id")
      .eq("id", linkId)
      .eq("organization_id", id)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        {
          error: true,
          message: "Enlace de invitación no encontrado.",
        },
        { status: 404 }
      );
    }

    // Delete the general invite link
    const { error: deleteError } = await supabase
      .from("general_invite_links")
      .delete()
      .eq("id", linkId);

    if (deleteError) {
      console.error("Error deleting general invite link:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar el enlace de invitación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Enlace de invitación eliminado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting general invite link:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar el enlace de invitación.",
      },
      { status: 500 }
    );
  }
}




