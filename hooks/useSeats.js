"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Hook for managing organization seats
 * @param {string} organizationId 
 */
export function useSeats(organizationId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSeats = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/seats`);
      const result = await response.json();
      if (result.error) throw new Error(result.message);
      setData(result.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const createSeat = async (seatData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seatData),
      });
      const result = await response.json();
      if (result.error) throw new Error(result.message);
      await fetchSeats();
      return result;
    } catch (err) {
      return { error: true, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchSeats, createSeat };
}
