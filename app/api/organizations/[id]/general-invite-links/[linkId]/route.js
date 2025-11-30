import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * DELETE /api/organizations/[id]/general-invite-links/[linkId]
 * Delete/revoke a general invite link (admin only)
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

    // Validate link ID
    if (!linkId || typeof linkId !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de enlace inválido.",
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
            "No tienes permisos para eliminar enlaces de invitación. Solo los administradores pueden eliminar enlaces de invitación.",
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


