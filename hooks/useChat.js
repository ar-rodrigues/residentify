"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook for chat permissions operations
 * @param {string} organizationId - The organization ID
 * @returns {{
 *   permissions: Array,
 *   roles: Array,
 *   loading: boolean,
 *   loadingPermissions: boolean,
 *   error: Error | null,
 *   updatePermission: (senderRoleId: number, recipientRoleId: number, disabled: boolean) => Promise<void>,
 *   refetch: () => Promise<void>
 * }}
 */
export function useChat(organizationId) {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    if (!organizationId || typeof organizationId !== "string") {
      setLoadingPermissions(false);
      return;
    }

    try {
      setLoadingPermissions(true);
      setError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/chat/permissions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al obtener los permisos de chat."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al obtener los permisos de chat."
        );
      }

      setPermissions(result.data?.permissions || []);
      setRoles(result.data?.roles || []);
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los permisos de chat.";
      setError(err);
      setPermissions([]);
      setRoles([]);
      console.error("Error fetching chat permissions:", errorMessage);
    } finally {
      setLoadingPermissions(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const updatePermission = useCallback(
    async (senderRoleId, recipientRoleId, disabled) => {
      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      if (
        typeof senderRoleId !== "number" ||
        typeof recipientRoleId !== "number" ||
        typeof disabled !== "boolean"
      ) {
        throw new Error("Parámetros inválidos para actualizar el permiso.");
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/organizations/${organizationId}/chat/permissions`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              senderRoleId,
              recipientRoleId,
              disabled,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Error al actualizar el permiso de chat."
          );
        }

        if (result.error) {
          throw new Error(
            result.message || "Error al actualizar el permiso de chat."
          );
        }

        // Refetch permissions after update
        await fetchPermissions();
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al actualizar el permiso de chat.";
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizationId, fetchPermissions]
  );

  const refetch = useCallback(() => {
    return fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    roles,
    loading,
    loadingPermissions,
    error,
    updatePermission,
    refetch,
  };
}
