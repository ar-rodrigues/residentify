/// <reference path="../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/invitations/{token}:
 *   get:
 *     summary: Get invitation details
 *     description: Public endpoint to get invitation details by token for the registration/join page.
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation details
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
 *                         email: { type: string, format: email }
 *                         organization:
 *                           type: object
 *                           properties:
 *                             id: { type: string, format: uuid }
 *                             name: { type: string }
 *                         seat_type:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             description: { type: string, nullable: true }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       410:
 *         description: GONE - Invitation expired or used
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
          message: "Token de invitación inválido.",
        },
        { status: 400 }
      );
    }

    // Fetch invitation using RPC function to bypass RLS
    // This allows public access to invitation details by token
    const { data: invitationData, error: inviteError } = await supabase.rpc(
      "get_invitation_by_token",
      { p_token: token }
    );

    if (inviteError || !invitationData || invitationData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Invitación no encontrada o token inválido.",
        },
        { status: 404 }
      );
    }

    const invitation = invitationData[0];

    // Fetch full invitation with seat type information
    const { data: fullInvitation, error: fullInviteError } = await supabase
      .from("organization_invitations")
      .select(`
        id,
        email,
        first_name,
        last_name,
        description,
        status,
        expires_at,
        created_at,
        organization_id,
        seat_type_id,
        invited_by,
        seat_types(
          id,
          name,
          description
        )
      `)
      .eq("token", token)
      .single();

    if (fullInviteError || !fullInvitation) {
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los detalles de la invitación.",
        },
        { status: 500 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(fullInvitation.expires_at);
    if (expiresAt < now) {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ha expirado.",
          data: {
            expired: true,
            expires_at: fullInvitation.expires_at,
          },
        },
        { status: 410 }
      );
    }

    // Check if invitation is already accepted
    if (fullInvitation.status !== "pending") {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ya ha sido aceptada o cancelada.",
          data: {
            status: fullInvitation.status,
          },
        },
        { status: 410 }
      );
    }

    // Get inviter's name
    let inviterName = "Administrador";
    if (fullInvitation.invited_by) {
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", fullInvitation.invited_by)
        .single();

      if (inviterProfile) {
        inviterName = `${inviterProfile.first_name} ${inviterProfile.last_name}`;
      }
    }

    // Get organization name
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", fullInvitation.organization_id)
      .single();

    // Build seat type information
    const seatType = fullInvitation.seat_types ? {
      id: fullInvitation.seat_types.id,
      name: fullInvitation.seat_types.name,
      description: fullInvitation.seat_types.description,
    } : null;

    return NextResponse.json(
      {
        error: false,
        data: {
          id: fullInvitation.id,
          email: fullInvitation.email,
          first_name: fullInvitation.first_name,
          last_name: fullInvitation.last_name,
          description: fullInvitation.description,
          organization: {
            id: fullInvitation.organization_id,
            name: orgData?.name || invitation.organization_name,
          },
          seat_type: seatType,
          inviter_name: inviterName,
          expires_at: fullInvitation.expires_at,
          created_at: fullInvitation.created_at,
        },
        message: "Invitación obtenida exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la invitación.",
      },
      { status: 500 }
    );
  }
}
