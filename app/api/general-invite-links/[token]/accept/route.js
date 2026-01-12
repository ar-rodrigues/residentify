import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getErrorMessages } from "@/utils/i18n/errorMessages";
import { updateMainOrganization } from "@/utils/api/profiles";
import crypto from "crypto";

/**
 * @swagger
 * /api/general-invite-links/{token}/accept:
 *   post:
 *     summary: Accept general invite link
 *     description: Create a new account (if needed) and join an organization via a general invite link.
 *     tags: [General Invite Links]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invite link token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password, date_of_birth]
 *             properties:
 *               email: { type: string, format: email }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               password: { type: string, minLength: 6 }
 *               date_of_birth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Account created or joined successfully
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
 *                         user_id: { type: string, format: uuid }
 *                         invitation_id: { type: string, format: uuid }
 *                         status: { type: string }
 *                         requires_approval: { type: boolean }
 *                         organization_name: { type: string }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Conflict - Already member or pending request
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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

    // Parse request body
    const body = await request.json();
    const { email, first_name, last_name, password, date_of_birth } = body;

    // Validate required fields
    if (!first_name || typeof first_name !== "string" || !first_name.trim()) {
      return NextResponse.json(
        {
          error: true,
          message: "El nombre es requerido.",
        },
        { status: 400 }
      );
    }

    if (!last_name || typeof last_name !== "string" || !last_name.trim()) {
      return NextResponse.json(
        {
          error: true,
          message: "El apellido es requerido.",
        },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        {
          error: true,
          message: "El email es requerido.",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        {
          error: true,
          message: "La contraseña es requerida y debe tener al menos 6 caracteres.",
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          error: true,
          message: "El formato del email no es válido.",
        },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const { data: userExists, error: checkError } = await supabase.rpc(
      "check_user_exists_by_email",
      { p_email: email.trim().toLowerCase() }
    );

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
    }

    // Get or create the default "user" role (needed for new users)
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "user")
      .single();

    let roleId = null;
    if (roleError || !roleData) {
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

    let userId = null;
    let isNewUser = false;

    // Check if user already exists
    if (userExists) {
      // User exists - authenticate them
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError || !signInData?.user) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Este email ya está registrado. Por favor, verifica tu contraseña o inicia sesión.",
          },
          { status: 400 }
        );
      }

      userId = signInData.user.id;
      isNewUser = false;
    } else {
      // Create new user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
          },
        },
      });

      if (authError) {
        console.error("Error creating user:", authError);
        return NextResponse.json(
          {
            error: true,
            message: getSignupErrorMessage(authError.message),
          },
          { status: 400 }
        );
      }

      if (!authData?.user) {
        return NextResponse.json(
          {
            error: true,
            message:
              "No se pudo crear el usuario. Por favor, intenta nuevamente.",
          },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      isNewUser = true;

      // Create profile for new user using RPC function
      const { error: profileError } = await supabase.rpc(
        "create_user_profile",
        {
          p_user_id: userId,
          p_first_name: first_name.trim(),
          p_last_name: last_name.trim(),
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
    }

    // Check if user already has a pending invitation for this organization
    const { data: existingInvitation } = await supabase
      .from("organization_invitations")
      .select("id, status")
      .eq("organization_id", link.organization_id)
      .eq("email", email.trim().toLowerCase())
      .in("status", ["pending", "pending_approval"])
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: true,
          message: "Ya tienes una solicitud pendiente para esta organización.",
        },
        { status: 409 }
      );
    }

    // Check if user is already a member of this organization
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", link.organization_id)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        {
          error: true,
          message: "Ya eres miembro de esta organización.",
        },
        { status: 409 }
      );
    }

    // Note: If requires_approval is false, user will be automatically added to organization_members
    // If requires_approval is true, user will only be added when their invitation is approved

    // Generate secure token for the invitation record
    const invitationToken = crypto.randomBytes(32).toString("base64url");

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Determine invitation status based on requires_approval
    // Always use pending_approval if link requires approval, otherwise pending
    const invitationStatus = link.requires_approval
      ? "pending_approval"
      : "pending";

    // Create invitation record using RPC function to bypass RLS
    // This function handles validation and creation atomically
    // Include user_id so we can use it later when approving
    const { data: invitationData, error: inviteError } = await supabase.rpc(
      "create_invitation_from_general_link",
      {
        p_general_invite_link_id: link.id,
        p_email: email.trim(),
        p_token: invitationToken,
        p_first_name: first_name.trim(),
        p_last_name: last_name.trim(),
        p_expires_at: expiresAt.toISOString(),
        p_status: invitationStatus,
        p_user_id: userId,
      }
    );

    // The RPC function returns an array, get the first result
    const invitation =
      invitationData && invitationData.length > 0 ? invitationData[0] : null;

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);

      // Handle specific error codes from the function
      if (inviteError.code === "P0001") {
        return NextResponse.json(
          {
            error: true,
            message: "El enlace de invitación general no existe.",
          },
          { status: 404 }
        );
      }

      if (inviteError.code === "P0002") {
        return NextResponse.json(
          {
            error: true,
            message: "Este enlace de invitación ha expirado.",
          },
          { status: 410 }
        );
      }

      if (inviteError.code === "P0003") {
        return NextResponse.json(
          {
            error: true,
            message: "El estado de la invitación no es válido.",
          },
          { status: 400 }
        );
      }

      // Handle duplicate invitation error
      if (
        inviteError.code === "23505" ||
        inviteError.message?.includes("Ya existe")
      ) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Ya existe una invitación pendiente para este email en esta organización.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: true,
          message:
            inviteError.message ||
            "Error al crear la invitación. Por favor, intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          error: true,
          message: "No se pudo crear la invitación.",
        },
        { status: 500 }
      );
    }

    // If approval is not required, automatically accept the invitation
    // This adds the user to organization_members and updates invitation status to "accepted"
    if (!link.requires_approval) {
      const { data: memberData, error: memberError } = await supabase.rpc(
        "accept_organization_invitation",
        {
          p_token: invitationToken,
          p_user_id: userId,
        }
      );

      if (memberError) {
        // Log the error but don't fail the request
        // The invitation was created successfully and can be manually approved later if needed
        console.error("Error auto-accepting invitation:", memberError);
        console.error(
          "Invitation created but user not automatically added to organization. Invitation ID:",
          invitation.id,
          "User ID:",
          userId
        );

        // Log specific error codes for debugging
        if (memberError.code === "P0001") {
          console.error("Invitation not found or invalid token");
        } else if (memberError.code === "P0002") {
          console.error("Invitation expired");
        } else if (memberError.code === "P0003") {
          console.error("Invitation already accepted or cancelled");
        } else if (memberError.code === "23505") {
          console.error("User is already a member of this organization");
        }
      } else if (memberData && memberData.length > 0) {
        // Successfully added to organization - update invitation status in response
        invitation.status = "accepted";
        
        // Set the organization as the user's main organization
        // Only set when approval is not required (user is automatically added)
        const updateResult = await updateMainOrganization(
          userId,
          link.organization_id
        );

        if (updateResult.error) {
          // Log the error but don't fail the request
          console.error("Error setting main organization:", updateResult.message);
        }
      }
    }

    // Ensure user is signed in
    if (!isNewUser) {
      // Re-authenticate to ensure session is active
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (reAuthError) {
        console.error("Error re-authenticating user:", reAuthError);
        // Continue anyway - user might already be authenticated
      }
    }

    // Return success response
    return NextResponse.json(
      {
        error: false,
        data: {
          user_id: userId,
          invitation_id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          requires_approval: link.requires_approval,
          organization_id: link.organization_id,
          organization_name: link.organization_name,
          is_new_user: isNewUser,
        },
        message: link.requires_approval
          ? "Cuenta creada exitosamente. Tu solicitud está pendiente de aprobación. Te notificaremos cuando sea aprobada."
          : "Cuenta creada y agregada a la organización exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error accepting general invite link:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al aceptar el enlace de invitación.",
      },
      { status: 500 }
    );
  }
}

