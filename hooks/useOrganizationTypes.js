"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

/**
 * Custom hook for fetching organization types
 * @returns {{ types: Array, loading: boolean, error: Error | null, refetch: () => Promise<void> }}
 */
export function useOrganizationTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/organization-types", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al obtener los tipos de organización."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al obtener los tipos de organización."
        );
      }

      setTypes(result.data || []);
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los tipos de organización.";
      setError(err);
      setTypes([]);
      console.error("Error fetching organization types:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return {
    types,
    loading,
    error,
    refetch: fetchTypes,
  };
}






