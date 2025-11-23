"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Custom hook for change password operations
 * @param {Object} options - Configuration options
 * @returns {{ loading: boolean, error: Error | null, success: boolean, changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void> }}
 */
export function useChangePassword(options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const changePassword = useCallback(
    async (currentPassword, newPassword, confirmPassword) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error(
            "Por favor, completa todos los campos requeridos."
          );
        }

        if (newPassword.length < 6) {
          throw new Error(
            "La nueva contraseña debe tener al menos 6 caracteres."
          );
        }

        if (newPassword !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user || !user.email) {
          throw new Error(
            "No hay una sesión activa. Por favor, inicia sesión nuevamente."
          );
        }

        // Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error(
            "La contraseña actual no es correcta. Por favor, verifica e intenta nuevamente."
          );
        }

        // Check if new password is different
        if (currentPassword === newPassword) {
          throw new Error(
            "La nueva contraseña debe ser diferente a la actual."
          );
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw updateError;
        }

        setSuccess(true);
        setError(null);
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
    changePassword,
  };
}


