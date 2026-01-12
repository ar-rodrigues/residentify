/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserFlags } from "@/utils/featureFlags";

/**
 * @swagger
 * /api/user/flags:
 *   get:
 *     summary: Get user feature flags
 *     description: Get all feature flags with their enabled status for the current authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flags status
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
 *                         flags:
 *                           type: object
 *                           additionalProperties:
 *                             type: boolean
 *                           example: { "chat_enabled": true, "beta_features": false }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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

    // Get user flags using utility function
    const flags = await getUserFlags(user.id);

    return NextResponse.json(
      {
        error: false,
        data: {
          flags: flags,
        },
        message: "Banderas obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching user flags:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las banderas.",
      },
      { status: 500 }
    );
  }
}




