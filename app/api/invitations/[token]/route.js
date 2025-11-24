import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/invitations/[token]
 * Get invitation details by token (public access for registration page)
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

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < now) {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ha expirado.",
          data: {
            expired: true,
            expires_at: invitation.expires_at,
          },
        },
        { status: 410 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ya ha sido aceptada o cancelada.",
          data: {
            status: invitation.status,
          },
        },
        { status: 410 }
      );
    }

    // Get inviter's name
    let inviterName = "Administrador";
    if (invitation.invited_by) {
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", invitation.invited_by)
        .single();

      if (inviterProfile) {
        inviterName = `${inviterProfile.first_name} ${inviterProfile.last_name}`;
      }
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          id: invitation.id,
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          description: invitation.description,
          organization: {
            id: invitation.organization_id,
            name: invitation.organization_name,
          },
          role: {
            id: invitation.role_id,
            name: invitation.role_name,
            description: invitation.role_description,
          },
          inviter_name: inviterName,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
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
