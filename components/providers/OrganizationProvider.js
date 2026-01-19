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
import { usePathname, useRouter } from "next/navigation";
import { isValidUUID } from "@/utils/validation/uuid";
import { hasRouteAccess } from "@/utils/auth/routePermissions";

const OrganizationContext = createContext(null);

const STORAGE_KEY = "org_cache";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Provider for current organization state
 * Optimized strategy:
 * 1. Load main organization immediately (fast, single query)
 * 2. Show sidebar with main org instantly
 * 3. Check URL in background - only update sidebar if URL org differs from main org
 */
export function OrganizationProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map()); // In-memory cache
  const initializedRef = useRef(false);
  const backgroundCheckRef = useRef(null);

  // Extract organization ID from URL (for background check only)
  const organizationIdFromUrl = useMemo(() => {
    if (!pathname) return null;

    const excludedPaths = ["/organizations/create"];
    if (excludedPaths.some((path) => pathname.includes(path))) {
      return null;
    }

    const match = pathname.match(/\/organizations\/([^\/]+)/);
    if (!match) return null;

    const extractedId = match[1];
    if (isValidUUID(extractedId)) {
      return extractedId;
    }

    return null;
  }, [pathname]);

  // Save to localStorage
  const saveToStorage = useCallback((orgData) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          data: orgData,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("Error saving cache:", err);
    }
  }, []);

  // Load from localStorage on mount (instant)
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if less than 5 minutes old
        if (age < CACHE_EXPIRY && data) {
          cacheRef.current.set(data.id, data);
          setOrganization(data);
          setLoading(false);
          initializedRef.current = true;
        }
      }
    } catch (err) {
      console.error("Error loading cache:", err);
    }
  }, []);

  // Fetch organization (non-blocking when skipLoading=true)
  const fetchOrganization = useCallback(
    async (orgId, skipLoading = false) => {
      if (!orgId || !isValidUUID(orgId)) {
        if (!skipLoading) {
          setOrganization(null);
          setLoading(false);
        }
        return null;
      }

      // Check in-memory cache first
      if (cacheRef.current.has(orgId)) {
        const cachedOrg = cacheRef.current.get(orgId);
        if (!skipLoading) {
          setOrganization(cachedOrg);
          setLoading(false);
        }
        return cachedOrg;
      }

      try {
        if (!skipLoading) {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(`/api/organizations/${orgId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          // If it's a 404 error, the user was likely removed from this organization
          if (response.status === 404 || result.status === 404) {
            cacheRef.current.delete(orgId);
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch (err) {
              console.error("Error clearing cache:", err);
            }

            // Dispatch event to refetch organizations list
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("organizations:refetch"));
            }

            // If we're currently on this organization's page, redirect to organizations list
            if (organizationIdFromUrl === orgId) {
              setTimeout(() => {
                router.push("/organizations");
              }, 0);
            }
          }

          if (!skipLoading) {
            setOrganization(null);
            setLoading(false);
          }
          setError(null);
          return null;
        }

        // Cache the organization data
        const orgData = result.data;
        cacheRef.current.set(orgId, orgData);
        saveToStorage(orgData);

        if (!skipLoading) {
          setOrganization(orgData);
          setLoading(false);
        }

        setError(null);
        return orgData;
      } catch (err) {
        console.error("Error fetching organization:", err);
        if (!skipLoading) {
          setOrganization(null);
          setLoading(false);
        }
        setError(null);
        return null;
      }
    },
    [organizationIdFromUrl, router, saveToStorage]
  );

  // Fetch main organization ID (fast, single query)
  const fetchMainOrganizationId = useCallback(async () => {
    try {
      const response = await fetch("/api/profiles/main-organization", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.error || !result.data) {
        return null;
      }

      return result.data;
    } catch (err) {
      console.error("Error fetching main organization ID:", err);
      return null;
    }
  }, []);

  // Listen for organizations refetch events and organization updates
  useEffect(() => {
    const handleOrganizationsRefetch = () => {
      // When organizations list is refetched, clear cache
      if (organizationIdFromUrl) {
        // Don't clear the current organization's cache immediately
        // Let the fetch handle it - if it fails, it will be cleared
      } else {
        // If not on an org page, clear all cache to force fresh fetch
        cacheRef.current.clear();
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.error("Error clearing cache:", err);
        }
        // Refetch main organization
        fetchMainOrganizationId().then((mainOrgId) => {
          if (mainOrgId) {
            fetchOrganization(mainOrgId);
          }
        });
      }
    };

    const handleOrganizationRemoved = (event) => {
      // When a specific organization is removed, clear its cache
      const removedOrgId = event.detail?.organizationId;
      if (removedOrgId) {
        cacheRef.current.delete(removedOrgId);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.error("Error clearing cache:", err);
        }

        // If we're currently viewing the removed organization, redirect
        if (organizationIdFromUrl === removedOrgId) {
          setTimeout(() => {
            router.push("/organizations");
          }, 0);
        }
      }
    };

    const handleOrganizationUpdated = (event) => {
      // When organization is updated, invalidate cache
      const updatedOrgId = event.detail?.organizationId;
      if (updatedOrgId) {
        const oldRole = organization?.userRole;
        cacheRef.current.delete(updatedOrgId);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.error("Error clearing cache:", err);
        }
        // Refetch if it's the current organization
        if (organization?.id === updatedOrgId) {
          fetchOrganization(updatedOrgId, false).then((freshOrg) => {
            if (freshOrg && oldRole && freshOrg.userRole !== oldRole) {
              // Role changed - check if current route is still accessible
              if (pathname && organizationIdFromUrl === updatedOrgId) {
                // Extract route path from pathname (e.g., /organizations/[id]/members -> /members)
                const routeMatch = pathname.match(/\/organizations\/[^\/]+\/(.+)$/);
                if (routeMatch) {
                  const routePath = `/${routeMatch[1]}`;
                  const orgType = freshOrg.organization_type || "residential";
                  const hasAccess = hasRouteAccess(routePath, freshOrg.userRole, orgType);
                  
                  if (!hasAccess) {
                    // User no longer has access to current route - redirect to organization home
                    setTimeout(() => {
                      router.push(`/organizations/${updatedOrgId}`);
                    }, 0);
                  }
                }
              }
            }
          });
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "organizations:refetch",
        handleOrganizationsRefetch
      );
      window.addEventListener(
        "organization:removed",
        handleOrganizationRemoved
      );
      window.addEventListener(
        "organization:updated",
        handleOrganizationUpdated
      );
      return () => {
        window.removeEventListener(
          "organizations:refetch",
          handleOrganizationsRefetch
        );
        window.removeEventListener(
          "organization:removed",
          handleOrganizationRemoved
        );
        window.removeEventListener(
          "organization:updated",
          handleOrganizationUpdated
        );
      };
    }
  }, [
    organizationIdFromUrl,
    organization?.id,
    organization?.userRole,
    fetchMainOrganizationId,
    fetchOrganization,
    router,
    pathname,
  ]);

  // Initialize: Load main organization first (fast)
  useEffect(() => {
    if (initializedRef.current) return;

    const initialize = async () => {
      initializedRef.current = true;

      // Step 1: Get main organization ID (fast, single query)
      const mainOrgId = await fetchMainOrganizationId();

      if (mainOrgId) {
        // Step 2: Load main organization (shows sidebar immediately)
        await fetchOrganization(mainOrgId, false);

        // Step 3: Check URL in background (non-blocking)
        // Only update sidebar if URL org differs from main org
        if (organizationIdFromUrl && organizationIdFromUrl !== mainOrgId) {
          // URL has different org - fetch it in background
          backgroundCheckRef.current = setTimeout(async () => {
            const urlOrg = await fetchOrganization(organizationIdFromUrl, true);
            if (urlOrg) {
              // Update sidebar only if URL org is different
              setOrganization(urlOrg);
            }
          }, 100);
        }
      } else {
        // No main organization
        setLoading(false);
      }
    };

    initialize();

    return () => {
      // Reset initialization flag on unmount to allow reinitialization on remount
      initializedRef.current = false;
      if (backgroundCheckRef.current) {
        clearTimeout(backgroundCheckRef.current);
      }
    };
  }, [fetchMainOrganizationId, fetchOrganization, organizationIdFromUrl]); // Only run once on mount (initializedRef guard prevents re-runs)

  // Background check when URL changes (only if different from current org)
  useEffect(() => {
    if (!initializedRef.current || !organizationIdFromUrl) return;

    // Clear any pending background check
    if (backgroundCheckRef.current) {
      clearTimeout(backgroundCheckRef.current);
    }

    // Only check if URL org is different from current org
    if (organization?.id !== organizationIdFromUrl) {
      backgroundCheckRef.current = setTimeout(async () => {
        const urlOrg = await fetchOrganization(organizationIdFromUrl, true);
        if (urlOrg) {
          setOrganization(urlOrg);
        }
      }, 100);
    }

    return () => {
      if (backgroundCheckRef.current) {
        clearTimeout(backgroundCheckRef.current);
      }
    };
  }, [organizationIdFromUrl, organization?.id, fetchOrganization, pathname, router]);

  // Check for role changes when page becomes visible or window regains focus
  // This helps detect role changes made by other admins
  useEffect(() => {
    if (!initializedRef.current || !organization?.id) return;

    const checkForRoleChanges = () => {
      // Only check if page is visible and focused
      if (document.hidden) return;

      // Invalidate cache and refetch to get latest role
      cacheRef.current.delete(organization.id);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error("Error clearing cache:", err);
      }
      fetchOrganization(organization.id, true).then((freshOrg) => {
        if (freshOrg && freshOrg.userRole !== organization.userRole) {
          // Role changed - update state
          setOrganization(freshOrg);
          
          // Check if current route is still accessible with new role
          if (pathname && organizationIdFromUrl === organization.id) {
            // Extract route path from pathname (e.g., /organizations/[id]/members -> /members)
            const routeMatch = pathname.match(/\/organizations\/[^\/]+\/(.+)$/);
            if (routeMatch) {
              const routePath = `/${routeMatch[1]}`;
              const orgType = freshOrg.organization_type || "residential";
              const hasAccess = hasRouteAccess(routePath, freshOrg.userRole, orgType);
              
              if (!hasAccess) {
                // User no longer has access to current route - redirect to organization home
                setTimeout(() => {
                  router.push(`/organizations/${organization.id}`);
                }, 0);
              }
            }
          }
        }
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForRoleChanges();
      }
    };

    const handleFocus = () => {
      checkForRoleChanges();
    };

    // Periodic check every 30 seconds when page is visible
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        checkForRoleChanges();
      }
    }, 30000);

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleFocus);
        clearInterval(intervalId);
      };
    }
  }, [organization?.id, organization?.userRole, fetchOrganization, pathname, organizationIdFromUrl, router]);

  // Method to update organization in cache
  const updateOrganization = useCallback(
    (orgData) => {
      if (orgData?.id) {
        cacheRef.current.set(orgData.id, orgData);
        saveToStorage(orgData);
        setOrganization(orgData);
      }
    },
    [saveToStorage]
  );

  // Method to clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
    setOrganization(null);
    initializedRef.current = false;
  }, []);

  // Method to refetch current organization
  const refetch = useCallback(() => {
    const targetOrgId = organizationIdFromUrl || organization?.id;
    if (targetOrgId) {
      cacheRef.current.delete(targetOrgId);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error("Error clearing cache:", err);
      }
      fetchOrganization(targetOrgId);
    }
  }, [organizationIdFromUrl, organization?.id, fetchOrganization]);

  // Helper to check if current user has a specific permission
  const hasPermission = useCallback(
    (permissionCode) => {
      if (!organization || !organization.permissions) return false;
      if (organization.is_frozen) return false; // Frozen seats block all permissions
      return organization.permissions.includes(permissionCode);
    },
    [organization]
  );

  const value = {
    organization,
    organizationId: organizationIdFromUrl || organization?.id || null,
    loading,
    error,
    refetch,
    updateOrganization,
    clearCache,
    hasPermission,
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
