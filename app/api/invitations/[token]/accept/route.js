import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/invitations/[token]/accept
 * Accept an invitation and register/join the organization
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

    // Parse request body
    const body = await request.json();
    const { password, date_of_birth } = body;

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

    // Validate required fields
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        {
          error: true,
          message:
            "La contraseña es requerida y debe tener al menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    if (!date_of_birth || typeof date_of_birth !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "La fecha de nacimiento es requerida.",
        },
        { status: 400 }
      );
    }

    // Validate date of birth format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return NextResponse.json(
        {
          error: true,
          message: "La fecha de nacimiento no es válida.",
        },
        { status: 400 }
      );
    }

    let userId = null;
    let isNewUser = false;

    // Get or create the default "user" role (needed for new users)
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "user")
      .single();

    let roleId = null;
    if (roleError || !roleData) {
      // If role doesn't exist, try to create it
      const { data: createdRole, error: createRoleError } = await supabase
        .from("roles")
        .insert({ name: "user", description: "Default user role" })
        .select()
        .single();

      if (createRoleError || !createdRole) {
        console.error("Error getting/creating user role:", createRoleError);
        return NextResponse.json(
          {
            error: true,
            message:
              "Error al configurar el sistema. Por favor, contacta al administrador.",
          },
          { status: 500 }
        );
      } else {
        roleId = createdRole.id;
      }
    } else {
      roleId = roleData.id;
    }

    // Try to create new user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          first_name: invitation.first_name,
          last_name: invitation.last_name,
        },
      },
    });

    if (authError) {
      // Check if error is because user already exists
      if (
        authError.message.includes("User already registered") ||
        authError.message.includes("already registered")
      ) {
        // User exists - try to sign them in with the provided password
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: invitation.email,
            password,
          });

        if (signInError || !signInData?.user) {
          return NextResponse.json(
            {
              error: true,
              message:
                "Este email ya está registrado. Por favor, inicia sesión y acepta la invitación desde tu cuenta.",
            },
            { status: 400 }
          );
        }

        userId = signInData.user.id;
        isNewUser = false;
      } else {
        console.error("Error creating user:", authError);
        return NextResponse.json(
          {
            error: true,
            message: getSignupErrorMessage(authError.message),
          },
          { status: 400 }
        );
      }
    } else if (authData?.user) {
      userId = authData.user.id;
      isNewUser = true;

      // Create profile for new user using RPC function
      const { error: profileError } = await supabase.rpc(
        "create_user_profile",
        {
          p_user_id: userId,
          p_first_name: invitation.first_name,
          p_last_name: invitation.last_name,
          p_date_of_birth: date_of_birth,
          p_role_id: roleId,
        }
      );

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return NextResponse.json(
          {
            error: true,
            message:
              "Cuenta creada pero hubo un error al crear el perfil. Por favor, contacta al soporte.",
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error: true,
          message:
            "No se pudo crear el usuario. Por favor, intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    // Use database function to add user to organization (bypasses RLS)
    const { data: memberData, error: memberError } = await supabase.rpc(
      "accept_organization_invitation",
      {
        p_token: token,
        p_user_id: userId,
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

    // If new user, they're already signed in from the signup
    // If existing user, they're already signed in from the sign-in check
    // No need to sign in again

    return NextResponse.json(
      {
        error: false,
        data: {
          user_id: userId,
          organization_id: member.organization_id,
          organization_name: invitation.organization_name,
          role_name: invitation.role_name,
          is_new_user: isNewUser,
        },
        message: isNewUser
          ? "Cuenta creada y agregada a la organización exitosamente."
          : "Agregado a la organización exitosamente.",
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

/**
 * Converts Supabase signup error messages to user-friendly Spanish messages
 */
function getSignupErrorMessage(errorMessage) {
  const errorMap = {
    "User already registered":
      "Este email ya está registrado. Por favor, inicia sesión en su lugar.",
    "Password should be at least 6 characters":
      "La contraseña debe tener al menos 6 caracteres.",
    "Invalid email": "El email proporcionado no es válido.",
    "Email rate limit exceeded":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "Signup is disabled":
      "El registro está deshabilitado temporalmente. Por favor, contacta al administrador.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al crear la cuenta. Por favor, intenta nuevamente.";
}
