import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organizations/{id}/chat/roles:
 *   get:
 *     summary: List roles available for chat
 *     description: Get a list of roles the current user has permission to message in the organization.
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
 *         description: List of roles
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
 *                         roles: { type: array, items: { type: object } }
 *                         total: { type: integer }
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
      .select("id, organization_role_id")
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

    // Get organization type to fetch roles
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

    // Check permissions for each role in parallel
    const permissionChecks = await Promise.all(
      (roles || []).map((role) =>
        supabase
          .rpc("can_user_message_role", {
            p_user_id: user.id,
            p_role_id: role.id,
            p_organization_id: id,
          })
          .then(({ data, error }) => ({
            role,
            canMessage: !error && (data || false),
          }))
          .catch(() => ({ role, canMessage: false }))
      )
    );

    // Filter roles where permission is granted
    const availableRoles = permissionChecks
      .filter(({ canMessage }) => canMessage)
      .map(({ role }) => role);

    return NextResponse.json(
      {
        error: false,
        data: {
          roles: availableRoles,
          total: availableRoles.length,
        },
        message: "Roles obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching roles:", {
      error,
      message: error.message,
      stack: error.stack,
      name: error.name,
      organizationId: id,
    });
    return NextResponse.json(
      {
        error: true,
        message: error.message || "Error inesperado al obtener los roles.",
      },
      { status: 500 }
    );
  }
}








