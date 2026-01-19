/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";
import { sendInvitationEmail } from "@/utils/mailer/mailer";
import { getBaseUrlFromHeaders } from "@/utils/config/app";
import { getLocaleFromRequest } from "@/utils/i18n/request";
import messagesEs from "@/messages/es.json";
import messagesPt from "@/messages/pt.json";

/**
 * @swagger
 * /api/organizations/{id}/invitations:
 *   post:
 *     summary: Create a new invitation for an organization (admin only)
 *     tags: [Organizations, Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - organization_role_id
 *             properties:
 *               first_name: { type: 'string' }
 *               last_name: { type: 'string' }
 *               email: { type: 'string', format: 'email' }
 *               organization_role_id: { type: 'integer' }
 *               description: { type: 'string' }
 *     responses:
 *       '201':
 *         description: Invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: 'boolean' }
 *                 message: { type: 'string' }
 *                 data:
 *                   $ref: '#/components/schemas/OrganizationInvitations'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '409':
 *         description: Pending invitation already exists for this email
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Authenticate user
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

    // Validate organization ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización inválido.",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { first_name, last_name, email, seat_type_id, description } =
      body;

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

    if (!seat_type_id || typeof seat_type_id !== "number") {
      return NextResponse.json(
        {
          error: true,
          message: "El tipo de asiento es requerido.",
        },
        { status: 400 }
      );
    }

    // Check if user has permission to invite users
    const { data: hasPermission, error: permissionError } = await supabase
      .rpc("has_permission", {
        p_user_id: user.id,
        p_org_id: id,
        p_permission_code: "invites:create",
      });

    if (permissionError || !hasPermission) {
      return NextResponse.json(
        {
          error: true,
          message:
            "No tienes permisos para invitar usuarios.",
        },
        { status: 403 }
      );
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        {
          error: true,
          message: "Organización no encontrada.",
        },
        { status: 404 }
      );
    }

    // Verify seat type exists
    const { data: seatType, error: seatTypeError } = await supabase
      .from("seat_types")
      .select("id, name, description")
      .eq("id", seat_type_id)
      .single();

    if (seatTypeError || !seatType) {
      return NextResponse.json(
        {
          error: true,
          message: "El tipo de asiento especificado no existe.",
        },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("base64url");

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record using RPC function to bypass RLS issues
    const { data: invitationData, error: inviteError } = await supabase.rpc(
      "create_organization_invitation",
      {
        p_organization_id: id,
        p_email: email.trim(),
        p_token: token,
        p_seat_type_id: seat_type_id,
        p_invited_by: user.id,
        p_expires_at: expiresAt.toISOString(),
        p_first_name: first_name.trim(),
        p_last_name: last_name.trim(),
        p_description: description?.trim() || null,
      }
    );

    // The RPC function returns an array, get the first result
    const invitation =
      invitationData && invitationData.length > 0 ? invitationData[0] : null;

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);

      // Handle duplicate invitation error from RPC function
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

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name} ${inviterProfile.last_name}`
      : "Administrador";

    // Get locale from request for email, success message, and invitation link
    const locale = getLocaleFromRequest(request);

    // Get base URL for invitation link
    const baseUrl = await getBaseUrlFromHeaders();
    // Include locale in the invitation link
    const invitationLink = `${baseUrl}/${locale}/invitations/${token}`;

    // Send invitation email - if it fails, delete the invitation and return error
    try {
      await sendInvitationEmail(
        email.trim(),
        first_name.trim(),
        last_name.trim(),
        organization.name,
        seatType.name,
        inviterName,
        invitationLink,
        locale
      );
      console.log("Invitation email sent successfully to:", email);
    } catch (emailError) {
      // Log the error
      console.error("Error sending invitation email:", {
        email,
        error: emailError.message,
        stack: emailError.stack,
      });

      // Delete the invitation since email failed
      const { error: deleteError } = await supabase
        .from("organization_invitations")
        .delete()
        .eq("id", invitation.id);

      if (deleteError) {
        console.error(
          "Error deleting invitation after email failure:",
          deleteError
        );
        // Even if deletion fails, we should still return an error to the user
      }

      // Return error response to inform the user
      return NextResponse.json(
        {
          error: true,
          message:
            "La invitación no pudo ser enviada por correo electrónico. Por favor, verifica la configuración del servidor de correo e intenta nuevamente.",
        },
        { status: 500 }
      );
    }

    // Get translated success message
    const successMessage = getTranslatedMessage(
      locale,
      "organizations.invite.success.message"
    );

    return NextResponse.json(
      {
        error: false,
        data: invitation,
        message: successMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating invitation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear la invitación.",
      },
      { status: 500 }
    );
  }
}

/**
 * Get translated message for a given locale and key
 * @param {string} locale - The locale code
 * @param {string} key - The translation key (e.g., "organizations.invite.success.message")
 * @returns {string} The translated message
 */
function getTranslatedMessage(locale, key) {
  // Normalize locale
  const normalizedLocale = locale === "pt" ? "pt" : "es";

  // Use static imports for known locales
  const messages = normalizedLocale === "pt" ? messagesPt : messagesEs;

  // Navigate through the nested object using the key path
  const keys = key.split(".");
  let value = messages;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      return key; // Return key if translation not found
    }
  }
  return value || key;
}
