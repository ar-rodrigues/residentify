import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/utils/auth/admin";

/**
 * GET /api/admin/user-flags/[id]
 * Get specific user flag (app-level admin only)
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

    // Check if user is app-level admin
    try {
      await checkIsAdmin(user.id);
    } catch (adminError) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos de administrador.",
        },
        { status: 403 }
      );
    }

    // Validate flag ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Fetch user flag
    const { data: userFlag, error: flagError } = await supabase
      .from("user_flags")
      .select(
        `
        id,
        user_id,
        feature_flag_id,
        enabled,
        created_at,
        updated_at,
        feature_flags(
          id,
          name,
          description
        )
      `
      )
      .eq("id", id)
      .single();

    if (flagError) {
      if (flagError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error fetching user flag:", flagError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: userFlag,
        message: "Bandera de usuario obtenida exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/user-flags/[id]
 * Update user flag enabled status (app-level admin only)
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

    // Check if user is app-level admin
    try {
      await checkIsAdmin(user.id);
    } catch (adminError) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos de administrador.",
        },
        { status: 403 }
      );
    }

    // Validate flag ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        {
          error: true,
          message: "El estado enabled debe ser un booleano.",
        },
        { status: 400 }
      );
    }

    // Update user flag
    const { data: userFlag, error: updateError } = await supabase
      .from("user_flags")
      .update({ enabled })
      .eq("id", id)
      .select(
        `
        id,
        user_id,
        feature_flag_id,
        enabled,
        created_at,
        updated_at,
        feature_flags(
          id,
          name,
          description
        )
      `
      )
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error updating user flag:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: userFlag,
        message: "Bandera de usuario actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/user-flags/[id]
 * Delete user flag (app-level admin only)
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

    // Check if user is app-level admin
    try {
      await checkIsAdmin(user.id);
    } catch (adminError) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos de administrador.",
        },
        { status: 403 }
      );
    }

    // Validate flag ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Delete user flag
    const { error: deleteError } = await supabase
      .from("user_flags")
      .delete()
      .eq("id", id);

    if (deleteError) {
      if (deleteError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error deleting user flag:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Bandera de usuario eliminada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}




