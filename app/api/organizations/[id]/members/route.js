import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organizations/[id]/members
 * Get all organization members (organization-level admin only)
 */
export async function GET(request, { params }) {
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
            "No tienes permisos para ver los miembros. Solo los administradores pueden ver los miembros.",
        },
        { status: 403 }
      );
    }

    // Fetch all members with their details
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        joined_at,
        created_at,
        invited_by,
        organization_roles(
          id,
          name,
          description
        )
      `
      )
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los miembros.",
        },
        { status: 500 }
      );
    }

    // Get all accepted invitations with general_invite_link_id for this organization
    // to check which members joined via general invite links
    const { data: generalLinkInvitations } = await supabase
      .from("organization_invitations")
      .select("email, general_invite_link_id")
      .eq("organization_id", id)
      .eq("status", "accepted")
      .not("general_invite_link_id", "is", null);

    // Create a set of emails that joined via general invite links
    const generalLinkEmails = new Set(
      (generalLinkInvitations || []).map((inv) => inv.email.toLowerCase())
    );

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", member.user_id)
          .single();

        // Get user email from auth.users (using RPC or direct query if possible)
        // Note: We can't directly query auth.users, so we'll use get_user_name for now
        const { data: userName } = await supabase.rpc("get_user_name", {
          p_user_id: member.user_id,
        });

        // Get inviter name if exists
        let inviterName = null;
        if (member.invited_by) {
          const { data: inviterNameData } = await supabase.rpc("get_user_name", {
            p_user_id: member.invited_by,
          });
          inviterName = inviterNameData;
        }

        // Check if member joined via general invite link
        // We need to check if there's an accepted invitation for this user with general_invite_link_id
        // Since we don't have direct email access, we'll check invitations by user_id if possible
        // For now, we'll check if there's an accepted invitation that was created around the same time
        // as the member joined, but a better approach would be to store the invitation_id in members
        // For this implementation, we'll check if there's an accepted invitation with general_invite_link_id
        // that matches the member's join time (within a reasonable window)
        let isFromGeneralLink = false;
        
        // Try to find matching invitation by checking if member was created around the same time
        // as an accepted invitation with general_invite_link_id
        if (member.joined_at && generalLinkInvitations && generalLinkInvitations.length > 0) {
          // Check if there's an accepted invitation with general_invite_link_id
          // that was accepted around the time the member joined
          const memberJoinTime = new Date(member.joined_at).getTime();
          const { data: memberInvitations } = await supabase
            .from("organization_invitations")
            .select("email, general_invite_link_id, updated_at")
            .eq("organization_id", id)
            .eq("status", "accepted")
            .not("general_invite_link_id", "is", null)
            .gte("updated_at", new Date(memberJoinTime - 60000).toISOString()) // 1 minute before
            .lte("updated_at", new Date(memberJoinTime + 60000).toISOString()); // 1 minute after
          
          // If we found invitations accepted around the same time, mark as from general link
          // This is a heuristic approach - ideally we'd have a direct link
          if (memberInvitations && memberInvitations.length > 0) {
            isFromGeneralLink = true;
          }
        }

        return {
          id: member.id,
          user_id: member.user_id,
          name: userName || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario desconocido",
          email: null, // Email not available from profiles, would need auth.users access
          role: {
            id: member.organization_roles.id,
            name: member.organization_roles.name,
            description: member.organization_roles.description,
          },
          joined_at: member.joined_at,
          created_at: member.created_at,
          invited_by: member.invited_by,
          invited_by_name: inviterName,
          is_from_general_link: isFromGeneralLink,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: membersWithDetails,
        message: "Miembros obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching members:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los miembros.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]/members
 * Update member role (organization-level admin only)
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

    // Parse request body
    const body = await request.json();
    const { member_id, organization_role_id } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de miembro inválido.",
        },
        { status: 400 }
      );
    }

    if (!organization_role_id || typeof organization_role_id !== "number") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de rol de organización inválido.",
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
            "No tienes permisos para actualizar miembros. Solo los administradores pueden actualizar miembros.",
        },
        { status: 403 }
      );
    }

    // Verify the role exists
    const { data: roleCheck, error: roleError } = await supabase
      .from("organization_roles")
      .select("id, name")
      .eq("id", organization_role_id)
      .single();

    if (roleError || !roleCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "El rol especificado no existe.",
        },
        { status: 400 }
      );
    }

    // Verify the member belongs to this organization
    const { data: memberVerify, error: memberVerifyError } = await supabase
      .from("organization_members")
      .select("id, organization_id")
      .eq("id", member_id)
      .eq("organization_id", id)
      .single();

    if (memberVerifyError || !memberVerify) {
      return NextResponse.json(
        {
          error: true,
          message: "Miembro no encontrado en esta organización.",
        },
        { status: 404 }
      );
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from("organization_members")
      .update({ organization_role_id })
      .eq("id", member_id)
      .select(
        `
        id,
        user_id,
        organization_role_id,
        organization_roles(
          id,
          name,
          description
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating member:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar el miembro.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedMember,
        message: "Rol de miembro actualizado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating member:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar el miembro.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members
 * Remove member from organization (organization-level admin only)
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

    // Get member_id from query params
    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get("member_id");

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de miembro inválido.",
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
            "No tienes permisos para eliminar miembros. Solo los administradores pueden eliminar miembros.",
        },
        { status: 403 }
      );
    }

    // Verify the member belongs to this organization
    const { data: memberVerify, error: memberVerifyError } = await supabase
      .from("organization_members")
      .select("id, user_id, organization_id")
      .eq("id", member_id)
      .eq("organization_id", id)
      .single();

    if (memberVerifyError || !memberVerify) {
      return NextResponse.json(
        {
          error: true,
          message: "Miembro no encontrado en esta organización.",
        },
        { status: 404 }
      );
    }

    // Prevent removing yourself
    if (memberVerify.user_id === user.id) {
      return NextResponse.json(
        {
          error: true,
          message: "No puedes eliminarte a ti mismo de la organización.",
        },
        { status: 400 }
      );
    }

    // Delete member
    const { error: deleteError } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", member_id);

    if (deleteError) {
      console.error("Error deleting member:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar el miembro.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Miembro eliminado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting member:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar el miembro.",
      },
      { status: 500 }
    );
  }
}




