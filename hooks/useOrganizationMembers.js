"use client";

import { useState, useCallback } from "react";

/**
 * Custom event to notify that organizations list should be refetched
 * This is used when a member is removed to ensure the organizations list is up to date
 */
const ORGANIZATIONS_REFETCH_EVENT = "organizations:refetch";

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
        // Don't set global loading/error states for role updates
        // These should be handled locally in the component

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

        // Only refetch members on success
        if (currentOrganizationId === organizationId) {
          await getMembers(organizationId);
        }

        // Dispatch event to invalidate organization cache
        // This ensures that when a role is changed, the organization data is refetched
        // to reflect the updated role for the affected user
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("organization:updated", {
              detail: { organizationId },
            })
          );
        }

        return {
          error: false,
          message: result.message || "Rol actualizado exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al actualizar el rol.";
        // Don't set global error state - let component handle it
        return {
          error: true,
          message: errorMessage,
        };
      }
    },
    [currentOrganizationId, getMembers]
  );

  const removeMember = useCallback(
    async (organizationId, memberId) => {
      try {
        // Don't set global loading/error states for member removal
        // These should be handled locally in the component

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

        // Only refetch members on success
        if (currentOrganizationId === organizationId) {
          await getMembers(organizationId);
        }

        // Dispatch event to refetch organizations list
        // This ensures that if a user was removed from an organization,
        // the organizations list is updated for all users
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(ORGANIZATIONS_REFETCH_EVENT));
        }

        return {
          error: false,
          message: result.message || "Miembro eliminado exitosamente.",
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al eliminar el miembro.";
        // Don't set global error state - let component handle it
        return {
          error: true,
          message: errorMessage,
        };
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




