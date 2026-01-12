/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organization-roles:
 *   get:
 *     summary: List organization roles
 *     description: Public endpoint to get available organization roles. Can be filtered by organization type.
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: organization_type_id
 *         schema:
 *           type: integer
 *         description: Filter roles by organization type ID
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
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrganizationRoles'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const organizationTypeId = searchParams.get("organization_type_id");

    // Build query
    let query = supabase
      .from("organization_roles")
      .select("id, name, description");

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
    const { data: roles, error } = await query.order("id", { ascending: true });

    if (error) {
      console.error("Error fetching organization roles:", error);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los roles de organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: roles || [],
        message: "Roles obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization roles:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los roles de organización.",
      },
      { status: 500 }
    );
  }
}
