import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/utils/auth/admin";

/**
 * GET /api/admin/feature-flags/[id]
 * Get specific feature flag (app-level admin only)
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
          message: "ID de bandera inválido.",
        },
        { status: 400 }
      );
    }

    // Fetch feature flag
    const { data: flag, error: flagError } = await supabase
      .from("feature_flags")
      .select("id, name, description, created_at, updated_at")
      .eq("id", id)
      .single();

    if (flagError) {
      if (flagError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error fetching feature flag:", flagError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener la bandera.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: flag,
        message: "Bandera obtenida exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching feature flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la bandera.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feature-flags/[id]
 * Update feature flag (app-level admin only)
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
          message: "ID de bandera inválido.",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    const updateData = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          {
            error: true,
            message: "El nombre de la bandera es requerido.",
          },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Update feature flag
    const { data: flag, error: updateError } = await supabase
      .from("feature_flags")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera no encontrada.",
          },
          { status: 404 }
        );
      }

      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error: true,
            message: "Ya existe una bandera con ese nombre.",
          },
          { status: 409 }
        );
      }

      console.error("Error updating feature flag:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar la bandera.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: flag,
        message: "Bandera actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating feature flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la bandera.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feature-flags/[id]
 * Delete feature flag (app-level admin only)
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
          message: "ID de bandera inválido.",
        },
        { status: 400 }
      );
    }

    // Delete feature flag (cascade will delete user_flags)
    const { error: deleteError } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", id);

    if (deleteError) {
      if (deleteError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error deleting feature flag:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar la bandera.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Bandera eliminada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting feature flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar la bandera.",
      },
      { status: 500 }
    );
  }
}




