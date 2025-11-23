"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Reset Password Server Action
 * 
 * Updates the user's password after token verification.
 * 
 * KNOWN ISSUE - Supabase Warning:
 * After calling updateUser(), you may see a warning:
 * "Using the user object as returned from supabase.auth.getSession() could be insecure!"
 * 
 * This is a KNOWN FALSE POSITIVE from Supabase's internal code. The updateUser()
 * method internally uses getSession() in some code paths, which triggers this warning.
 * 
 * Our code is secure - we always use getUser() to verify authentication before
 * calling updateUser(). This warning does not affect functionality and can be safely ignored.
 * 
 * References:
 * - https://github.com/supabase/auth-js/issues/910
 * - https://github.com/supabase/auth-js/issues/873
 */
export async function resetPassword(formData) {
  const supabase = await createClient();

  const password = formData.get("password");
  const token_hash = formData.get("token_hash");
  const type = formData.get("type");

  if (!password) {
    return {
      error: true,
      message: "Por favor, ingresa tu nueva contraseña.",
    };
  }

  if (password.length < 6) {
    return {
      error: true,
      message: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  // If token_hash and type are provided, verify the OTP first
  // This sets the session so updateUser can work
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (verifyError) {
      return {
        error: true,
        message: getResetPasswordErrorMessage(verifyError.message),
      };
    }
  }

  // Always verify user before updating password to ensure authenticated session
  // This prevents security warnings and ensures we have a valid user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: true,
      message:
        "No hay una sesión activa. Por favor, usa el enlace de restablecimiento desde tu correo.",
    };
  }

  // Update the user's password - user is verified and authenticated
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return {
      error: true,
      message: getResetPasswordErrorMessage(error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect("/login?message=password_reset_success");
}

/**
 * Converts Supabase reset password error messages to user-friendly Spanish messages
 */
function getResetPasswordErrorMessage(errorMessage) {
  const errorMap = {
    "Invalid token":
      "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo.",
    "Token has expired":
      "El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo.",
    "Password should be at least 6 characters":
      "La contraseña debe tener al menos 6 caracteres.",
    "New password should be different from the old password":
      "La nueva contraseña debe ser diferente a la anterior.",
    "Unable to validate email address: invalid format":
      "El formato del email no es válido.",
    "User not found": "No se encontró una cuenta con este email.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al restablecer la contraseña. Por favor, intenta nuevamente.";
}

