import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/qr-codes/validate/[token]
 * Get QR code by token (for security to view before validation)
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

    // Check if user is security of the organization
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
      .eq("organization_id", qrCode.organization_id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "security")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para validar este código. Debes ser personal de seguridad de la organización.",
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
 * POST /api/qr-codes/validate/[token]
 * Validate token, add visitor info, create access log, mark as used
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

    if (!visitor_id || typeof visitor_id !== "string" || visitor_id.trim().length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "El ID del visitante es requerido.",
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

    // Check if user is security of the organization
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
      .eq("organization_id", qrCode.organization_id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "security")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para validar este código. Debes ser personal de seguridad de la organización.",
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
        visitor_id: visitor_id.trim(),
        document_photo_url: document_photo_url || null,
        is_used: true,
        status: "used",
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

