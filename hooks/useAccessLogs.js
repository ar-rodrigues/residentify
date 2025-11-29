"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for access logs operations
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   data: Array | null,
 *   getAccessLogs: (filters?: Object) => Promise<{error: boolean, message: string, data?: Array}>,
 *   getQRCodeAccessLogs: (qrCodeId: string) => Promise<{error: boolean, message: string, data?: Array}>,
 *   refetch: () => Promise<void>
 * }}
 */
export function useAccessLogs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastFilters, setLastFilters] = useState(null);

  const getAccessLogs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      setLastFilters(filters);

      const {
        organization_id,
        qr_code_id,
        entry_type,
        start_date,
        end_date,
        limit = 50,
        offset = 0,
      } = filters;

      const params = new URLSearchParams();

      if (organization_id) {
        params.append("organization_id", organization_id);
      }

      if (qr_code_id) {
        params.append("qr_code_id", qr_code_id);
      }

      if (entry_type) {
        params.append("entry_type", entry_type);
      }

      if (start_date) {
        params.append("start_date", start_date);
      }

      if (end_date) {
        params.append("end_date", end_date);
      }

      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const url = `/api/access-logs?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener los registros de acceso.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener los registros de acceso.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Registros de acceso obtenidos exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener los registros de acceso.";
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

  const getQRCodeAccessLogs = useCallback(
    async (qrCodeId, limit = 50, offset = 0) => {
      try {
        setLoading(true);
        setError(null);

        if (!qrCodeId || typeof qrCodeId !== "string") {
          throw new Error("ID de código QR inválido.");
        }

        const params = new URLSearchParams();
        params.append("limit", limit.toString());
        params.append("offset", offset.toString());

        const url = `/api/qr-codes/${qrCodeId}/access-logs?${params.toString()}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al obtener los registros de acceso.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al obtener los registros de acceso.");
        }

        setData(result.data);
        return {
          error: false,
          message: result.message || "Registros de acceso obtenidos exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al obtener los registros de acceso.";
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
    []
  );

  const refetch = useCallback(async () => {
    if (lastFilters) {
      return getAccessLogs(lastFilters);
    }
  }, [lastFilters, getAccessLogs]);

  return {
    loading,
    error,
    data,
    getAccessLogs,
    getQRCodeAccessLogs,
    refetch,
  };
}



