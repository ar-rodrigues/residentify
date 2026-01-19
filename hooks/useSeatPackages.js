"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Hook for fetching seat packages and limits
 * @param {string} organizationId 
 */
export function useSeatPackages(organizationId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPackages = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/seat-packages`);
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
    fetchPackages();
  }, [fetchPackages]);

  return { data, loading, error, refetch: fetchPackages };
}
