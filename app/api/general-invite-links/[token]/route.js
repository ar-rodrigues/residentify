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
 *                         role_name: { type: string }
 *                         role_description: { type: string, nullable: true }
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

    // Get general invite link details using RPC function
    const { data: linkData, error: linkError } = await supabase.rpc(
      "get_general_invite_link_by_token",
      { p_token: token }
    );

    if (linkError || !linkData || linkData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Enlace de invitación no encontrado o token inválido.",
        },
        { status: 404 }
      );
    }

    const link = linkData[0];

    // Check if link is expired
    if (link.is_expired) {
      return NextResponse.json(
        {
          error: true,
          message: "Este enlace de invitación ha expirado.",
        },
        { status: 410 }
      );
    }

    // Return link details without exposing organization ID
    return NextResponse.json(
      {
        error: false,
        data: {
          id: link.id,
          organization_name: link.organization_name,
          organization_role_id: link.organization_role_id,
          role_name: link.role_name,
          role_description: link.role_description,
          requires_approval: link.requires_approval,
          expires_at: link.expires_at,
          is_expired: link.is_expired,
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
