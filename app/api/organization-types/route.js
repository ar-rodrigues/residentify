/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organization-types:
 *   get:
 *     summary: List organization types
 *     description: Public endpoint to get all available organization types.
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: List of types
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           description: { type: string, nullable: true }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all organization types
    // RLS policy allows everyone to read organization types
    const { data: types, error } = await supabase
      .from("organization_types")
      .select("id, name, description")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching organization types:", error);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los tipos de organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: types || [],
        message: "Tipos de organización obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization types:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los tipos de organización.",
      },
      { status: 500 }
    );
  }
}
