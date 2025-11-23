"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * Custom hook to get the current authenticated user
 * @param {Object} options - Configuration options
 * @param {boolean} options.redirectToLogin - If true, redirects to /login when user is not found (default: false)
 * @param {boolean} options.redirectIfAuthenticated - If true, redirects to /private when user is found (default: false)
 * @param {string} options.redirectPath - Custom redirect path (optional)
 * @returns {{ data: User | null, loading: boolean, error: Error | null, refetch: () => Promise<void> }}
 */
export function useUser(options = {}) {
  const {
    redirectToLogin = false,
    redirectIfAuthenticated = false,
    redirectPath = null,
  } = options;

  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError);
        setData(null);

        if (redirectToLogin) {
          const path = redirectPath || "/login";
          router.push(path);
        }
        return;
      }

      if (!user) {
        setData(null);

        if (redirectToLogin) {
          const path = redirectPath || "/login";
          router.push(path);
        }
      } else {
        setData(user);

        if (redirectIfAuthenticated) {
          const path = redirectPath || "/private";
          router.push(path);
        }
      }
    } catch (err) {
      setError(err);
      setData(null);

      if (redirectToLogin) {
        const path = redirectPath || "/login";
        router.push(path);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, router, redirectToLogin, redirectIfAuthenticated, redirectPath]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    data,
    loading,
    error,
    refetch: fetchUser,
  };
}

