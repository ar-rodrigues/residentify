import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/invitations/[token]/accept-logged-in
 * Accept an invitation for a logged-in user (no password needed)
 */
export async function POST(request, { params }) {
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

    // Verify user is authenticated
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

    // Get invitation details
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

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Esta invitación es para otro usuario. Por favor, inicia sesión con el email correcto.",
        },
        { status: 403 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < now) {
      return NextResponse.json(
        {
          error: true,
          message: "Esta invitación ha expirado.",
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
        },
        { status: 410 }
      );
    }

    // Use database function to add user to organization (bypasses RLS)
    const { data: memberData, error: memberError } = await supabase.rpc(
      "accept_organization_invitation",
      {
        p_token: token,
        p_user_id: user.id,
      }
    );

    if (memberError) {
      console.error("Error accepting invitation:", memberError);

      // Handle specific error codes from the function
      if (memberError.code === "P0001") {
        return NextResponse.json(
          {
            error: true,
            message: "Invitación no encontrada o token inválido.",
          },
          { status: 404 }
        );
      }

      if (memberError.code === "P0002") {
        return NextResponse.json(
          {
            error: true,
            message: "Esta invitación ha expirado.",
          },
          { status: 410 }
        );
      }

      if (memberError.code === "P0003") {
        return NextResponse.json(
          {
            error: true,
            message: "Esta invitación ya ha sido aceptada o cancelada.",
          },
          { status: 410 }
        );
      }

      if (memberError.code === "23505") {
        return NextResponse.json(
          {
            error: true,
            message: "Ya eres miembro de esta organización.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message: "Error al aceptar la invitación.",
        },
        { status: 500 }
      );
    }

    if (!memberData || memberData.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo agregar el usuario a la organización.",
        },
        { status: 500 }
      );
    }

    const member = memberData[0];

    return NextResponse.json(
      {
        error: false,
        data: {
          user_id: user.id,
          organization_id: member.organization_id,
          organization_name: invitation.organization_name,
          role_name: invitation.role_name,
          is_new_user: false,
        },
        message: "Agregado a la organización exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error accepting invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al aceptar la invitación.",
      },
      { status: 500 }
    );
  }
}





