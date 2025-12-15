"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { isValidUUID } from "@/utils/validation/uuid";

const OrganizationContext = createContext(null);

/**
 * Provider for current organization state
 * Uses URL as source of truth but caches data to prevent unnecessary refetches
 */
export function OrganizationProvider({ children }) {
  const pathname = usePathname();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map()); // Cache organizations by ID (using ref for stability)

  // Extract organization ID from URL if on organization page
  // Exclude special paths like /organizations/create (but include /organizations/[id]/edit)
  const organizationIdFromUrl = useMemo(() => {
    if (!pathname) return null;

    // Exclude special paths that are not organization detail pages
    // Note: /organizations/[id]/edit is NOT excluded - it uses the org from URL
    const excludedPaths = ["/organizations/create"];
    if (excludedPaths.some((path) => pathname.includes(path))) {
      return null;
    }

    const match = pathname.match(/\/organizations\/([^\/]+)/);
    if (!match) return null;

    const extractedId = match[1];

    // Only treat it as an organization ID if it's a valid UUID
    // This prevents treating paths like "/organizations/create" as organization pages
    // But allows paths like "/organizations/[id]/edit" to use the organization from URL
    if (isValidUUID(extractedId)) {
      return extractedId;
    }

    return null;
  }, [pathname]);

  const fetchOrganization = useCallback(async (orgId) => {
    if (!orgId) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    // Validate UUID before fetching
    if (!isValidUUID(orgId)) {
      setOrganization(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first (using ref for stable access)
    if (cacheRef.current.has(orgId)) {
      const cachedOrg = cacheRef.current.get(orgId);
      setOrganization(cachedOrg);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        // Don't throw error, just set organization to null
        // This allows the sidebar to still render with global menu items
        setOrganization(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Cache the organization data (using ref for stable access)
      const orgData = result.data;
      cacheRef.current.set(orgId, orgData);
      setOrganization(orgData);
      setError(null);
    } catch (err) {
      console.error("Error fetching organization:", err);
      // Don't set error state - just set organization to null
      // This allows the sidebar to still render
      setOrganization(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - uses ref for cache access

  // Fetch main organization if not on org page
  const fetchMainOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profiles/main-organization", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.error || !result.data) {
        // No main organization - keep current organization if it exists
        // Only clear if we don't have one (to show empty state when user has no orgs)
        setError(null);
        setLoading(false);
        return;
      }

      // Fetch the organization details (will use cache if available)
      // This will update the organization state
      await fetchOrganization(result.data);
    } catch (err) {
      console.error("Error fetching main organization:", err);
      // Don't clear organization on error - keep current one
      // This allows the sidebar to still show menu items
      setError(null);
      setLoading(false);
    }
  }, [fetchOrganization]);

  // Update organization when URL changes
  useEffect(() => {
    if (organizationIdFromUrl) {
      // On organization page - fetch from URL (will use cache if available)
      fetchOrganization(organizationIdFromUrl);
    } else {
      // Not on organization page (e.g., /organizations/create)
      // Fetch main organization to ensure we have the current org loaded
      // This will keep the current organization if fetch fails
      fetchMainOrganization();
    }
  }, [organizationIdFromUrl, fetchOrganization, fetchMainOrganization]);

  // Method to update organization in cache (useful when switching organizations)
  const updateOrganization = useCallback((orgData) => {
    if (orgData?.id) {
      cacheRef.current.set(orgData.id, orgData);
      setOrganization(orgData);
    }
  }, []);

  // Method to clear cache (useful on logout)
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setOrganization(null);
  }, []);

  // Method to refetch current organization
  const refetch = useCallback(() => {
    if (organizationIdFromUrl) {
      // Clear cache for this org to force refetch
      cacheRef.current.delete(organizationIdFromUrl);
      fetchOrganization(organizationIdFromUrl);
    } else {
      fetchMainOrganization();
    }
  }, [organizationIdFromUrl, fetchOrganization, fetchMainOrganization]);

  const value = {
    organization,
    organizationId: organizationIdFromUrl || organization?.id || null,
    loading,
    error,
    refetch,
    updateOrganization,
    clearCache,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to access current organization from context
 * @returns {{ organization: Object | null, organizationId: string | null, loading: boolean, error: Error | null, refetch: () => void, updateOrganization: (org) => void, clearCache: () => void }}
 */
export function useCurrentOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useCurrentOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
