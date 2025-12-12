import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";
import { updateMainOrganization } from "@/utils/api/profiles";

/**
 * PUT /api/profiles/main-organization
 * Update the current user's main organization
 */
export async function PUT(request) {
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

    // Validate organization ID if provided (null is allowed to clear main org)
    if (organization_id !== null && organization_id !== undefined) {
      const uuidValidation = validateUUID(organization_id, "organización");
      if (uuidValidation) {
        return NextResponse.json(
          {
            error: uuidValidation.error,
            message: uuidValidation.message,
          },
          { status: uuidValidation.status }
        );
      }
    }

    // Update main organization
    const result = await updateMainOrganization(
      user.id,
      organization_id || null
    );

    if (result.error) {
      return NextResponse.json(
        {
          error: true,
          message: result.message,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating main organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la organización principal.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profiles/main-organization
 * Get the current user's main organization ID
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

    const { getMainOrganization } = await import("@/utils/api/profiles");
    const result = await getMainOrganization(user.id);

    if (result.error) {
      return NextResponse.json(
        {
          error: true,
          message: result.message,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error getting main organization:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la organización principal.",
      },
      { status: 500 }
    );
  }
}

