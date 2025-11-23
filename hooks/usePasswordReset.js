"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { getBaseUrl } from "@/utils/config/app";

/**
 * Custom hook for password reset operations
 * @param {Object} options - Configuration options
 * @returns {{ loading: boolean, error: Error | null, success: boolean, resetPassword: (email: string) => Promise<void>, sendResetEmail: (email: string) => Promise<void> }}
 */
export function usePasswordReset(options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const sendResetEmail = useCallback(
    async (email) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const baseUrl = getBaseUrl();

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${baseUrl}/auth/reset-password?type=recovery`,
          }
        );

        if (resetError) {
          setError(resetError);
          setSuccess(false);
        } else {
          setSuccess(true);
          setError(null);
        }
      } catch (err) {
        setError(err);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const resetPassword = useCallback(
    async (password) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          setError(updateError);
          setSuccess(false);
        } else {
          setSuccess(true);
          setError(null);
        }
      } catch (err) {
        setError(err);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    success,
    sendResetEmail,
    resetPassword,
  };
}
