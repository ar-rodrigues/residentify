/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";
import crypto from "crypto";
import { getBaseUrlFromHeaders } from "@/utils/config/app";
import { getLocaleFromRequest } from "@/utils/i18n/request";

/**
 * POST /api/organizations/[id]/general-invite-links
 * Create a new general invite link for an organization (admin only)
 * 
 * @auth {Session} User must be authenticated and be an admin of the organization
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @body {Object} { organization_role_id: number, requires_approval: boolean, expires_at?: string } Link details
 * @response 201 {GeneralInviteLinks & { invite_url: string, role_name: string }} Created link details
 * @response 400 {Error} Validation error
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (admin only)
 * @response 404 {Error} Organization or role not found
 * @returns {Promise<import('next/server').NextResponse>}
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
    const { organization_role_id, requires_approval, expires_at } = body;

    // Validate required fields
    if (!organization_role_id || typeof organization_role_id !== "number") {
      return NextResponse.json(
        {
          error: true,
          message: "El rol de organización es requerido.",
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
            "No tienes permisos para crear enlaces de invitación. Solo los administradores pueden crear enlaces de invitación.",
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

    // Verify organization role exists
    const { data: orgRole, error: roleError } = await supabase
      .from("organization_roles")
      .select("id, name, description")
      .eq("id", organization_role_id)
      .single();

    if (roleError || !orgRole) {
      return NextResponse.json(
        {
          error: true,
          message: "El rol de organización especificado no existe.",
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
        p_organization_role_id: organization_role_id,
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
          role_name: orgRole.name,
          role_description: orgRole.description,
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
 * GET /api/organizations/[id]/general-invite-links
 * List all general invite links for an organization (admin only)
 * 
 * @auth {Session} User must be authenticated and be an admin of the organization
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @response 200 {Array<GeneralInviteLinks & { invite_url: string, usage_count: number }>} List of links with stats
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (admin only)
 * @returns {Promise<import('next/server').NextResponse>}
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
            "No tienes permisos para ver los enlaces de invitación. Solo los administradores pueden ver los enlaces de invitación.",
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
        organization_role_id,
        token,
        requires_approval,
        expires_at,
        created_by,
        created_at,
        updated_at,
        organization_roles(
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
          role_name: link.organization_roles?.name,
          role_description: link.organization_roles?.description,
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
