/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   get:
 *     summary: Get all organization members with their roles and profiles
 *     tags: [Organizations]
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
 *     responses:
 *       '200':
 *         description: List of members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/OrganizationMembers'
 *                       - type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                             nullable: true
 *                           role:
 *                             $ref: '#/components/schemas/OrganizationRoles'
 *                           invited_by_name:
 *                             type: string
 *                             nullable: true
 *                           is_from_general_link:
 *                             type: boolean
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
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

    // Validate organization ID (UUID format)
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

    // Check if user has permission to view members
    const { data: hasPermission, error: permissionError } = await supabase
      .rpc("has_permission", {
        p_user_id: user.id,
        p_org_id: id,
        p_permission_code: "members:view",
      });

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para ver los miembros.",
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
        seat_id,
        joined_at,
        created_at,
        invited_by,
        seats(
          id,
          name,
          capacity,
          seat_types(
            id,
            name,
            description
          )
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

        // Get email from accepted invitation for this user
        let memberEmail = null;
        
        // If this is the current user, use their email from auth session (most reliable)
        if (member.user_id === user.id && user.email) {
          memberEmail = user.email;
        } else {
          // First, try to find invitation by user_id (most reliable)
          let { data: memberInvitation } = await supabase
            .from("organization_invitations")
            .select("email")
            .eq("organization_id", id)
            .eq("user_id", member.user_id)
            .eq("status", "accepted")
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          // If not found by user_id, try to find by matching join time (fallback for older invitations)
          if (!memberInvitation && member.joined_at) {
            const memberJoinTime = new Date(member.joined_at).getTime();
            const timeWindow = 5 * 60 * 1000; // 5 minutes window
            
            const { data: timeMatchedInvitations } = await supabase
              .from("organization_invitations")
              .select("email, updated_at")
              .eq("organization_id", id)
              .eq("status", "accepted")
              .gte("updated_at", new Date(memberJoinTime - timeWindow).toISOString())
              .lte("updated_at", new Date(memberJoinTime + timeWindow).toISOString())
              .order("updated_at", { ascending: false })
              .limit(1);

            if (timeMatchedInvitations && timeMatchedInvitations.length > 0) {
              memberInvitation = timeMatchedInvitations[0];
            }
          }

          if (memberInvitation && memberInvitation.email) {
            memberEmail = memberInvitation.email;
          }
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
          email: memberEmail,
          seat: member.seats ? {
            id: member.seats.id,
            name: member.seats.name,
            capacity: member.seats.capacity,
            type: {
              id: member.seats.seat_types.id,
              name: member.seats.seat_types.name,
              description: member.seats.seat_types.description,
            }
          } : null,
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
 * @swagger
 * /api/organizations/{id}/members:
 *   put:
 *     summary: Update a member's role within the organization
 *     tags: [Organizations]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_id
 *               - organization_role_id
 *             properties:
 *               member_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the member to update
 *               organization_role_id:
 *                 type: integer
 *                 description: New role ID for the member
 *     responses:
 *       '200':
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/OrganizationMembers'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Member not found
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
    const { member_id, seat_id } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de miembro inválido.",
        },
        { status: 400 }
      );
    }

    if (!seat_id || typeof seat_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de asiento inválido.",
        },
        { status: 400 }
      );
    }

    // Check if user has permission to manage members
    const { data: hasPermission, error: permissionError } = await supabase
      .rpc("has_permission", {
        p_user_id: user.id,
        p_org_id: id,
        p_permission_code: "members:manage",
      });

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para actualizar miembros.",
        },
        { status: 403 }
      );
    }

    // Verify the member belongs to this organization
    const { data: memberVerify, error: memberVerifyError } = await supabase
      .from("organization_members")
      .select("user_id, organization_id")
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

    // Check if member is the last admin and we're moving them to a non-admin seat
    const { data: isLastAdmin, error: lastAdminError } = await supabase.rpc(
      "is_last_admin_in_organization",
      {
        p_user_id: memberVerify.user_id,
        p_organization_id: id,
      }
    );

    if (isLastAdmin) {
        // Verify if the target seat is an admin seat
        const { data: targetSeat, error: targetSeatError } = await supabase
            .from("seats")
            .select("seat_types!inner(name)")
            .eq("id", seat_id)
            .single();
        
        if (targetSeat?.seat_types?.name !== 'admin') {
            return NextResponse.json(
                {
                  error: true,
                  message:
                    "No puedes cambiar el asiento del último administrador a uno que no sea de administrador.",
                },
                { status: 400 }
              );
        }
    }

    // Assign user to seat using RPC (handles capacity and cooldown)
    const { error: assignError } = await supabase.rpc("assign_user_to_seat", {
      p_user_id: memberVerify.user_id,
      p_seat_id: seat_id,
    });

    if (assignError) {
      console.error("Error assigning seat:", assignError);
      return NextResponse.json(
        {
          error: true,
          message: assignError.message || "Error al asignar el asiento.",
        },
        { status: 400 }
      );
    }

    // Fetch updated member data
    const { data: updatedMember, error: fetchError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        seat_id,
        seats(
          id,
          name,
          seat_types(
            id,
            name,
            description
          )
        )
      `
      )
      .eq("id", member_id)
      .single();

    return NextResponse.json(
      {
        error: false,
        data: updatedMember,
        message: "Asiento del miembro actualizado exitosamente.",
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
 * @swagger
 * /api/organizations/{id}/members:
 *   delete:
 *     summary: Remove a member from the organization
 *     tags: [Organizations]
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
 *       - in: query
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the member to remove
 *     responses:
 *       '200':
 *         description: Member removed successfully
 *       '400':
 *         description: Cannot remove member (e.g., self-removal or last admin)
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
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

    // Check if user has permission to manage members
    const { data: hasPermission, error: permissionError } = await supabase
      .rpc("has_permission", {
        p_user_id: user.id,
        p_org_id: id,
        p_permission_code: "members:manage",
      });

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para eliminar miembros.",
        },
        { status: 403 }
      );
    }

    // Verify the member belongs to this organization and get their role
    const { data: memberVerify, error: memberVerifyError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_id,
        seat_id,
        seats!inner(
          seat_types!inner(
            name
          )
        )
      `
      )
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

    // Check if member is an admin
    const isAdmin = memberVerify.seats?.seat_types?.name === "admin";

    if (isAdmin) {
      // Check if there are other admins in the organization
      const { data: isLastAdmin, error: lastAdminError } = await supabase.rpc(
        "is_last_admin_in_organization",
        {
          p_user_id: memberVerify.user_id,
          p_organization_id: id,
        }
      );

      if (lastAdminError) {
        console.error("Error checking last admin:", lastAdminError);
        return NextResponse.json(
          {
            error: true,
            message: "Error al verificar administradores.",
          },
          { status: 500 }
        );
      }

      // If there's only 1 admin (this member), prevent deletion
      if (isLastAdmin) {
        return NextResponse.json(
          {
            error: true,
            message:
              "No puedes eliminar este administrador. Debe haber al menos un administrador en la organización.",
          },
          { status: 400 }
        );
      }
    }

    // Check if the removed organization was the user's main organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("main_organization_id")
      .eq("id", memberVerify.user_id)
      .single();

    const wasMainOrganization = profile && profile.main_organization_id === id;

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

    // If the removed organization was the user's main, recalculate main organization
    if (wasMainOrganization) {
      const { recalculateMainOrganization } = await import("@/utils/api/profiles");
      const recalcResult = await recalculateMainOrganization(memberVerify.user_id);
      
      if (recalcResult.error) {
        // Log the error but don't fail the member removal
        console.error("Error recalculating main organization:", recalcResult.message);
      }
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




