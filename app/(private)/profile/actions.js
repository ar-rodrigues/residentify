"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getBaseUrlFromHeaders } from "@/utils/config/app";

/**
 * Change Password Server Action
 *
 * Allows authenticated users to change their password by verifying their current password first.
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
export async function changePassword(formData) {
  const supabase = await createClient();

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  // Validate inputs
  if (!currentPassword) {
    return {
      error: true,
      message: "Por favor, ingresa tu contraseña actual.",
    };
  }

  if (!newPassword) {
    return {
      error: true,
      message: "Por favor, ingresa tu nueva contraseña.",
    };
  }

  if (!confirmPassword) {
    return {
      error: true,
      message: "Por favor, confirma tu nueva contraseña.",
    };
  }

  // Validate password length
  if (newPassword.length < 6) {
    return {
      error: true,
      message: "La nueva contraseña debe tener al menos 6 caracteres.",
    };
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return {
      error: true,
      message: "Las contraseñas no coinciden.",
    };
  }

  // Verify user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: true,
      message: "No hay una sesión activa. Por favor, inicia sesión nuevamente.",
    };
  }

  if (!user.email) {
    return {
      error: true,
      message: "No se pudo obtener tu email. Por favor, contacta al soporte.",
    };
  }

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return {
      error: true,
      message: getChangePasswordErrorMessage(signInError.message),
    };
  }

  // Check if new password is the same as current password
  if (currentPassword === newPassword) {
    return {
      error: true,
      message: "La nueva contraseña debe ser diferente a la actual.",
    };
  }

  // Update the user's password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      error: true,
      message: getChangePasswordErrorMessage(updateError.message),
    };
  }

  revalidatePath("/profile", "page");
  return {
    error: false,
    message: "Contraseña actualizada exitosamente.",
  };
}

/**
 * Converts Supabase change password error messages to user-friendly Spanish messages
 */
function getChangePasswordErrorMessage(errorMessage) {
  const errorMap = {
    "Invalid login credentials":
      "La contraseña actual no es correcta. Por favor, verifica e intenta nuevamente.",
    "Password should be at least 6 characters":
      "La nueva contraseña debe tener al menos 6 caracteres.",
    "New password should be different from the old password":
      "La nueva contraseña debe ser diferente a la actual.",
    "User not found":
      "No se encontró tu cuenta. Por favor, contacta al soporte.",
    "Email rate limit exceeded":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al cambiar la contraseña. Por favor, intenta nuevamente.";
}

/**
 * Change Email Server Action
 *
 * Allows authenticated users to change their email by verifying their current password first.
 * Supabase will send a confirmation email to the new address that must be verified before the change takes effect.
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
export async function changeEmail(formData) {
  const supabase = await createClient();

  const currentPassword = formData.get("currentPassword");
  const newEmail = formData.get("newEmail");
  const confirmEmail = formData.get("confirmEmail");

  // Validate inputs
  if (!currentPassword) {
    return {
      error: true,
      message: "Por favor, ingresa tu contraseña actual.",
    };
  }

  if (!newEmail) {
    return {
      error: true,
      message: "Por favor, ingresa tu nuevo email.",
    };
  }

  if (!confirmEmail) {
    return {
      error: true,
      message: "Por favor, confirma tu nuevo email.",
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return {
      error: true,
      message: "Por favor, ingresa un email válido.",
    };
  }

  // Validate emails match
  if (newEmail !== confirmEmail) {
    return {
      error: true,
      message: "Los emails no coinciden.",
    };
  }

  // Verify user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: true,
      message: "No hay una sesión activa. Por favor, inicia sesión nuevamente.",
    };
  }

  if (!user.email) {
    return {
      error: true,
      message: "No se pudo obtener tu email. Por favor, contacta al soporte.",
    };
  }

  // Check if new email is the same as current email
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return {
      error: true,
      message: "El nuevo email debe ser diferente al actual.",
    };
  }

  // Verify current password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return {
      error: true,
      message: getChangeEmailErrorMessage(signInError.message),
    };
  }

  // Get the base URL for redirect
  const baseUrl = await getBaseUrlFromHeaders();

  // Update the user's email (Supabase will send a confirmation email)
  // Supabase will automatically add token_hash and type parameters to the redirect URL
  const { error: updateError } = await supabase.auth.updateUser({
    email: newEmail,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm?next=/profile`,
    },
  });

  if (updateError) {
    return {
      error: true,
      message: getChangeEmailErrorMessage(updateError.message),
    };
  }

  revalidatePath("/profile", "page");
  return {
    error: false,
    message:
      "Se ha enviado un correo de confirmación a tu nuevo email. Por favor, verifica tu correo para completar el cambio.",
  };
}

/**
 * Converts Supabase change email error messages to user-friendly Spanish messages
 */
function getChangeEmailErrorMessage(errorMessage) {
  const errorMap = {
    "Invalid login credentials":
      "La contraseña actual no es correcta. Por favor, verifica e intenta nuevamente.",
    "Email already registered":
      "Este email ya está registrado. Por favor, usa otro email.",
    "Invalid email address": "Por favor, ingresa un email válido.",
    "User not found":
      "No se encontró tu cuenta. Por favor, contacta al soporte.",
    "Email rate limit exceeded":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "For security purposes, you can only request this once every 60 seconds":
      "Por seguridad, solo puedes solicitar un cambio de email cada 60 segundos. Por favor, espera un momento.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al cambiar el email. Por favor, intenta nuevamente.";
}
