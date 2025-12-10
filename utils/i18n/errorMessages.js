"use server";

/**
 * Get translated error messages for API routes and server actions
 * @param {string} locale - The locale code (es or pt)
 * @returns {Object} Object with error message functions
 */
export async function getErrorMessages(locale = "es") {
  // Load translations based on locale
  const messages = await import(`../../messages/${locale}.json`);
  const t = (key) => {
    const keys = key.split(".");
    let value = messages.default;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return {
    // Translation function for direct use
    t: (key) => {
      const keys = key.split(".");
      let value = messages.default;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },

    // Login errors
    getLoginErrorMessage: (errorMessage) => {
      const errorMap = {
        "Invalid login credentials": t("apiErrors.login.invalidCredentials"),
        "Email not confirmed": t("apiErrors.login.emailNotConfirmed"),
        "Too many requests": t("apiErrors.login.tooManyRequests"),
        "User not found": t("apiErrors.login.userNotFound"),
        "Invalid email": t("apiErrors.login.invalidEmail"),
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
          return value;
        }
      }

      return t("apiErrors.login.unexpectedError");
    },

    // Signup errors
    getSignupErrorMessage: (errorMessage) => {
      const errorMap = {
        "User already registered": t("apiErrors.signup.userAlreadyRegistered"),
        "Password should be at least 6 characters": t(
          "apiErrors.signup.passwordMinLength"
        ),
        "Invalid email": t("apiErrors.signup.invalidEmail"),
        "Email rate limit exceeded": t("apiErrors.signup.emailRateLimit"),
        "Signup is disabled": t("apiErrors.signup.signupDisabled"),
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
          return value;
        }
      }

      return t("apiErrors.signup.unexpectedError");
    },

    // Reset password errors
    getResetPasswordErrorMessage: (errorMessage) => {
      const errorMap = {
        "Invalid token": t("apiErrors.resetPassword.invalidToken"),
        "Token expired": t("apiErrors.resetPassword.tokenExpired"),
        "Password should be at least 6 characters": t(
          "apiErrors.resetPassword.passwordMinLength"
        ),
        "Invalid email": t("apiErrors.resetPassword.invalidEmail"),
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
          return value;
        }
      }

      return t("apiErrors.resetPassword.unexpectedError");
    },

    // Profile password errors
    getChangePasswordErrorMessage: (errorMessage) => {
      const errorMap = {
        "Invalid login credentials": t(
          "profile.password.errors.currentPasswordIncorrect"
        ),
        "Password should be at least 6 characters": t(
          "profile.password.errors.passwordMinLength"
        ),
        "New password should be different from the old password": t(
          "profile.password.errors.passwordSameAsCurrent"
        ),
        "User not found": t("profile.password.errors.userNotFound"),
        "Email rate limit exceeded": t(
          "profile.password.errors.tooManyAttempts"
        ),
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
          return value;
        }
      }

      return t("profile.password.errors.genericError");
    },

    // Profile email errors
    getChangeEmailErrorMessage: (errorMessage) => {
      const errorMap = {
        "Invalid login credentials": t(
          "profile.email.errors.currentPasswordIncorrect"
        ),
        "Email already registered": t(
          "profile.email.errors.emailAlreadyRegistered"
        ),
        "Invalid email address": t("profile.email.errors.invalidEmail"),
        "User not found": t("profile.email.errors.userNotFound"),
        "Email rate limit exceeded": t("profile.email.errors.tooManyAttempts"),
        "For security purposes, you can only request this once every 60 seconds":
          t("profile.email.errors.rateLimit"),
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
          return value;
        }
      }

      return t("profile.email.errors.genericError");
    },
  };
}
