"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getBaseUrlFromHeaders } from "@/utils/config/app";
import { getErrorMessages } from "@/utils/i18n/errorMessages";

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
  
  // Get locale from headers or default to "es"
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
  const { getChangePasswordErrorMessage, t } = await getErrorMessages(locale);

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  // Validate inputs
  if (!currentPassword) {
    return {
      error: true,
      message: t("profile.password.errors.currentPasswordRequired"),
    };
  }

  if (!newPassword) {
    return {
      error: true,
      message: t("profile.password.errors.newPasswordRequired"),
    };
  }

  if (!confirmPassword) {
    return {
      error: true,
      message: t("profile.password.errors.confirmPasswordRequired"),
    };
  }

  // Validate password length
  if (newPassword.length < 6) {
    return {
      error: true,
      message: t("profile.password.errors.passwordMinLength"),
    };
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return {
      error: true,
      message: t("profile.password.errors.passwordsMismatch"),
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
      message: t("profile.password.errors.noActiveSession"),
    };
  }

  if (!user.email) {
    return {
      error: true,
      message: t("profile.password.errors.cannotGetEmail"),
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
      message: t("profile.password.errors.passwordSameAsCurrent"),
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
    message: t("profile.password.successMessage"),
  };
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
  
  // Get locale from headers or default to "es"
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("pt") ? "pt" : "es";
  const { getChangeEmailErrorMessage, t } = await getErrorMessages(locale);

  const currentPassword = formData.get("currentPassword");
  const newEmail = formData.get("newEmail");
  const confirmEmail = formData.get("confirmEmail");

  // Validate inputs
  if (!currentPassword) {
    return {
      error: true,
      message: t("profile.email.errors.currentPasswordRequired"),
    };
  }

  if (!newEmail) {
    return {
      error: true,
      message: t("profile.email.errors.newEmailRequired"),
    };
  }

  if (!confirmEmail) {
    return {
      error: true,
      message: t("profile.email.errors.confirmEmailRequired"),
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return {
      error: true,
      message: t("profile.email.errors.invalidEmail"),
    };
  }

  // Validate emails match
  if (newEmail !== confirmEmail) {
    return {
      error: true,
      message: t("profile.email.errors.emailsMismatch"),
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
      message: t("profile.email.errors.noActiveSession"),
    };
  }

  if (!user.email) {
    return {
      error: true,
      message: t("profile.email.errors.cannotGetEmail"),
    };
  }

  // Check if new email is the same as current email
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return {
      error: true,
      message: t("profile.email.errors.emailSameAsCurrent"),
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
    message: t("profile.email.successMessage"),
  };
}
