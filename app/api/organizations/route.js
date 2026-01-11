/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateMainOrganization } from "@/utils/api/profiles";

/**
 * POST /api/organizations
 * Create a new organization and automatically add the creator as admin
 *
 * @auth {Session} User must be authenticated
 * @param {import('next/server').NextRequest} request
 * @body {Object} { name: string, organization_type_id?: number } Organization details
 * @response 201 {Organizations} Newly created organization and member info
 * @response 400 {Error} Validation error or organization type not found
 * @response 401 {Error} Not authenticated
 * @response 409 {Error} Organization name already exists
 * @returns {Promise<import('next/server').NextResponse>}
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
    const { name, organization_type_id } = body;

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

    // Validate and get organization type ID
    let finalOrganizationTypeId = null;

    if (organization_type_id) {
      // Validate that organization_type_id is a number
      const typeId = parseInt(organization_type_id, 10);
      if (isNaN(typeId)) {
        return NextResponse.json(
          {
            error: true,
            message:
              "El ID del tipo de organización debe ser un número válido.",
          },
          { status: 400 }
        );
      }

      // Verify that the organization type exists
      const { data: orgType, error: typeError } = await supabase
        .from("organization_types")
        .select("id")
        .eq("id", typeId)
        .single();

      if (typeError || !orgType) {
        return NextResponse.json(
          {
            error: true,
            message: "El tipo de organización especificado no existe.",
          },
          { status: 400 }
        );
      }

      finalOrganizationTypeId = typeId;
    } else {
      // Default to residential type if not provided (for backward compatibility)
      const { data: residentialType, error: residentialError } = await supabase
        .from("organization_types")
        .select("id")
        .eq("name", "residential")
        .single();

      if (residentialError || !residentialType) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Error al obtener el tipo de organización por defecto. Por favor, especifica un tipo de organización.",
          },
          { status: 500 }
        );
      }

      finalOrganizationTypeId = residentialType.id;
    }

    // Call database function to create organization and add creator as admin atomically
    const { data, error } = await supabase.rpc(
      "create_organization_with_admin",
      {
        org_name: trimmedName,
        creator_user_id: user.id,
        p_organization_type_id: finalOrganizationTypeId,
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

    // Set the newly created organization as the user's main organization
    const updateResult = await updateMainOrganization(
      user.id,
      result.organization_id
    );

    if (updateResult.error) {
      // Log the error but don't fail the organization creation
      // The organization was created successfully, main org update is secondary
      console.error("Error setting main organization:", updateResult.message);
    }

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
