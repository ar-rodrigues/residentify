/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/qr-codes/[id]/access-logs
 * Get access logs for a specific QR code
 * 
 * @auth {Session} User must be authenticated and have access (creator, admin, or security)
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @param {number} [limit=50] - Pagination limit (query param)
 * @param {number} [offset=0] - Pagination offset (query param)
 * @response 200 {Array<AccessLogs & { scanned_by_name: string }>} List of access logs
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized
 * @response 404 {Error} QR code not found
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

    // Validate QR code ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de código QR inválido.",
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify user has access to this QR code (either creator or admin/security of organization)
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, organization_id, created_by")
      .eq("id", id)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json(
        {
          error: true,
          message: "Código QR no encontrado.",
        },
        { status: 404 }
      );
    }

    // Check if user is creator
    const isCreator = qrCode.created_by === user.id;

    // Check if user is admin or security of the organization
    let isAuthorized = isCreator;

    if (!isCreator) {
      const { data: memberCheck } = await supabase
        .from("organization_members")
        .select(
          `
          id,
          organization_roles!inner(
            name
          )
        `
        )
        .eq("organization_id", qrCode.organization_id)
        .eq("user_id", user.id)
        .in("organization_roles.name", ["admin", "security"])
        .single();

      isAuthorized = !!memberCheck;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para ver los registros de acceso de este código QR.",
        },
        { status: 403 }
      );
    }

    // Get access logs
    const { data: accessLogs, error: logsError } = await supabase
      .from("access_logs")
      .select("*")
      .eq("qr_code_id", id)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error("Error fetching access logs:", logsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los registros de acceso.",
        },
        { status: 500 }
      );
    }

    // Get unique user IDs from scanned_by
    const userIds = [
      ...new Set(
        (accessLogs || [])
          .map((log) => log.scanned_by)
          .filter((id) => id !== null)
      ),
    ];

    // Fetch profiles for scanned_by users
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format response
    const formattedLogs = (accessLogs || []).map((log) => {
      const scannedByProfile = profilesMap[log.scanned_by];
      return {
        ...log,
        scanned_by_name: scannedByProfile
          ? `${scannedByProfile.first_name} ${scannedByProfile.last_name}`.trim()
          : null,
      };
    });

    return NextResponse.json(
      {
        error: false,
        data: formattedLogs,
        message: "Registros de acceso obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching access logs:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los registros de acceso.",
      },
      { status: 500 }
    );
  }
}

