"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Hook for fetching seat types
 * @param {number} organizationTypeId 
 */
export function useSeatTypes(organizationTypeId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSeatTypes = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/seat-types";
      if (organizationTypeId) {
        url += `?organization_type_id=${organizationTypeId}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.error) throw new Error(result.message);
      setData(result.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organizationTypeId]);

  useEffect(() => {
    fetchSeatTypes();
  }, [fetchSeatTypes]);

  return { data, loading, error, refetch: fetchSeatTypes };
}
