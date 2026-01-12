import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organizations/{id}/chat/permissions:
 *   get:
 *     summary: Get chat permissions
 *     description: Get all role-to-role and role-to-user chat permissions for the organization.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Chat permissions matrix
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         permissions: { type: array, items: { type: object } }
 *                         roleRolePermissions: { type: array, items: { type: object } }
 *                         roles: { type: array, items: { type: object } }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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

    // Get all disabled permissions for this organization (user-to-user)
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

    // Get all role-to-role permissions (for role conversations)
    const { data: roleRolePermissions, error: roleRolePermissionsError } =
      await supabase
        .from("role_chat_role_permissions")
        .select("sender_role_id, recipient_role_id")
        .eq("organization_id", id);

    if (roleRolePermissionsError) {
      console.error("Error fetching role-to-role permissions:", roleRolePermissionsError);
      // Don't fail, just log the error
    }

    // Create a set of disabled permission pairs for quick lookup (user-to-user)
    const disabledSet = new Set(
      (disabledPermissions || []).map(
        (p) => `${p.sender_role_id}-${p.recipient_role_id}`
      )
    );

    // Create a set of disabled role-to-role permission pairs
    // Note: For role-to-role, entries in the table DISABLE permissions (default is allow)
    // So entries = disabled, no entry = enabled
    const roleRoleDisabledSet = new Set(
      (roleRolePermissions || []).map(
        (p) => `${p.sender_role_id}-${p.recipient_role_id}`
      )
    );

    // Build permissions matrix (user-to-user)
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

    // Build role-to-role permissions matrix
    // Note: entries in table = disabled, no entry = enabled (default allow)
    const roleRolePermissionsMatrix = [];
    for (const senderRole of roles || []) {
      for (const recipientRole of roles || []) {
        const key = `${senderRole.id}-${recipientRole.id}`;
        roleRolePermissionsMatrix.push({
          senderRoleId: senderRole.id,
          senderRoleName: senderRole.name,
          recipientRoleId: recipientRole.id,
          recipientRoleName: recipientRole.name,
          enabled: !roleRoleDisabledSet.has(key), // enabled = no entry exists (default allow)
        });
      }
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          permissions,
          roleRolePermissions: roleRolePermissionsMatrix,
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
 * @swagger
 * /api/organizations/{id}/chat/permissions:
 *   put:
 *     summary: Update chat permissions
 *     description: Update role-to-role or user-to-user chat permissions. Only organization administrators can perform this action.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senderRoleId, recipientRoleId, disabled]
 *             properties:
 *               senderRoleId: { type: integer }
 *               recipientRoleId: { type: integer }
 *               disabled: { type: boolean }
 *               isRoleToRole: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
    const { senderRoleId, recipientRoleId, disabled, isRoleToRole } = body;

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

    // Handle role-to-role permissions (for role conversations)
    // Note: Default is ALLOW. Entries in table = DISABLED, no entry = ENABLED
    if (isRoleToRole) {
      if (disabled) {
        // Add entry to disable permission (default is allow, so we insert to block)
        const { data, error } = await supabase
          .from("role_chat_role_permissions")
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
                message: "Permiso de rol a rol deshabilitado exitosamente.",
              },
              { status: 200 }
            );
          }

          console.error("Error adding role-to-role permission (to disable):", error);
          return NextResponse.json(
            {
              error: true,
              message: "Error al deshabilitar el permiso de rol a rol.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            error: false,
            data,
            message: "Permiso de rol a rol deshabilitado exitosamente.",
          },
          { status: 200 }
        );
      } else {
        // Remove entry to enable permission (default is allow, so we delete to unblock)
        const { error } = await supabase
          .from("role_chat_role_permissions")
          .delete()
          .eq("organization_id", id)
          .eq("sender_role_id", senderRoleId)
          .eq("recipient_role_id", recipientRoleId);

        if (error) {
          console.error("Error removing role-to-role permission (to enable):", error);
          return NextResponse.json(
            {
              error: true,
              message: "Error al habilitar el permiso de rol a rol.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            error: false,
            message: "Permiso de rol a rol habilitado exitosamente.",
          },
          { status: 200 }
        );
      }
    }

    // Handle user-to-user permissions (existing logic)
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















