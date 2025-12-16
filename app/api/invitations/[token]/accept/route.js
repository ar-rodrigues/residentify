import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getErrorMessages } from "@/utils/i18n/errorMessages";
import { updateMainOrganization } from "@/utils/api/profiles";

/**
 * POST /api/invitations/[token]/accept
 * Accept an invitation and register/join the organization
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { token } = await params;
    
    // Get locale from Accept-Language header or default to "es"
    const acceptLanguage = request.headers.get("accept-language") || "";
    const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
    const { getSignupErrorMessage } = await getErrorMessages(locale);

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

    // Clean up any old accepted invitations for this email/organization
    // NOTE: RLS may block this query from seeing old accepted invitations
    // If cleanup fails due to RLS, we'll catch the constraint violation and handle it
    const { data: cleanupData, error: cleanupError } = await supabase
      .from("organization_invitations")
      .update({ status: "cancelled" })
      .eq("organization_id", invitation.organization_id)
      .eq("email", invitation.email)
      .eq("status", "accepted")
      .neq("id", invitation.id)
      .select();

    if (cleanupError) {
      console.error("Error cleaning up old accepted invitations (RLS may be blocking):", cleanupError);
      // Continue anyway - we'll handle the constraint violation if it occurs
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
        // Constraint violation: there's an old accepted invitation that RLS blocked us from seeing
        // Try to clean it up using service role client (bypasses RLS)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );

          // Instead of UPDATE (which can hit constraint), DELETE the old accepted invitations
          // This avoids the unique constraint violation during the update operation
          const { data: serviceCleanupData, error: serviceCleanupError } = await serviceClient
            .from("organization_invitations")
            .delete()
            .eq("organization_id", invitation.organization_id)
            .eq("email", invitation.email)
            .eq("status", "accepted")
            .neq("id", invitation.id)
            .select();

          if (!serviceCleanupError && serviceCleanupData && serviceCleanupData.length > 0) {
            // Cleanup succeeded, retry the acceptance
            const { data: retryMemberData, error: retryMemberError } = await supabase.rpc(
              "accept_organization_invitation",
              {
                p_token: token,
                p_user_id: userId,
              }
            );

            if (!retryMemberError && retryMemberData && retryMemberData.length > 0) {
              const member = retryMemberData[0];
              const updateResult = await updateMainOrganization(
                userId,
                member.organization_id
              );

              if (updateResult.error) {
                console.error("Error setting main organization:", updateResult.message);
              }

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
                    ? "Cuenta creada y agregado a la organización exitosamente."
                    : "Agregado a la organización exitosamente.",
                },
                { status: 200 }
              );
            }
          }
        }

        // If cleanup failed or service role not available, return error
        return NextResponse.json(
          {
            error: true,
            message: "Ya eres miembro de esta organización o hay una invitación anterior que necesita ser limpiada.",
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

    // Set the organization as the user's main organization
    // This only happens when invitation status is "accepted" (not pending_approval)
    const updateResult = await updateMainOrganization(
      userId,
      member.organization_id
    );

    if (updateResult.error) {
      // Log the error but don't fail the invitation acceptance
      // The user was added successfully, main org update is secondary
      console.error("Error setting main organization:", updateResult.message);
    }

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
