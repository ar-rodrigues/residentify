/// <reference path="../../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organizations/{id}/invitations/list:
 *   get:
 *     summary: List all invitations for a specific organization
 *     tags: [Organizations, Invitations]
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
 *         description: List of invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: 'boolean' }
 *                 message: { type: 'string' }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/OrganizationInvitations'
 *                       - type: object
 *                         properties:
 *                           full_name: { type: 'string' }
 *                           role:
 *                             $ref: '#/components/schemas/OrganizationRoles'
 *                           is_expired: { type: 'boolean' }
 *                           invited_by_name: { type: 'string', nullable: true }
 *                           is_from_general_link: { type: 'boolean' }
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
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
            "No tienes permisos para ver las invitaciones. Solo los administradores pueden ver las invitaciones.",
        },
        { status: 403 }
      );
    }

    // Fetch all invitations for the organization
    // Fetch without join to avoid RLS issues, then get roles separately
    const { data: invitations, error: invitationsError } = await supabase
      .from("organization_invitations")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        status,
        expires_at,
        created_at,
        updated_at,
        organization_role_id,
        invited_by,
        general_invite_link_id
      `
      )
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      console.error("Error details:", {
        code: invitationsError.code,
        message: invitationsError.message,
        details: invitationsError.details,
        hint: invitationsError.hint,
      });
      return NextResponse.json(
        {
          error: true,
          message: invitationsError.message || "Error al obtener las invitaciones.",
        },
        { status: 500 }
      );
    }

    // Fetch roles separately to avoid join issues
    let rolesMap = {};
    if (invitations && invitations.length > 0) {
      const roleIds = [...new Set(invitations.map(inv => inv.organization_role_id))];
      if (roleIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from("organization_roles")
          .select("id, name, description")
          .in("id", roleIds);

        if (!rolesError && rolesData) {
          rolesData.forEach(role => {
            rolesMap[role.id] = role;
          });
        }
      }
    }

    // Attach roles to invitations
    const invitationsWithRoles = (invitations || []).map(inv => ({
      ...inv,
      organization_roles: rolesMap[inv.organization_role_id] || {
        id: inv.organization_role_id,
        name: "Desconocido",
        description: null,
      },
    }));

    // Get inviter names and calculate expiration status
    const now = new Date();
    const invitationsWithDetails = await Promise.all(
      invitationsWithRoles.map(async (invitation) => {
        // Get inviter name if exists
        let inviterName = null;
        if (invitation.invited_by) {
          try {
            const { data: inviterNameData, error: inviterError } = await supabase.rpc("get_user_name", {
              p_user_id: invitation.invited_by,
            });
            if (!inviterError && inviterNameData) {
              inviterName = inviterNameData;
            }
          } catch (err) {
            console.error("Error fetching inviter name:", err);
            // Continue without inviter name
          }
        }

        // Check if expired
        const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : false;

        // Handle organization_roles - it might be null if the relation fails
        const role = invitation.organization_roles || {
          id: invitation.organization_role_id,
          name: "Desconocido",
          description: null,
        };

        return {
          id: invitation.id,
          email: invitation.email,
          first_name: invitation.first_name || "",
          last_name: invitation.last_name || "",
          full_name: `${invitation.first_name || ""} ${invitation.last_name || ""}`.trim() || "Sin nombre",
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
          },
          status: invitation.status,
          is_expired: isExpired,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
          updated_at: invitation.updated_at,
          invited_by: invitation.invited_by,
          invited_by_name: inviterName,
          general_invite_link_id: invitation.general_invite_link_id,
          is_from_general_link: !!invitation.general_invite_link_id,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: invitationsWithDetails || [],
        message: "Invitaciones obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching invitations:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las invitaciones.",
      },
      { status: 500 }
    );
  }
}

