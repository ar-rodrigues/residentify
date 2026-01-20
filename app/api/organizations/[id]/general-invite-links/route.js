/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";
import crypto from "crypto";
import { getBaseUrlFromHeaders } from "@/utils/config/app";
import { getLocaleFromRequest } from "@/utils/i18n/request";

/**
 * @swagger
 * /api/organizations/{id}/general-invite-links:
 *   post:
 *     summary: Create a new general invite link for an organization (admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organization_role_id
 *               - requires_approval
 *             properties:
 *               seat_type_id: { type: 'integer' }
 *               requires_approval: { type: 'boolean' }
 *               expires_at: { type: 'string', format: 'date-time' }
 *     responses:
 *       '201':
 *         description: General invite link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: 'boolean' }
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/GeneralInviteLinks'
 *                     - type: object
 *                       properties:
 *                         invite_url: { type: 'string' }
 *                         role_name: { type: 'string' }
 *                         role_description: { type: 'string', nullable: true }
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
export async function POST(request, { params }) {
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
    const { seat_type_id, requires_approval, expires_at } = body;

    // Validate required fields
    if (!seat_type_id || typeof seat_type_id !== "number") {
      return NextResponse.json(
        {
          error: true,
          message: "El tipo de asiento es requerido.",
        },
        { status: 400 }
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
            "No tienes permisos para crear enlaces de invitación.",
        },
        { status: 403 }
      );
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        {
          error: true,
          message: "Organización no encontrada.",
        },
        { status: 404 }
      );
    }

    // Verify seat type exists
    const { data: seatType, error: seatTypeError } = await supabase
      .from("seat_types")
      .select("id, name, description")
      .eq("id", seat_type_id)
      .single();

    if (seatTypeError || !seatType) {
      return NextResponse.json(
        {
          error: true,
          message: "El tipo de asiento especificado no existe.",
        },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("base64url");

    // Parse expiration date if provided
    let expiresAtDate = null;
    if (expires_at) {
      expiresAtDate = new Date(expires_at);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          {
            error: true,
            message: "La fecha de expiración no es válida.",
          },
          { status: 400 }
        );
      }
    }

    // Create general invite link using RPC function
    const { data: linkData, error: linkError } = await supabase.rpc(
      "create_general_invite_link",
      {
        p_organization_id: id,
        p_seat_type_id: seat_type_id,
        p_token: token,
        p_requires_approval: requires_approval === true,
        p_expires_at: expiresAtDate ? expiresAtDate.toISOString() : null,
        p_created_by: user.id,
      }
    );

    // The RPC function returns an array, get the first result
    const link = linkData && linkData.length > 0 ? linkData[0] : null;

    if (linkError) {
      console.error("Error creating general invite link:", linkError);

      // Handle duplicate token error
      if (linkError.code === "23505" || linkError.message?.includes("token")) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Error al generar el token. Por favor, intenta nuevamente.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message:
            linkError.message ||
            "Error al crear el enlace de invitación. Por favor, intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo crear el enlace de invitación.",
        },
        { status: 500 }
      );
    }

    // Get locale from request for invite link
    const locale = getLocaleFromRequest(request);

    // Get base URL for the invite link
    const baseUrl = await getBaseUrlFromHeaders();
    // Include locale in the invite link
    const inviteUrl = `${baseUrl}/${locale}/invitations/general/${token}`;

    return NextResponse.json(
      {
        error: false,
        data: {
          ...link,
          invite_url: inviteUrl,
          role_name: seatType.name,
          role_description: seatType.description,
        },
        message: "Enlace de invitación creado exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating general invite link:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear el enlace de invitación.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/organizations/{id}/general-invite-links:
 *   get:
 *     summary: List all general invite links for an organization (admin only)
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
 *     responses:
 *       '200':
 *         description: List of general invite links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: 'boolean' }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/GeneralInviteLinks'
 *                       - type: object
 *                         properties:
 *                           invite_url: { type: 'string' }
 *                           usage_count: { type: 'integer' }
 *                           is_expired: { type: 'boolean' }
 *                           role_name: { type: 'string' }
 *                           role_description: { type: 'string', nullable: true }
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

    // Check if user has permission to manage members (which includes viewing invite links)
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
            "No tienes permisos para ver los enlaces de invitación.",
        },
        { status: 403 }
      );
    }

    // Fetch all general invite links for the organization
    const { data: links, error: linksError } = await supabase
      .from("general_invite_links")
      .select(
        `
        id,
        organization_id,
        seat_type_id,
        token,
        requires_approval,
        expires_at,
        created_by,
        created_at,
        updated_at,
        seat_types(
          id,
          name,
          description
        )
      `
      )
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("Error fetching general invite links:", linksError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los enlaces de invitación.",
        },
        { status: 500 }
      );
    }

    // Get locale from request for invite links
    const locale = getLocaleFromRequest(request);

    // Get base URL for invite links
    const baseUrl = await getBaseUrlFromHeaders();

    // Count invitations created from each link
    const linksWithStats = await Promise.all(
      (links || []).map(async (link) => {
        const { count } = await supabase
          .from("organization_invitations")
          .select("*", { count: "exact", head: true })
          .eq("general_invite_link_id", link.id);

        const isExpired =
          link.expires_at && new Date(link.expires_at) < new Date();

        return {
          ...link,
          // Include locale in the invite link
          invite_url: `${baseUrl}/${locale}/invitations/general/${link.token}`,
          usage_count: count || 0,
          is_expired: isExpired,
          seat_type_name: link.seat_types?.name,
          seat_type_description: link.seat_types?.description,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: linksWithStats,
        message: "Enlaces de invitación obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching general invite links:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los enlaces de invitación.",
      },
      { status: 500 }
    );
  }
}
