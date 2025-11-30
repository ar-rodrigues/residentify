import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/access-logs
 * Get access logs with filters
 */
export async function GET(request) {
  try {
    const supabase = await createClient();

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const qrCodeId = searchParams.get("qr_code_id");
    const entryType = searchParams.get("entry_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If organizationId is provided, verify user has access (admin or security)
    if (organizationId) {
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
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .in("organization_roles.name", ["admin", "security", "security_personnel"])
        .single();

      if (memberError || !memberCheck) {
        // Check if user is a resident trying to view their own QR code logs
        if (qrCodeId) {
          // Allow if user created the QR code
          const { data: qrCode } = await supabase
            .from("qr_codes")
            .select("created_by")
            .eq("id", qrCodeId)
            .single();

          if (!qrCode || qrCode.created_by !== user.id) {
            return NextResponse.json(
              {
                error: true,
                message: "No tienes permisos para ver los registros de acceso de esta organización.",
              },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: true,
              message: "No tienes permisos para ver los registros de acceso de esta organización.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Build query
    let query = supabase
      .from("access_logs")
      .select(
        `
        *,
        qr_code:qr_codes(
          id,
          identifier,
          visitor_name,
          created_by
        )
      `
      )
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    // Filter by QR code if provided
    if (qrCodeId) {
      query = query.eq("qr_code_id", qrCodeId);
    }

    // Filter by entry type if provided
    if (entryType) {
      query = query.eq("entry_type", entryType);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("timestamp", startDate);
    }

    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data: accessLogs, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching access logs:", fetchError);
      console.error("Error details:", JSON.stringify(fetchError, null, 2));
      return NextResponse.json(
        {
          error: true,
          message: fetchError.message || "Error al obtener los registros de acceso.",
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
        visitor_name: log.qr_code?.visitor_name || null,
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

