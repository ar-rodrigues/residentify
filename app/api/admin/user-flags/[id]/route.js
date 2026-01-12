import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/utils/auth/admin";

/**
 * @swagger
 * /api/admin/user-flags/{id}:
 *   get:
 *     summary: Get a user flag override
 *     description: Get details of a specific user feature flag override. Requires app-level administrator permissions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User flag ID
 *     responses:
 *       200:
 *         description: User flag details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserFeatureFlags'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Fetch user flag
    const { data: userFlag, error: flagError } = await supabase
      .from("user_flags")
      .select(
        `
        id,
        user_id,
        feature_flag_id,
        enabled,
        created_at,
        updated_at,
        feature_flags(
          id,
          name,
          description
        )
      `
      )
      .eq("id", id)
      .single();

    if (flagError) {
      if (flagError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error fetching user flag:", flagError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: userFlag,
        message: "Bandera de usuario obtenida exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/user-flags/{id}:
 *   put:
 *     summary: Update a user flag override
 *     description: Update the enabled status of a specific user feature flag override. Requires app-level administrator permissions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User flag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User flag updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserFeatureFlags'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        {
          error: true,
          message: "El estado enabled debe ser un booleano.",
        },
        { status: 400 }
      );
    }

    // Update user flag
    const { data: userFlag, error: updateError } = await supabase
      .from("user_flags")
      .update({ enabled })
      .eq("id", id)
      .select(
        `
        id,
        user_id,
        feature_flag_id,
        enabled,
        created_at,
        updated_at,
        feature_flags(
          id,
          name,
          description
        )
      `
      )
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error updating user flag:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: userFlag,
        message: "Bandera de usuario actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/user-flags/{id}:
 *   delete:
 *     summary: Delete a user flag override
 *     description: Delete a specific user feature flag override. Requires app-level administrator permissions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User flag ID
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
          message: "ID de bandera de usuario inválido.",
        },
        { status: 400 }
      );
    }

    // Delete user flag
    const { error: deleteError } = await supabase
      .from("user_flags")
      .delete()
      .eq("id", id);

    if (deleteError) {
      if (deleteError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: true,
            message: "Bandera de usuario no encontrada.",
          },
          { status: 404 }
        );
      }

      console.error("Error deleting user flag:", deleteError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al eliminar la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Bandera de usuario eliminada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error deleting user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al eliminar la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}




