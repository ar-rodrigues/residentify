"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return error object instead of throwing
    // This allows the client to handle the error gracefully
    return {
      error: true,
      message: getErrorMessage(error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect("/private");
}

/**
 * Converts Supabase error messages to user-friendly Spanish messages
 */
function getErrorMessage(errorMessage) {
  const errorMap = {
    "Invalid login credentials":
      "Credenciales inválidas. Por favor, verifica tu email y contraseña.",
    "Email not confirmed":
      "Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
    "Too many requests":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "User not found": "No se encontró una cuenta con este email.",
    "Invalid email": "El email proporcionado no es válido.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.";
}

export async function signup(formData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    options: {
      emailRedirectTo: `/auth/confirm?next=/private`,
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    // Return error object instead of throwing
    // This allows the client to handle the error gracefully
    return {
      error: true,
      message: getSignupErrorMessage(error.message),
    };
  }

  // For signup, we might want to show a success message
  // and redirect to a confirmation page or back to login
  revalidatePath("/", "layout");

  // Redirect to login with success message
  redirect("/login?message=signup_success");
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
