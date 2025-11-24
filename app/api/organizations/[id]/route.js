import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organizations/[id]
 * Get organization details by ID
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

    // Validate organization ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización inválido.",
        },
        { status: 400 }
      );
    }

    // First, get the organization (RLS will check if user is a member)
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, created_by, created_at, updated_at")
      .eq("id", id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);

      if (orgError.code === "PGRST116") {
        // Not found
        return NextResponse.json(
          {
            error: true,
            message: "Organización no encontrada o no tienes acceso a ella.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener la organización.",
        },
        { status: 500 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        {
          error: true,
          message: "Organización no encontrada.",
        },
        { status: 404 }
      );
    }

    // Get user's membership separately (using the "own memberships" policy to avoid recursion)
    const { data: userMember, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        organization_roles(
          id,
          name,
          description
        )
      `
      )
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine - user might not be a member
      console.error("Error fetching user membership:", memberError);
    }

    // Check if user is admin
    const isAdmin = userMember?.organization_roles?.name === "admin" || false;
    const userRole = userMember?.organization_roles?.name || null;

    // Get creator's name using RPC function (bypasses RLS)
    const { data: creatorName, error: creatorError } = await supabase.rpc(
      "get_user_name",
      { p_user_id: organization.created_by }
    );

    if (creatorError) {
      console.error("Error fetching creator name:", creatorError);
      // Continue without creator name if there's an error
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          id: organization.id,
          name: organization.name,
          created_by: organization.created_by,
          created_by_name: creatorName,
          created_at: organization.created_at,
          updated_at: organization.updated_at,
          userRole,
          isAdmin,
        },
      },
      { status: 200 }
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

    // Validate organization ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización inválido.",
        },
        { status: 400 }
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

