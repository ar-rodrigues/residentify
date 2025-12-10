"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getErrorMessages } from "@/utils/i18n/errorMessages";

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
  
  // Get locale from headers or default to "es"
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
  const { getResetPasswordErrorMessage } = await getErrorMessages(locale);

  const password = formData.get("password");
  const token_hash = formData.get("token_hash");
  const type = formData.get("type");

  if (!password) {
    return {
      error: true,
      message: getResetPasswordErrorMessage("Password required"),
    };
  }

  if (password.length < 6) {
    return {
      error: true,
      message: getResetPasswordErrorMessage("Password should be at least 6 characters"),
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
      // Map "Token has expired" to "Token expired" for the utility
      const errorMsg = verifyError.message.includes("Token has expired") 
        ? "Token expired" 
        : verifyError.message;
      return {
        error: true,
        message: getResetPasswordErrorMessage(errorMsg),
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
    // Map "Token has expired" to "Token expired" for the utility
    const errorMsg = error.message.includes("Token has expired") 
      ? "Token expired" 
      : error.message;
    return {
      error: true,
      message: getResetPasswordErrorMessage(errorMsg),
    };
  }

  revalidatePath("/", "layout");
  
  // Return success instead of redirecting - let the client handle the redirect
  // This allows showing a success message before redirecting
  // Note: Success message should be handled by the client component using translations
  return {
    error: false,
    message: "Password reset successfully", // This will be translated on the client side
  };
}

