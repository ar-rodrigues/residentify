"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for QR code operations
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   data: Object | null,
 *   createQRCode: (organization_id: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   getQRCodes: (filters?: Object) => Promise<{error: boolean, message: string, data?: Array}>,
 *   getQRCode: (id: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   getQRCodeByToken: (token: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   updateQRCode: (id: string, updateData: Object) => Promise<{error: boolean, message: string, data?: Object}>,
 *   revokeQRCode: (id: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   validateQRCode: (token: string, validationData: Object) => Promise<{error: boolean, message: string, data?: Object}>,
 *   refetch: () => Promise<void>
 * }}
 */
export function useQRCodes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const createQRCode = useCallback(async (organization_id) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!organization_id || typeof organization_id !== "string") {
        throw new Error("ID de organización es requerido.");
      }

      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al generar el enlace.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al generar el enlace.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Enlace generado exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al generar el enlace.";
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

  const getQRCodes = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { organization_id, status, role } = filters;
      const params = new URLSearchParams();

      if (organization_id) {
        params.append("organization_id", organization_id);
      }

      if (status) {
        params.append("status", status);
      }

      if (role) {
        params.append("role", role);
      }

      const url = `/api/qr-codes${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener los códigos QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener los códigos QR.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Códigos QR obtenidos exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los códigos QR.";
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

  const getQRCode = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de código QR inválido.");
      }

      const response = await fetch(`/api/qr-codes/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener el código QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener el código QR.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Código QR obtenido exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener el código QR.";
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

  const updateQRCode = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de código QR inválido.");
      }

      const response = await fetch(`/api/qr-codes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar el código QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al actualizar el código QR.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Código QR actualizado exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al actualizar el código QR.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeQRCode = useCallback(
    async (id) => {
      return updateQRCode(id, { status: "revoked" });
    },
    [updateQRCode]
  );

  const validateQRCode = useCallback(async (token, validationData) => {
    try {
      setLoading(true);
      setError(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token inválido.");
      }

      const {
        visitor_name,
        visitor_id,
        document_photo_url,
        entry_type = "entry",
        notes = null,
      } = validationData;

      if (!visitor_name || (!visitor_id && !document_photo_url)) {
        throw new Error(
          "Nombre del visitante y documento (ID o foto) son requeridos."
        );
      }

      const response = await fetch(`/api/qr-codes/validate/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitor_name,
          visitor_id,
          document_photo_url,
          entry_type,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al validar el código QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al validar el código QR.");
      }

      return {
        error: false,
        message: result.message || "Código QR validado exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al validar el código QR.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getQRCodeByToken = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!token || typeof token !== "string") {
        throw new Error("Token inválido.");
      }

      const response = await fetch(`/api/qr-codes/validate/${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener el código QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener el código QR.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Código QR obtenido exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener el código QR.";
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

  const deleteQRCode = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de código QR inválido.");
      }

      const response = await fetch(`/api/qr-codes/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al eliminar el código QR.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al eliminar el código QR.");
      }

      return {
        error: false,
        message: result.message || "Código QR eliminado exitosamente.",
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al eliminar el código QR.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (data && Array.isArray(data)) {
      // If we have filters, we'd need to store them
      // For now, just refetch all
      return getQRCodes();
    }
  }, [data, getQRCodes]);

  return {
    loading,
    error,
    data,
    createQRCode,
    getQRCodes,
    getQRCode,
    getQRCodeByToken,
    updateQRCode,
    revokeQRCode,
    validateQRCode,
    deleteQRCode,
    refetch,
  };
}
