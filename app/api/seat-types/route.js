/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/seat-types:
 *   get:
 *     summary: List seat types
 *     description: Public endpoint to get available seat types. Can be filtered by organization type.
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: organization_type_id
 *         schema:
 *           type: integer
 *         description: Filter seat types by organization type ID
 *     responses:
 *       200:
 *         description: List of seat types
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
 *                         $ref: '#/components/schemas/SeatTypes'
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const organizationTypeId = searchParams.get("organization_type_id");

    // Build query
    let query = supabase
      .from("seat_types")
      .select("*");

    // Filter by organization type if provided
    if (organizationTypeId) {
      const typeId = parseInt(organizationTypeId, 10);
      if (isNaN(typeId)) {
        return NextResponse.json(
          {
            error: true,
            message: "organization_type_id debe ser un número válido.",
          },
          { status: 400 }
        );
      }
      query = query.eq("organization_type_id", typeId);
    }

    // Order and execute
    const { data: seatTypes, error } = await query.order("id", { ascending: true });

    if (error) {
      console.error("Error fetching seat types:", error);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los tipos de asientos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: seatTypes || [],
        message: "Tipos de asientos obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching seat types:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los tipos de asientos.",
      },
      { status: 500 }
    );
  }
}
