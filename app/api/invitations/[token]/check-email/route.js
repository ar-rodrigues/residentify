import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/invitations/{token}/check-email:
 *   get:
 *     summary: Verify invitation email
 *     description: Check if the email in the invitation corresponds to an existing user and check their login status.
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
 *         description: Email and user status
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
 *                         email: { type: string, format: email }
 *                         user_exists: { type: boolean }
 *                         is_logged_in: { type: boolean }
 *                         email_matches: { type: boolean }
 *                         is_already_member: { type: boolean }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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

    // Check if user is already a member of this organization (if logged in and email matches)
    let isAlreadyMember = false;
    if (isLoggedIn && emailMatches && invitation.organization_id) {
      const { data: memberCheck, error: memberError } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", invitation.organization_id)
        .eq("user_id", user.id)
        .single();

      // If member exists (no error or found), user is already a member
      // PGRST116 means no rows found, which is fine - user is not a member
      isAlreadyMember = !memberError && !!memberCheck;
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          email: invitation.email,
          user_exists: userExists || false,
          is_logged_in: isLoggedIn,
          email_matches: emailMatches,
          user_id: emailMatches ? user.id : null,
          is_already_member: isAlreadyMember,
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







