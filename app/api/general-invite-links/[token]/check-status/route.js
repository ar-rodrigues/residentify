import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/general-invite-links/[token]/check-status
 * Check if user is logged in and if they are already a member of the organization
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

    // Check if current user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoggedIn = !!user;

    // If user is logged in, get their profile and check membership
    let userEmail = null;
    let userName = null;
    let isAlreadyMember = false;

    if (isLoggedIn && user.id) {
      // Get user email from auth
      userEmail = user.email;

      // Get user profile (first_name, last_name)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        const firstName = profile.first_name || "";
        const lastName = profile.last_name || "";
        userName = `${firstName} ${lastName}`.trim() || null;
      }

      // Check if user is already a member of this organization
      const { data: memberCheck, error: memberError } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", link.organization_id)
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
          is_logged_in: isLoggedIn,
          is_already_member: isAlreadyMember,
          user_id: isLoggedIn ? user.id : null,
          user_email: userEmail,
          user_name: userName,
          organization_id: link.organization_id,
          organization_name: link.organization_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error checking status:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al verificar el estado.",
      },
      { status: 500 }
    );
  }
}





