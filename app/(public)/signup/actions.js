"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { sendWelcomeEmail } from "@/utils/mailer/mailer";
import { getBaseUrlFromHeaders } from "@/utils/config/app";

export async function signup(formData) {
  const supabase = await createClient();

  // Get form data
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const dateOfBirth = formData.get("dateOfBirth");
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth || !email || !password) {
    return {
      error: true,
      message: "Por favor, completa todos los campos requeridos.",
    };
  }

  // Validate date of birth format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOfBirth)) {
    return {
      error: true,
      message: "La fecha de nacimiento no es válida.",
    };
  }

  // Date validation for future dates is handled on the client side
  // by disabling future dates in the DatePicker component

  // Get or create the default "user" role BEFORE creating auth user
  // This prevents orphaned accounts if role setup fails
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
      // If we can't get or create the role, we cannot proceed
      // Return error BEFORE creating auth user to avoid orphaned accounts
      console.error("Error getting/creating user role:", createRoleError);
      return {
        error: true,
        message:
          "Error al configurar el sistema. Por favor, contacta al administrador o intenta nuevamente más tarde.",
      };
    } else {
      roleId = createdRole.id;
    }
  } else {
    roleId = roleData.id;
  }

  // Ensure we have a valid roleId before proceeding with auth user creation
  if (!roleId) {
    console.error("Critical error: No role ID available");
    return {
      error: true,
      message:
        "Error al configurar el sistema. Por favor, contacta al administrador o intenta nuevamente más tarde.",
    };
  }

  // Now that we have a valid roleId, create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Since email confirmation is disabled, we don't need emailRedirectTo
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (authError) {
    return {
      error: true,
      message: getSignupErrorMessage(authError.message),
    };
  }

  if (!authData.user) {
    return {
      error: true,
      message: "No se pudo crear el usuario. Por favor, intenta nuevamente.",
    };
  }

  // Create profile record
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    role_id: roleId, // roleId is guaranteed to be defined at this point
  });

  if (profileError) {
    // If profile creation fails, try to delete the auth user
    // (Note: This might not always work depending on RLS policies)
    console.error("Error creating profile:", profileError);

    // Return error but don't delete user - they can contact support
    return {
      error: true,
      message:
        "Cuenta creada pero hubo un error al crear el perfil. Por favor, contacta al soporte.",
    };
  }

  // Get the base URL for welcome email
  const baseUrl = await getBaseUrlFromHeaders();

  // Send welcome email (non-blocking - don't fail signup if email fails)
  try {
    const fullName = `${firstName} ${lastName}`;
    await sendWelcomeEmail(email, fullName, password, baseUrl);
    console.log("Welcome email sent successfully to:", email);
  } catch (emailError) {
    // Log the error but don't fail the signup process
    console.error("Error sending welcome email:", {
      email,
      error: emailError.message,
      stack: emailError.stack,
    });
    // User account is already created, so we continue with the signup flow
  }

  revalidatePath("/", "layout");

  // Redirect to success page
  redirect("/signup/success");
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
