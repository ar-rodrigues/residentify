"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Custom hook for organization operations
 * @returns {{ data: Object | null, loading: boolean, error: Error | null, organizations: Array, createOrganization: (name: string) => Promise<{error: boolean, message: string, data?: Object}>, refetch: () => Promise<void> }}
 */
export function useOrganizations() {
  const [data, setData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchOrganizations = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setOrganizations([]);
        return;
      }

      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      if (orgError) {
        throw orgError;
      }

      setOrganizations(orgs || []);
    } catch (err) {
      setError(err);
      setOrganizations([]);
    } finally {
      setFetching(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const createOrganization = useCallback(
    async (name) => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        if (!name || typeof name !== "string") {
          throw new Error("El nombre de la organización es requerido.");
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
          throw new Error(
            "El nombre de la organización debe tener al menos 2 caracteres."
          );
        }

        if (trimmedName.length > 100) {
          throw new Error(
            "El nombre de la organización no puede tener más de 100 caracteres."
          );
        }

        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al crear la organización.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al crear la organización.");
        }

        setData(result.data);
        // Refresh organizations list after creating
        await fetchOrganizations();
        return {
          error: false,
          message: result.message || "Organización creada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al crear la organización.";
        setError(err);
        setData(null);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrganizations]
  );

  const getOrganization = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de organización inválido.");
      }

      const response = await fetch(`/api/organizations/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener la organización.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener la organización.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Organización obtenida exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener la organización.";
      setError(err);
      setData(null);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrganization = useCallback(
    async (id, name) => {
      try {
        setLoading(true);
        setError(null);

        if (!id || typeof id !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!name || typeof name !== "string") {
          throw new Error("El nombre de la organización es requerido.");
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
          throw new Error(
            "El nombre de la organización debe tener al menos 2 caracteres."
          );
        }

        if (trimmedName.length > 100) {
          throw new Error(
            "El nombre de la organización no puede tener más de 100 caracteres."
          );
        }

        const response = await fetch(`/api/organizations/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Error al actualizar la organización."
          );
        }

        if (result.error) {
          throw new Error(
            result.message || "Error al actualizar la organización."
          );
        }

        setData(result.data);
        // Refresh organizations list after updating
        await fetchOrganizations();
        return {
          error: false,
          message: result.message || "Organización actualizada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al actualizar la organización.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrganizations]
  );

  return {
    data,
    organizations,
    loading,
    fetching,
    error,
    createOrganization,
    getOrganization,
    updateOrganization,
    refetch: fetchOrganizations,
  };
}
