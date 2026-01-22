/// <reference path="../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/general-invite-links/{token}:
 *   get:
 *     summary: Validate general invite link
 *     description: Public endpoint to validate and get general invite link details. Does not expose organization ID for security.
 *     tags: [General Invite Links]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invite link token
 *     responses:
 *       200:
 *         description: Link details
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
 *                         id: { type: string, format: uuid }
 *                         organization_name: { type: string }
 *                         organization_role_id: { type: integer }
 *                         seat_type:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             description: { type: string, nullable: true }
 *                         requires_approval: { type: boolean }
 *                         expires_at: { type: string, format: date-time, nullable: true }
 *                         is_expired: { type: boolean }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       410:
 *         description: GONE - Invite link expired
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    // Validate token
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Token de enlace inválido.",
        },
        { status: 400 }
      );
    }

    // Get general invite link details with seat type information
    const { data: linkData, error: linkError } = await supabase
      .from("general_invite_links")
      .select(`
        id,
        organization_id,
        seat_type_id,
        token,
        requires_approval,
        expires_at,
        created_at,
        updated_at,
        seat_types(
          id,
          name,
          description
        ),
        organizations(
          name
        )
      `)
      .eq("token", token)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json(
        {
          error: true,
          message: "Enlace de invitación no encontrado o token inválido.",
        },
        { status: 404 }
      );
    }

    // Check if link is expired
    const isExpired = linkData.expires_at && new Date(linkData.expires_at) < new Date();
    if (isExpired) {
      return NextResponse.json(
        {
          error: true,
          message: "Este enlace de invitación ha expirado.",
        },
        { status: 410 }
      );
    }

    // Build seat type information
    const seatType = linkData.seat_types ? {
      id: linkData.seat_types.id,
      name: linkData.seat_types.name,
      description: linkData.seat_types.description,
    } : null;

    // Return link details without exposing organization ID
    return NextResponse.json(
      {
        error: false,
        data: {
          id: linkData.id,
          organization_name: linkData.organizations?.name || null,
          seat_type: seatType,
          requires_approval: linkData.requires_approval,
          expires_at: linkData.expires_at,
          is_expired: isExpired,
        },
        message: "Enlace de invitación válido.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching general invite link:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al validar el enlace de invitación.",
      },
      { status: 500 }
    );
  }
}
