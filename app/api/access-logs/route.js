/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/access-logs:
 *   get:
 *     summary: Get access logs for visitors with filtering and pagination
 *     description: |
 *       Retrieves access logs with filtering options. User must be authenticated and have access:
 *       - Admin or Security: Can view all logs for their organization
 *       - Resident: Can view logs for QR codes they created
 *     tags: [Access Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organization_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by organization ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: qr_code_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific QR code ID
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *       - in: query
 *         name: entry_type
 *         schema:
 *           type: string
 *           enum: [entry, exit]
 *         description: Filter by entry type
 *         example: "entry"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: "Pagination limit (default: 50, max: 100)"
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: "Pagination offset (default: 0)"
 *         example: 0
 *     responses:
 *       '200':
 *         description: Access logs retrieved successfully
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
 *                   example: "Registros de acceso obtenidos exitosamente."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Access log entry
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       qr_code_id:
 *                         type: string
 *                         format: uuid
 *                       organization_id:
 *                         type: string
 *                         format: uuid
 *                       entry_type:
 *                         type: string
 *                         enum: [entry, exit]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       scanned_by:
 *                         type: string
 *                         format: uuid
 *                       scanned_by_name:
 *                         type: string
 *                         nullable: true
 *                       qr_code:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           identifier:
 *                             type: string
 *                           visitor_name:
 *                             type: string
 *                             nullable: true
 *                           created_by:
 *                             type: string
 *                             format: uuid
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
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

    // If organizationId is provided, verify user has access using permission-based check
    if (organizationId) {
      // Check if user has qr:view_history permission (allows admin, security, and residents with this permission)
      const { data: hasPermission, error: permissionError } = await supabase.rpc(
        "has_permission",
        {
          p_user_id: user.id,
          p_org_id: organizationId,
          p_permission_code: "qr:view_history",
        }
      );

      if (permissionError || !hasPermission) {
        // If user doesn't have qr:view_history permission, check if they're trying to view their own QR code logs
        if (qrCodeId) {
          // Allow if user created the QR code (resident viewing their own QR code logs)
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
          // User doesn't have permission and is not viewing a specific QR code they created
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

