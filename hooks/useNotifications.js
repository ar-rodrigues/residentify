"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook for notifications operations
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   data: Array | null,
 *   unreadCount: number,
 *   getNotifications: (filters?: Object) => Promise<{error: boolean, message: string, data?: Array, unread_count?: number}>,
 *   markAsRead: (id: string) => Promise<{error: boolean, message: string, data?: Object}>,
 *   markAllAsRead: (organizationId?: string) => Promise<{error: boolean, message: string}>,
 *   refetch: () => Promise<void>
 * }}
 */
export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFilters, setLastFilters] = useState(null);

  const getNotifications = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      setLastFilters(filters);

      const { organization_id, is_read, limit = 50, offset = 0 } = filters;

      const params = new URLSearchParams();

      if (organization_id) {
        params.append("organization_id", organization_id);
      }

      if (is_read !== undefined && is_read !== null) {
        params.append("is_read", is_read.toString());
      }

      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const url = `/api/notifications?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener las notificaciones.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener las notificaciones.");
      }

      setData(result.data);
      setUnreadCount(result.unread_count || 0);
      return {
        error: false,
        message: result.message || "Notificaciones obtenidas exitosamente.",
        data: result.data,
        unread_count: result.unread_count || 0,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener las notificaciones.";
      setError(err);
      setData(null);
      setUnreadCount(0);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de notificación inválido.");
      }

      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al marcar la notificación como leída.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al marcar la notificación como leída.");
      }

      // Update local state
      if (data && Array.isArray(data)) {
        const updatedData = data.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        );
        setData(updatedData);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return {
        error: false,
        message: result.message || "Notificación marcada como leída.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al marcar la notificación como leída.";
      setError(err);
      return {
        error: true,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [data]);

  const markAllAsRead = useCallback(
    async (organizationId) => {
      try {
        setLoading(true);
        setError(null);

        // Get all unread notifications
        const filters = { is_read: false };
        if (organizationId) {
          filters.organization_id = organizationId;
        }

        const result = await getNotifications({ ...filters, limit: 1000 });

        if (result.error || !result.data) {
          throw new Error("Error al obtener las notificaciones no leídas.");
        }

        // Mark each as read
        const unreadNotifications = result.data.filter((n) => !n.is_read);
        const promises = unreadNotifications.map((notification) =>
          markAsRead(notification.id)
        );

        await Promise.all(promises);

        return {
          error: false,
          message: "Todas las notificaciones han sido marcadas como leídas.",
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al marcar todas las notificaciones como leídas.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [getNotifications, markAsRead]
  );

  const refetch = useCallback(async () => {
    if (lastFilters) {
      return getNotifications(lastFilters);
    }
  }, [lastFilters, getNotifications]);

  return {
    loading,
    error,
    data,
    unreadCount,
    getNotifications,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}



