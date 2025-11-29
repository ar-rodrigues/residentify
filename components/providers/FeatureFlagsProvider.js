"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";

const FeatureFlagsContext = createContext(null);

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: user } = useUser({ redirectToLogin: false });

  const fetchFlags = useCallback(async () => {
    if (!user) {
      setFlags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/flags", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener las banderas.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener las banderas.");
      }

      setFlags(result.data?.flags || []);
    } catch (err) {
      console.error("Error fetching feature flags:", err);
      setError(err);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const hasFlag = useCallback(
    (flagName) => {
      if (!flagName || !flags || flags.length === 0) {
        return false;
      }
      const flag = flags.find((f) => f.name === flagName);
      return flag?.enabled === true;
    },
    [flags]
  );

  const value = {
    flags,
    loading,
    error,
    hasFlag,
    refetch: fetchFlags,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    );
  }
  return context;
}




