"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for organization member operations
 * @returns {{
 *   data: Array | null,
 *   loading: boolean,
 *   error: Error | null,
 *   getMembers: (organizationId: string) => Promise<{error: boolean, message: string, data?: Array}>,
 *   updateMemberRole: (organizationId: string, memberId: string, newRoleId: number) => Promise<{error: boolean, message: string, data?: Object}>,
 *   removeMember: (organizationId: string, memberId: string) => Promise<{error: boolean, message: string}>,
 *   refetch: () => Promise<void>
 * }}
 */
export function useOrganizationMembers() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null);

  const getMembers = useCallback(async (organizationId) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentOrganizationId(organizationId);

      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener los miembros.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener los miembros.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Miembros obtenidos exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los miembros.";
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

  const updateMemberRole = useCallback(
    async (organizationId, memberId, newRoleId) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!memberId || typeof memberId !== "string") {
          throw new Error("ID de miembro inválido.");
        }

        if (!newRoleId || typeof newRoleId !== "number") {
          throw new Error("ID de rol inválido.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/members`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              member_id: memberId,
              organization_role_id: newRoleId,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al actualizar el rol.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al actualizar el rol.");
        }

        // Refetch members after update
        if (currentOrganizationId === organizationId) {
          await getMembers(organizationId);
        }

        return {
          error: false,
          message: result.message || "Rol actualizado exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al actualizar el rol.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [currentOrganizationId, getMembers]
  );

  const removeMember = useCallback(
    async (organizationId, memberId) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!memberId || typeof memberId !== "string") {
          throw new Error("ID de miembro inválido.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/members?member_id=${memberId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al eliminar el miembro.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al eliminar el miembro.");
        }

        // Refetch members after removal
        if (currentOrganizationId === organizationId) {
          await getMembers(organizationId);
        }

        return {
          error: false,
          message: result.message || "Miembro eliminado exitosamente.",
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al eliminar el miembro.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [currentOrganizationId, getMembers]
  );

  const refetch = useCallback(() => {
    if (currentOrganizationId) {
      return getMembers(currentOrganizationId);
    }
    return Promise.resolve();
  }, [currentOrganizationId, getMembers]);

  return {
    data,
    loading,
    error,
    getMembers,
    updateMemberRole,
    removeMember,
    refetch,
  };
}




