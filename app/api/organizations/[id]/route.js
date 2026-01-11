/// <reference path="../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";

/**
 * GET /api/organizations/[id]
 * Get organization details by ID
 * 
 * @auth {Session} User must be authenticated
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @response 200 {Organizations} Organization details
 * @response 404 {Error} Organization not found
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await getOrganizationById(id);

    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        data: result.data,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la organización.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization (admin only)
 * 
 * @auth {Session} User must be authenticated and be an admin of the organization
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @body {Object} { name: string } Organization name (2-100 characters)
 * @response 200 {Organizations} Updated organization
 * @response 400 {Error} Validation error
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (admin only)
 * @response 404 {Error} Organization not found
 * @response 409 {Error} Organization name already exists
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const { validateUUID } = await import("@/utils/validation/uuid");
    const uuidValidation = validateUUID(id, "organización");
    if (uuidValidation) {
      return NextResponse.json(
        {
          error: uuidValidation.error,
          message: uuidValidation.message,
        },
        { status: uuidValidation.status }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate organization name
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "El nombre de la organización es requerido.",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        {
          error: true,
          message:
            "El nombre de la organización debe tener al menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message:
            "El nombre de la organización no puede tener más de 100 caracteres.",
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
            "No tienes permisos para editar esta organización. Solo los administradores pueden editar organizaciones.",
        },
        { status: 403 }
      );
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from("organizations")
      .update({ name: trimmedName })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating organization:", updateError);

      // Handle specific database errors
      if (updateError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          {
            error: true,
            message: "Ya existe una organización con ese nombre.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar la organización.",
        },
        { status: 500 }
      );
    }

    if (!updatedOrg) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo actualizar la organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedOrg,
        message: "Organización actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la organización.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (admin only, requires all members to be removed first)
 * 
 * @auth {Session} User must be authenticated and be an admin of the organization
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @response 200 {Object} Success message
 * @response 400 {Error} Cannot delete (has members or other constraints)
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (admin only)
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const { validateUUID } = await import("@/utils/validation/uuid");
    const uuidValidation = validateUUID(id, "organización");
    if (uuidValidation) {
      return NextResponse.json(
        {
          error: uuidValidation.error,
          message: uuidValidation.message,
        },
        { status: uuidValidation.status }
      );
    }

    // Check if user is admin of the organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        organization_roles!inner(
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
            "No tienes permisos para eliminar esta organización. Solo los administradores pueden eliminar organizaciones.",
        },
        { status: 403 }
      );
    }

    // Check member count using database function
    const { data: memberCount, error: memberCountError } = await supabase.rpc(
      "count_members_in_organization",
      {
        p_organization_id: id,
      }
    );

    if (memberCountError) {
      console.error("Error counting members:", memberCountError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al verificar miembros de la organización.",
        },
        { status: 500 }
      );
    }

    // Allow deletion if user is the only member (they can delete their own organization)
    // Prevent deletion if there are multiple members
    if (memberCount > 1) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No se puede eliminar una organización que tiene miembros. Elimina todos los miembros primero.",
        },
        { status: 400 }
      );
    }

    // If there's exactly 1 member, verify it's the current user
    // (they can delete their own organization)
    if (memberCount === 1) {
      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", id)
        .single();

      if (membersError || !members || members.user_id !== user.id) {
        return NextResponse.json(
          {
            error: true,
            message:
              "No se puede eliminar una organización que tiene otros miembros. Elimina todos los miembros primero.",
          },
          { status: 400 }
        );
      }
      // User is the only member - proceed with organization deletion
      // The database trigger will allow it, and members will be cascade deleted
    }

    // Delete related data before deleting the organization
    // Note: Some tables may have CASCADE DELETE, but we'll handle them explicitly for clarity

    // Delete organization invitations
    const { error: deleteInvitationsError } = await supabase
      .from("organization_invitations")
      .delete()
      .eq("organization_id", id);

    if (deleteInvitationsError) {
      console.error("Error deleting invitations:", deleteInvitationsError);
      // Continue with deletion, log the error
    }

    // Delete general invite links
    const { error: deleteInviteLinksError } = await supabase
      .from("general_invite_links")
      .delete()
      .eq("organization_id", id);

    if (deleteInviteLinksError) {
      console.error("Error deleting invite links:", deleteInviteLinksError);
      // Continue with deletion, log the error
    }

    // Delete notifications
    const { error: deleteNotificationsError } = await supabase
      .from("notifications")
      .delete()
      .eq("organization_id", id);

    if (deleteNotificationsError) {
      console.error("Error deleting notifications:", deleteNotificationsError);
      // Continue with deletion, log the error
    }

    // Delete organization chat settings
    const { error: deleteChatSettingsError } = await supabase
      .from("organization_chat_settings")
      .delete()
      .eq("organization_id", id);

    if (deleteChatSettingsError) {
      console.error("Error deleting chat settings:", deleteChatSettingsError);
      // Continue with deletion, log the error
    }

    // Delete role chat permissions
    const { error: deleteChatPermissionsError } = await supabase
      .from("role_chat_permissions")
      .delete()
      .eq("organization_id", id);

    if (deleteChatPermissionsError) {
      console.error(
        "Error deleting chat permissions:",
        deleteChatPermissionsError
      );
      // Continue with deletion, log the error
    }

    // Delete chat conversations (this will cascade to chat_messages if FK has CASCADE)
    const { error: deleteConversationsError } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("organization_id", id);

    if (deleteConversationsError) {
      console.error("Error deleting conversations:", deleteConversationsError);
      // Continue with deletion, log the error
    }

    // Delete chat messages (in case CASCADE doesn't work)
    const { error: deleteMessagesError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("organization_id", id);

    if (deleteMessagesError) {
      console.error("Error deleting messages:", deleteMessagesError);
      // Continue with deletion, log the error
    }

    // Note: We're keeping qr_codes and access_logs for historical/audit purposes
    // If you want to delete them, uncomment the following:
    /*
    // Delete QR codes
    const { error: deleteQRCodesError } = await supabase
      .from("qr_codes")
      .delete()
      .eq("organization_id", id);

    if (deleteQRCodesError) {
      console.error("Error deleting QR codes:", deleteQRCodesError);
    }

    // Delete access logs
    const { error: deleteAccessLogsError } = await supabase
      .from("access_logs")
      .delete()
      .eq("organization_id", id);

    if (deleteAccessLogsError) {
      console.error("Error deleting access logs:", deleteAccessLogsError);
    }
    */

    // Delete the organization
    // The database trigger will prevent deletion if members still exist
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting organization:", deleteError);

      // Handle specific database errors
      if (deleteError.code === "23505") {
        // This might be triggered by our custom trigger
        return NextResponse.json(
          {
            error: true,
            message:
              "No se puede eliminar una organización que tiene miembros. Elimina todos los miembros primero.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar la organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Organización eliminada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar la organización.",
      },
      { status: 500 }
    );
  }
}
