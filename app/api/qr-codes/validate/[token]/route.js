/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/qr-codes/validate/{token}:
 *   get:
 *     summary: Validate QR code token
 *     description: Public endpoint to validate a QR code token and get its details. Only security members of the organization can perform this action.
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code token
 *     responses:
 *       200:
 *         description: QR code is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/QrCodes'
 *       400:
 *         description: QR code already used or expired
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;

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

    // Validate token
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Token inválido.",
        },
        { status: 400 }
      );
    }

    // Get QR code by token
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, token, organization_id, created_by, created_at, status, is_used, expires_at")
      .eq("token", token)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json(
        {
          error: true,
          message: "Token no encontrado o inválido.",
        },
        { status: 404 }
      );
    }

    // Check if user has permission to validate QR codes
    const { data: hasPermission, error: permissionError } = await supabase.rpc(
      "has_permission",
      {
        p_user_id: user.id,
        p_org_id: qrCode.organization_id,
        p_permission_code: "qr:validate",
      }
    );

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para validar este código.",
        },
        { status: 403 }
      );
    }

    // Check if already used
    if (qrCode.is_used) {
      return NextResponse.json(
        {
          error: true,
          message: "Este código ya ha sido utilizado.",
          data: qrCode,
        },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = qrCode.expires_at ? new Date(qrCode.expires_at) : null;
    if (expiresAt && now > expiresAt) {
      return NextResponse.json(
        {
          error: true,
          message: "Este código ha expirado.",
          data: qrCode,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: qrCode,
        message: "Código QR válido.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching QR code by token:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener el código QR.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/qr-codes/validate/{token}:
 *   post:
 *     summary: Record QR code validation
 *     description: Validate a QR code token, record visitor info, and create an access log. Only security members of the organization can perform this action.
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visitor_name]
 *             properties:
 *               visitor_name: { type: string }
 *               visitor_id: { type: string, description: "Required if document_photo_url is missing" }
 *               document_photo_url: { type: string, description: "Required if visitor_id is missing" }
 *               entry_type: { type: string, enum: [entry, exit], default: entry }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Validation recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         qr_code: { $ref: '#/components/schemas/QrCodes' }
 *                         access_log: { type: object }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;

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

    // Validate token
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Token inválido.",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { visitor_name, visitor_id, document_photo_url, entry_type = "entry", notes = null } = body;

    // Validate required fields
    if (!visitor_name || typeof visitor_name !== "string" || visitor_name.trim().length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "El nombre del visitante es requerido.",
        },
        { status: 400 }
      );
    }

    // Require either visitor_id OR document_photo_url
    const hasVisitorId = visitor_id && typeof visitor_id === "string" && visitor_id.trim().length > 0;
    const hasDocumentPhoto = document_photo_url && typeof document_photo_url === "string" && document_photo_url.trim().length > 0;
    
    if (!hasVisitorId && !hasDocumentPhoto) {
      return NextResponse.json(
        {
          error: true,
          message: "Debes proporcionar el número de documento o una foto del documento.",
        },
        { status: 400 }
      );
    }

    // Validate entry_type
    const validEntryTypes = ["entry", "exit"];
    if (!validEntryTypes.includes(entry_type)) {
      return NextResponse.json(
        {
          error: true,
          message: "Tipo de entrada inválido. Debe ser 'entry' o 'exit'.",
        },
        { status: 400 }
      );
    }

    // Get QR code by token
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, token, organization_id, created_by, created_at, status, is_used, expires_at")
      .eq("token", token)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json(
        {
          error: true,
          message: "Token no encontrado o inválido.",
        },
        { status: 404 }
      );
    }

    // Check if user has permission to validate QR codes
    const { data: hasPermission, error: permissionError } = await supabase.rpc(
      "has_permission",
      {
        p_user_id: user.id,
        p_org_id: qrCode.organization_id,
        p_permission_code: "qr:validate",
      }
    );

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para validar este código.",
        },
        { status: 403 }
      );
    }

    // Check if already used
    if (qrCode.is_used) {
      return NextResponse.json(
        {
          error: true,
          message: "Este código ya ha sido utilizado.",
        },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = qrCode.expires_at ? new Date(qrCode.expires_at) : null;
    if (expiresAt && now > expiresAt) {
      return NextResponse.json(
        {
          error: true,
          message: "Este código ha expirado.",
        },
        { status: 400 }
      );
    }

    // Update QR code with visitor info and mark as used
    const { data: updatedQRCode, error: updateError } = await supabase
      .from("qr_codes")
      .update({
        visitor_name: visitor_name.trim(),
        visitor_id: hasVisitorId ? visitor_id.trim() : null,
        document_photo_url: document_photo_url || null,
        is_used: true,
        validated_at: now.toISOString(),
        validated_by: user.id,
      })
      .eq("id", qrCode.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating QR code:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar el código QR.",
        },
        { status: 500 }
      );
    }

    // Create access log entry
    const { data: accessLog, error: logError } = await supabase
      .from("access_logs")
      .insert({
        qr_code_id: qrCode.id,
        scanned_by: user.id,
        organization_id: qrCode.organization_id,
        entry_type: entry_type,
        timestamp: now.toISOString(),
        notes: notes ? notes.trim() : null,
        notification_sent: false,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating access log:", logError);
      // Continue even if log creation fails - QR code is already marked as used
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          qr_code: updatedQRCode,
          access_log: accessLog,
        },
        message: "Código QR validado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error validating QR code:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al validar el código QR.",
      },
      { status: 500 }
    );
  }
}

