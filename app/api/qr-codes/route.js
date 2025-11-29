import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";

/**
 * POST /api/qr-codes
 * Create a new QR code link with unique token
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

    // Check if user is a resident of the organization
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
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "resident")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para crear códigos QR en esta organización. Debes ser residente.",
        },
        { status: 403 }
      );
    }

    // Generate unique token (32 bytes, base64 encoded)
    const tokenBytes = randomBytes(32);
    const token = tokenBytes.toString("base64url");

    // Generate QR code ID
    const qrCodeId = randomUUID();

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
 * GET /api/qr-codes
 * Get QR codes for the authenticated user (resident)
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

    // Build query
    let query = supabase
      .from("qr_codes")
      .select("id, token, organization_id, created_by, created_at, status, is_used, expires_at, validated_at, validated_by")
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

