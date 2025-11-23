"use server";

import { createClient } from "@/utils/supabase/server";
import { getBaseUrlFromHeaders } from "@/utils/config/app";

export async function forgotPassword(formData) {
  const supabase = await createClient();
  const email = formData.get("email");

  if (!email) {
    return {
      error: true,
      message: "Por favor, ingresa tu dirección de correo electrónico.",
    };
  }

  // Get the base URL for redirect
  const baseUrl = await getBaseUrlFromHeaders();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/reset-password?type=recovery`,
  });

  if (error) {
    return {
      error: true,
      message: getForgotPasswordErrorMessage(error.message),
    };
  }

  // Return success (don't redirect here, let the page handle it)
  return {
    error: false,
    message:
      "Se ha enviado un enlace de restablecimiento a tu correo electrónico.",
  };
}

/**
 * Converts Supabase forgot password error messages to user-friendly Spanish messages
 */
function getForgotPasswordErrorMessage(errorMessage) {
  const errorMap = {
    "User not found":
      "No se encontró una cuenta con este email. Por favor, verifica tu dirección de correo.",
    "Invalid email": "El email proporcionado no es válido.",
    "Email rate limit exceeded":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "For security purposes, you can only request this once every 60 seconds":
      "Por favor, espera un minuto antes de solicitar otro enlace de restablecimiento.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al enviar el enlace de restablecimiento. Por favor, intenta nuevamente.";
}
