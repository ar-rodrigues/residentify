"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for general invite link operations
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   createGeneralInviteLink: (organizationId: string, linkData: Object) => Promise<{error: boolean, message: string, data?: Object}>,
 *   getGeneralInviteLinks: (organizationId: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   deleteGeneralInviteLink: (organizationId: string, linkId: string) => Promise<{error: boolean, message: string}>,
 *   getGeneralInviteLinkByToken: (token: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   acceptGeneralInviteLink: (token: string, userData: Object) => Promise<{error: boolean, message: string, data?: Object}>
 * }}
 */
export function useGeneralInviteLinks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createGeneralInviteLink = useCallback(
    async (organizationId, linkData) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        const { organization_role_id, requires_approval, expires_at } =
          linkData;

        if (!organization_role_id) {
          throw new Error("El rol de organización es requerido.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/general-invite-links`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              organization_role_id,
              requires_approval: requires_approval === true,
              expires_at: expires_at || null,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Error al crear el enlace de invitación."
          );
        }

        if (result.error) {
          throw new Error(
            result.message || "Error al crear el enlace de invitación."
          );
        }

        return {
          error: false,
          message:
            result.message || "Enlace de invitación creado exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al crear el enlace de invitación.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getGeneralInviteLinks = useCallback(async (organizationId) => {
    try {
      setLoading(true);
      setError(null);

      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/general-invite-links`,
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
          result.message || "Error al obtener los enlaces de invitación."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al obtener los enlaces de invitación."
        );
      }

      return {
        error: false,
        message:
          result.message || "Enlaces de invitación obtenidos exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los enlaces de invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGeneralInviteLink = useCallback(
    async (organizationId, linkId) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!linkId || typeof linkId !== "string") {
          throw new Error("ID de enlace inválido.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/general-invite-links/${linkId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Error al eliminar el enlace de invitación."
          );
        }

        if (result.error) {
          throw new Error(
            result.message || "Error al eliminar el enlace de invitación."
          );
        }

        return {
          error: false,
          message:
            result.message || "Enlace de invitación eliminado exitosamente.",
        };
      } catch (err) {
        const errorMessage =
          err.message ||
          "Error inesperado al eliminar el enlace de invitación.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getGeneralInviteLinkByToken = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de enlace inválido.");
      }

      const response = await fetch(`/api/general-invite-links/${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al obtener el enlace de invitación."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al obtener el enlace de invitación."
        );
      }

      return {
        error: false,
        message:
          result.message || "Enlace de invitación obtenido exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener el enlace de invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptGeneralInviteLink = useCallback(async (token, userData) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de enlace inválido.");
      }

      const { email, first_name, last_name, password, date_of_birth } =
        userData;

      if (!email || !first_name || !last_name || !password || !date_of_birth) {
        throw new Error("Por favor, completa todos los campos requeridos.");
      }

      const response = await fetch(
        `/api/general-invite-links/${token}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            first_name,
            last_name,
            password,
            date_of_birth,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al aceptar el enlace de invitación."
        );
      }

      if (result.error) {
        throw new Error(
          result.message || "Error al aceptar el enlace de invitación."
        );
      }

      return {
        error: false,
        message: result.message || "Cuenta creada exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al aceptar el enlace de invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createGeneralInviteLink,
    getGeneralInviteLinks,
    deleteGeneralInviteLink,
    getGeneralInviteLinkByToken,
    acceptGeneralInviteLink,
  };
}
