import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/utils/auth/admin";

/**
 * GET /api/admin/feature-flags
 * List all feature flags (app-level admin only)
 */
export async function GET() {
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

    // Fetch all feature flags
    const { data: flags, error: flagsError } = await supabase
      .from("feature_flags")
      .select("id, name, description, created_at, updated_at")
      .order("name", { ascending: true });

    if (flagsError) {
      console.error("Error fetching feature flags:", flagsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener las banderas.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: flags || [],
        message: "Banderas obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching feature flags:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las banderas.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Create new feature flag (app-level admin only)
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

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          error: true,
          message: "El nombre de la bandera es requerido.",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Create feature flag
    const { data: flag, error: createError } = await supabase
      .from("feature_flags")
      .insert({
        name: trimmedName,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating feature flag:", createError);

      if (createError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          {
            error: true,
            message: "Ya existe una bandera con ese nombre.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al crear la bandera.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: flag,
        message: "Bandera creada exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating feature flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear la bandera.",
      },
      { status: 500 }
    );
  }
}


