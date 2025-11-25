import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/organizations
 * Create a new organization and automatically add the creator as admin
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
    const { name } = body;

    // Validate organization name
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "El nombre de la organización es requerido.",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        {
          error: true,
          message:
            "El nombre de la organización debe tener al menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message:
            "El nombre de la organización no puede tener más de 100 caracteres.",
        },
        { status: 400 }
      );
    }

    // Call database function to create organization and add creator as admin atomically
    const { data, error } = await supabase.rpc(
      "create_organization_with_admin",
      {
        org_name: trimmedName,
        creator_user_id: user.id,
      }
    );

    if (error) {
      console.error("Error creating organization:", error);

      // Handle specific database errors
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          {
            error: true,
            message: "Ya existe una organización con ese nombre.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message:
            "Error al crear la organización. Por favor, intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo crear la organización.",
        },
        { status: 500 }
      );
    }

    const result = data[0];

    return NextResponse.json(
      {
        error: false,
        data: {
          id: result.organization_id,
          name: result.organization_name,
          created_by: result.created_by,
          created_at: result.created_at,
          member: {
            id: result.member_id,
            role_id: result.member_role_id,
            role_name: result.member_role_name,
          },
        },
        message: "Organización creada exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear la organización.",
      },
      { status: 500 }
    );
  }
}


