/// <reference path="../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/utils/auth/admin";

/**
 * @swagger
 * /api/admin/user-flags:
 *   get:
 *     summary: List user flag overrides
 *     description: List all user-specific feature flag overrides. Requires app-level administrator permissions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: flag_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by feature flag ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Pagination page
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Pagination size
 *     responses:
 *       200:
 *         description: List of user flag overrides
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
 *                         user_flags:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/UserFeatureFlags'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page: { type: integer }
 *                             page_size: { type: integer }
 *                             total: { type: integer }
 *                             total_pages: { type: integer }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request) {
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

    // Get query parameters for pagination/filtering
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const flagId = searchParams.get("flag_id");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("page_size") || "50");

    let query = supabase
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
      `,
        { count: "exact" }
      );

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (flagId) {
      query = query.eq("feature_flag_id", flagId);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data: userFlags, error: flagsError, count } = await query;

    if (flagsError) {
      console.error("Error fetching user flags:", flagsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener las banderas de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          user_flags: userFlags || [],
          pagination: {
            page,
            page_size: pageSize,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / pageSize),
          },
        },
        message: "Banderas de usuario obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching user flags:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las banderas de usuario.",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/user-flags:
 *   post:
 *     summary: Create or update user flag override
 *     description: Create or update a user-specific feature flag override. Requires app-level administrator permissions.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, feature_flag_id, enabled]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               feature_flag_id:
 *                 type: string
 *                 format: uuid
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User flag override created or updated
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
    const { user_id, feature_flag_id, enabled } = body;

    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de usuario es requerido.",
        },
        { status: 400 }
      );
    }

    if (!feature_flag_id || typeof feature_flag_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de bandera es requerido.",
        },
        { status: 400 }
      );
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        {
          error: true,
          message: "El estado enabled debe ser un booleano.",
        },
        { status: 400 }
      );
    }

    // Upsert user flag (insert or update)
    const { data: userFlag, error: upsertError } = await supabase
      .from("user_flags")
      .upsert(
        {
          user_id,
          feature_flag_id,
          enabled,
        },
        {
          onConflict: "user_id,feature_flag_id",
        }
      )
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

    if (upsertError) {
      console.error("Error upserting user flag:", upsertError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al crear o actualizar la bandera de usuario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: userFlag,
        message: "Bandera de usuario creada/actualizada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error upserting user flag:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear o actualizar la bandera de usuario.",
      },
      { status: 500 }
    );
  }
}




