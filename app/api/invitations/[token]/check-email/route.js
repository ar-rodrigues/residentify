import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/invitations/[token]/check-email
 * Check if the invitation email corresponds to an existing user
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

    // Get invitation email
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

    // Check if user exists
    const { data: userExists, error: checkError } = await supabase.rpc(
      "check_user_exists_by_email",
      { p_email: invitation.email }
    );

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al verificar el usuario.",
        },
        { status: 500 }
      );
    }

    // Check if current user is logged in and their email matches
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoggedIn = !!user;
    const emailMatches =
      isLoggedIn &&
      user.email?.toLowerCase() === invitation.email.toLowerCase();

    return NextResponse.json(
      {
        error: false,
        data: {
          email: invitation.email,
          user_exists: userExists || false,
          is_logged_in: isLoggedIn,
          email_matches: emailMatches,
          user_id: emailMatches ? user.id : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error checking email:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al verificar el email.",
      },
      { status: 500 }
    );
  }
}


