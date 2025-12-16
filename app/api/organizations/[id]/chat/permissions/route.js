import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organizations/[id]/chat/permissions
 * Get all role-to-role permissions for the organization
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if user is member of organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres miembro de esta organización.",
        },
        { status: 403 }
      );
    }

    // Get all roles for this organization's type
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("organization_type_id")
      .eq("id", id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        {
          error: true,
          message: "Organización no encontrada.",
        },
        { status: 404 }
      );
    }

    // Get all roles for this organization type
    const { data: roles, error: rolesError } = await supabase
      .from("organization_roles")
      .select("id, name, description")
      .eq("organization_type_id", orgData.organization_type_id)
      .order("id");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los roles.",
        },
        { status: 500 }
      );
    }

    // Get all disabled permissions for this organization
    const { data: disabledPermissions, error: permissionsError } =
      await supabase
        .from("role_chat_permissions")
        .select("sender_role_id, recipient_role_id")
        .eq("organization_id", id);

    if (permissionsError) {
      console.error("Error fetching permissions:", permissionsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los permisos.",
        },
        { status: 500 }
      );
    }

    // Create a set of disabled permission pairs for quick lookup
    const disabledSet = new Set(
      (disabledPermissions || []).map(
        (p) => `${p.sender_role_id}-${p.recipient_role_id}`
      )
    );

    // Build permissions matrix
    const permissions = [];
    for (const senderRole of roles || []) {
      for (const recipientRole of roles || []) {
        const key = `${senderRole.id}-${recipientRole.id}`;
        permissions.push({
          senderRoleId: senderRole.id,
          senderRoleName: senderRole.name,
          recipientRoleId: recipientRole.id,
          recipientRoleName: recipientRole.name,
          disabled: disabledSet.has(key),
        });
      }
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          permissions,
          roles: roles || [],
        },
        message: "Permisos obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching permissions:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los permisos.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]/chat/permissions
 * Update role-to-role permissions (admin only)
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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
            "No tienes permisos para modificar los permisos de chat. Solo los administradores pueden hacerlo.",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { senderRoleId, recipientRoleId, disabled } = body;

    // Validate input
    if (
      typeof senderRoleId !== "number" ||
      typeof recipientRoleId !== "number" ||
      typeof disabled !== "boolean"
    ) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Datos inválidos. Se requieren senderRoleId, recipientRoleId y disabled.",
        },
        { status: 400 }
      );
    }

    if (disabled) {
      // Add entry to disable permission
      const { data, error } = await supabase
        .from("role_chat_permissions")
        .insert({
          organization_id: id,
          sender_role_id: senderRoleId,
          recipient_role_id: recipientRoleId,
        })
        .select()
        .single();

      if (error) {
        // If entry already exists, that's fine (idempotent)
        if (error.code === "23505") {
          return NextResponse.json(
            {
              error: false,
              message: "Permiso deshabilitado exitosamente.",
            },
            { status: 200 }
          );
        }

        console.error("Error adding permission:", error);
        return NextResponse.json(
          {
            error: true,
            message: "Error al deshabilitar el permiso.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: false,
          data,
          message: "Permiso deshabilitado exitosamente.",
        },
        { status: 200 }
      );
    } else {
      // Remove entry to enable permission (back to default)
      const { error } = await supabase
        .from("role_chat_permissions")
        .delete()
        .eq("organization_id", id)
        .eq("sender_role_id", senderRoleId)
        .eq("recipient_role_id", recipientRoleId);

      if (error) {
        console.error("Error removing permission:", error);
        return NextResponse.json(
          {
            error: true,
            message: "Error al habilitar el permiso.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: false,
          message: "Permiso habilitado exitosamente.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Unexpected error updating permissions:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar los permisos.",
      },
      { status: 500 }
    );
  }
}










