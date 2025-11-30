import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/qr-codes/[id]
 * Get QR code details by ID
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

    // Get QR code (RLS will check if user is the creator or has appropriate permissions)
    const { data: qrCode, error: fetchError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching QR code:", fetchError);

      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Código QR no encontrado o no tienes acceso a él.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener el código QR.",
        },
        { status: 500 }
      );
    }

    if (!qrCode) {
      return NextResponse.json(
        {
          error: true,
          message: "Código QR no encontrado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: qrCode,
        message: "Código QR obtenido exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching QR code:", error);
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
 * PUT /api/qr-codes/[id]
 * Update QR code (revoke, extend, etc.)
 */
export async function PUT(request, { params }) {
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

    // Parse request body
    const body = await request.json();
    const { status, notes, identifier } = body;

    // Get existing QR code to verify ownership
    const { data: existingQR, error: fetchError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError || !existingQR) {
      return NextResponse.json(
        {
          error: true,
          message: "Código QR no encontrado o no tienes permisos para editarlo.",
        },
        { status: 404 }
      );
    }

    // Only allow updates if QR code is not used (unless just updating notes)
    if (existingQR.is_used && status !== existingQR.status) {
      return NextResponse.json(
        {
          error: true,
          message: "No se puede modificar un código QR que ya ha sido usado.",
        },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData = {};

    if (status !== undefined) {
      const validStatuses = ["active", "expired", "revoked", "max_uses_reached"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: true,
            message: "Estado inválido.",
          },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes ? notes.trim() : null;
    }

    if (identifier !== undefined) {
      // Validate identifier: max 100 characters, alphanumeric, spaces, and hyphens
      const trimmedIdentifier = identifier ? identifier.trim() : null;
      if (trimmedIdentifier && trimmedIdentifier.length > 100) {
        return NextResponse.json(
          {
            error: true,
            message: "El identificador no puede tener más de 100 caracteres.",
          },
          { status: 400 }
        );
      }
      if (
        trimmedIdentifier &&
        !/^[a-zA-Z0-9\s\-]+$/.test(trimmedIdentifier)
      ) {
        return NextResponse.json(
          {
            error: true,
            message:
              "El identificador solo puede contener letras, números, espacios y guiones.",
          },
          { status: 400 }
        );
      }
      updateData.identifier = trimmedIdentifier;
    }

    // Update QR code
    // Explicitly select all fields including updated_at
    const { data: updatedQR, error: updateError } = await supabase
      .from("qr_codes")
      .update(updateData)
      .eq("id", id)
      .select("id, token, organization_id, created_by, created_at, updated_at, status, is_used, expires_at, validated_at, validated_by, visitor_name, visitor_id, document_photo_url, identifier")
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

    return NextResponse.json(
      {
        error: false,
        data: updatedQR,
        message: "Código QR actualizado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating QR code:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar el código QR.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qr-codes/[id]
 * Delete QR code (only if not validated)
 */
export async function DELETE(request, { params }) {
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

    // Get existing QR code to verify ownership and validation status
    const { data: existingQR, error: fetchError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError || !existingQR) {
      return NextResponse.json(
        {
          error: true,
          message: "Código QR no encontrado o no tienes permisos para eliminarlo.",
        },
        { status: 404 }
      );
    }

    // Check if QR code has been validated (is_used === true)
    if (existingQR.is_used === true) {
      return NextResponse.json(
        {
          error: true,
          message: "No se puede eliminar un código QR que ya ha sido validado.",
        },
        { status: 400 }
      );
    }

    // Delete the QR code
    const { data: deletedData, error: deleteError } = await supabase
      .from("qr_codes")
      .delete()
      .eq("id", id)
      .select();

    if (deleteError) {
      console.error("Error deleting QR code:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar el código QR.",
        },
        { status: 500 }
      );
    }

    // Check if deletion actually happened (RLS might have blocked it)
    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo eliminar el código QR. Puede que no tengas permisos o que el código ya haya sido validado.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Código QR eliminado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting QR code:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar el código QR.",
      },
      { status: 500 }
    );
  }
}



