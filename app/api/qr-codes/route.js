/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import { generateIdentifier } from "@/utils/identifierGenerator";

/**
 * @swagger
 * /api/qr-codes:
 *   post:
 *     summary: Create a new QR code link for a visitor
 *     description: Creates a new QR code for visitor access. User must be authenticated and be a resident of the organization.
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organization_id
 *             properties:
 *               organization_id:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID where the QR code will be created
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       '201':
 *         description: QR code created successfully
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
 *                   example: "Enlace generado exitosamente."
 *                 data:
 *                   type: object
 *                   description: QR code details
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     token:
 *                       type: string
 *                     organization_id:
 *                       type: string
 *                       format: uuid
 *                     created_by:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                     is_used:
 *                       type: boolean
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                     identifier:
 *                       type: string
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
export async function POST(request) {
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

    // Parse request body
    const body = await request.json();
    const { organization_id } = body;

    // Validate required fields
    if (!organization_id || typeof organization_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización es requerido.",
        },
        { status: 400 }
      );
    }

    // Check if user has permission to create QR codes
    const { data: hasPermission, error: permissionError } = await supabase.rpc(
      "has_permission",
      {
        p_user_id: user.id,
        p_org_id: organization_id,
        p_permission_code: "qr:create",
      }
    );

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para crear códigos QR en esta organización.",
        },
        { status: 403 }
      );
    }

    // Generate unique token (32 bytes, base64 encoded)
    const tokenBytes = randomBytes(32);
    const token = tokenBytes.toString("base64url");

    // Generate QR code ID
    const qrCodeId = randomUUID();

    // Generate identifier (superpower + animal)
    const identifier = generateIdentifier();

    // Set expiration to 1 day from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Create QR code
    const { data: qrCodeData, error: createError } = await supabase
      .from("qr_codes")
      .insert({
        id: qrCodeId,
        token: token,
        organization_id,
        created_by: user.id,
        status: "active",
        is_used: false,
        expires_at: expiresAt.toISOString(),
        identifier: identifier,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating QR code:", createError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al crear el código QR.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: qrCodeData,
        message: "Enlace generado exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating QR code:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear el código QR.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/qr-codes:
 *   get:
 *     summary: Get QR codes for the authenticated user or unvalidated codes for security
 *     description: |
 *       Returns QR codes based on user role:
 *       - Residents: Returns QR codes created by the authenticated user
 *       - Security: Returns unvalidated active QR codes for the organization (requires role=security query param)
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organization_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter QR codes by organization ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [security]
 *         description: User role. Set to "security" to view all unvalidated active codes for the organization
 *         example: "security"
 *     responses:
 *       '200':
 *         description: QR codes retrieved successfully
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
 *                   example: "Códigos QR obtenidos exitosamente."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: QR code details
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       token:
 *                         type: string
 *                       organization_id:
 *                         type: string
 *                         format: uuid
 *                       created_by:
 *                         type: string
 *                         format: uuid
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, used, expired]
 *                       is_used:
 *                         type: boolean
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                       identifier:
 *                         type: string
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
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
    const role = searchParams.get("role");

    // If role is security, return unvalidated QR codes for the organization
    if (role === "security") {
      if (!organizationId) {
        return NextResponse.json(
          {
            error: true,
            message:
              "ID de organización es requerido para usuarios de seguridad.",
          },
          { status: 400 }
        );
      }

      // Check if user has permission to view QR code history
      const { data: hasPermission, error: permissionError } = await supabase.rpc(
        "has_permission",
        {
          p_user_id: user.id,
          p_org_id: organizationId,
          p_permission_code: "qr:view_history",
        }
      );

      if (permissionError || !hasPermission) {
        return NextResponse.json(
          {
            error: true,
            message:
              "No tienes permisos para ver códigos QR de esta organización.",
          },
          { status: 403 }
        );
      }

      // Get unvalidated QR codes (not used, active, not expired)
      const now = new Date().toISOString();
      const { data: qrCodes, error: fetchError } = await supabase
        .from("qr_codes")
        .select("id, identifier, created_by, created_at, expires_at")
        .eq("organization_id", organizationId)
        .eq("is_used", false)
        .eq("status", "active")
        .gt("expires_at", now)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching QR codes:", fetchError);
        return NextResponse.json(
          {
            error: true,
            message: "Error al obtener los códigos QR.",
          },
          { status: 500 }
        );
      }

      // Get unique creator IDs
      const creatorIds = [
        ...new Set((qrCodes || []).map((qr) => qr.created_by).filter(Boolean)),
      ];

      // Fetch creator names
      const creatorsMap = {};
      if (creatorIds.length > 0) {
        await Promise.all(
          creatorIds.map(async (creatorId) => {
            const { data: creatorName, error: creatorError } =
              await supabase.rpc("get_user_name", { p_user_id: creatorId });
            if (!creatorError && creatorName) {
              creatorsMap[creatorId] = creatorName;
            }
          })
        );
      }

      // Format response with creator names
      const formattedCodes = (qrCodes || []).map((qr) => ({
        id: qr.id,
        identifier: qr.identifier,
        created_by: qr.created_by,
        created_by_name: creatorsMap[qr.created_by] || null,
        created_at: qr.created_at,
        expires_at: qr.expires_at,
      }));

      return NextResponse.json(
        {
          error: false,
          data: formattedCodes,
          message: "Códigos QR pendientes obtenidos exitosamente.",
        },
        { status: 200 }
      );
    }

    // Default: Get QR codes for resident (existing behavior)
    // Build query
    let query = supabase
      .from("qr_codes")
      .select(
        "id, token, organization_id, created_by, created_at, updated_at, status, is_used, expires_at, validated_at, validated_by, visitor_name, visitor_id, document_photo_url, identifier"
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: qrCodes, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching QR codes:", fetchError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los códigos QR.",
        },
        { status: 500 }
      );
    }

    // Check expiration status
    const now = new Date();
    const qrCodesWithStatus = (qrCodes || []).map((qr) => {
      const expiresAt = qr.expires_at ? new Date(qr.expires_at) : null;
      let status = qr.status;

      if (qr.is_used) {
        status = "used";
      } else if (expiresAt && now > expiresAt) {
        status = "expired";
      } else if (qr.status === "active") {
        status = "active";
      }

      return {
        ...qr,
        status,
      };
    });

    return NextResponse.json(
      {
        error: false,
        data: qrCodesWithStatus,
        message: "Códigos QR obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching QR codes:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los códigos QR.",
      },
      { status: 500 }
    );
  }
}
