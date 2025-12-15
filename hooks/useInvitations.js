"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for invitation operations
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   createInvitation: (organizationId: string, invitationData: Object) => Promise<{error: boolean, message: string, data?: Object}>,
 *   getInvitationByToken: (token: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   acceptInvitation: (token: string, userData: Object) => Promise<{error: boolean, message: string, data?: Object}>
 * }}
 */
export function useInvitations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createInvitation = useCallback(
    async (organizationId, invitationData) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        const {
          first_name,
          last_name,
          email,
          organization_role_id,
          description,
        } = invitationData;

        if (!first_name || !last_name || !email || !organization_role_id) {
          throw new Error("Por favor, completa todos los campos requeridos.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/invitations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              first_name,
              last_name,
              email,
              organization_role_id,
              description: description || null,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al crear la invitación.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al crear la invitación.");
        }

        return {
          error: false,
          message: result.message || "Invitación creada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al crear la invitación.";
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

  const getInvitationByToken = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de invitación inválido.");
      }

      const response = await fetch(`/api/invitations/${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener la invitación.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener la invitación.");
      }

      return {
        error: false,
        message: result.message || "Invitación obtenida exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener la invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(async (token, userData) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de invitación inválido.");
      }

      const { password, date_of_birth } = userData;

      if (!password || !date_of_birth) {
        throw new Error("Por favor, completa todos los campos requeridos.");
      }

      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          date_of_birth,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al aceptar la invitación.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al aceptar la invitación.");
      }

      return {
        error: false,
        message: result.message || "Invitación aceptada exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al aceptar la invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEmail = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de invitación inválido.");
      }

      const response = await fetch(`/api/invitations/${token}/check-email`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al verificar el email.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al verificar el email.");
      }

      return {
        error: false,
        message: result.message || "Email verificado exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al verificar el email.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitationLoggedIn = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token de invitación inválido.");
      }

      const response = await fetch(
        `/api/invitations/${token}/accept-logged-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al aceptar la invitación.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al aceptar la invitación.");
      }

      return {
        error: false,
        message: result.message || "Invitación aceptada exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al aceptar la invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvitations = useCallback(async (organizationId) => {
    try {
      setLoading(true);
      setError(null);

      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener las invitaciones.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener las invitaciones.");
      }

      return {
        error: false,
        message: result.message || "Invitaciones obtenidas exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener las invitaciones.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const approveInvitation = useCallback(
    async (organizationId, invitationId) => {
      try {
        setLoading(true);
        setError(null);

        if (!organizationId || typeof organizationId !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!invitationId || typeof invitationId !== "string") {
          throw new Error("ID de invitación inválido.");
        }

        const response = await fetch(
          `/api/organizations/${organizationId}/invitations/${invitationId}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al aprobar la invitación.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al aprobar la invitación.");
        }

        return {
          error: false,
          message: result.message || "Invitación aprobada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al aprobar la invitación.";
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

  const rejectInvitation = useCallback(async (organizationId, invitationId) => {
    try {
      setLoading(true);
      setError(null);

      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      if (!invitationId || typeof invitationId !== "string") {
        throw new Error("ID de invitación inválido.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al rechazar la invitación.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al rechazar la invitación.");
      }

      return {
        error: false,
        message: result.message || "Invitación rechazada exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al rechazar la invitación.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvitation = useCallback(async (organizationId, invitationId) => {
    try {
      setLoading(true);
      setError(null);

      if (!organizationId || typeof organizationId !== "string") {
        throw new Error("ID de organización inválido.");
      }

      if (!invitationId || typeof invitationId !== "string") {
        throw new Error("ID de invitación inválido.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al eliminar la invitación.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al eliminar la invitación.");
      }

      return {
        error: false,
        message: result.message || "Invitación eliminada exitosamente.",
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al eliminar la invitación.";
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
    createInvitation,
    getInvitationByToken,
    acceptInvitation,
    checkEmail,
    acceptInvitationLoggedIn,
    getInvitations,
    approveInvitation,
    rejectInvitation,
    deleteInvitation,
  };
}
