import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";

/**
 * GET /api/organizations/[id]
 * Get organization details by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await getOrganizationById(id);

    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        data: result.data,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la organización.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization (admin only)
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

    // Validate organization ID (UUID format)
    const { validateUUID } = await import("@/utils/validation/uuid");
    const uuidValidation = validateUUID(id, "organización");
    if (uuidValidation) {
      return NextResponse.json(
        {
          error: uuidValidation.error,
          message: uuidValidation.message,
        },
        { status: uuidValidation.status }
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

    // Check if user is admin of the organization
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
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "admin")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para editar esta organización. Solo los administradores pueden editar organizaciones.",
        },
        { status: 403 }
      );
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from("organizations")
      .update({ name: trimmedName })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating organization:", updateError);

      // Handle specific database errors
      if (updateError.code === "23505") {
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
          message: "Error al actualizar la organización.",
        },
        { status: 500 }
      );
    }

    if (!updatedOrg) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo actualizar la organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedOrg,
        message: "Organización actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la organización.",
      },
      { status: 500 }
    );
  }
}
