"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const STORAGE_KEY_ORGS = "orgs_list_cache";
const CACHE_EXPIRY_ORGS = 2 * 60 * 1000; // 2 minutes

/**
 * Custom hook for organization operations
 * @returns {{ data: Object | null, loading: boolean, error: Error | null, organizations: Array, createOrganization: (name: string) => Promise<{error: boolean, message: string, data?: Object}>, refetch: () => Promise<void> }}
 */
export function useOrganizations() {
  const [data, setData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef(null);
  const cacheLoadedRef = useRef(false);

  // Save to localStorage cache
  const saveToCache = useCallback((orgsData) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_ORGS,
        JSON.stringify({
          data: orgsData,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      // Silently handle cache save errors
    }
  }, []);

  // Load from localStorage cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_ORGS);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if less than 2 minutes old
        if (age < CACHE_EXPIRY_ORGS && data && Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      // Silently handle cache parsing errors
    }
    return null;
  }, []);

  const fetchOrganizations = useCallback(async (useCache = true) => {
    try {
      // Load from cache first if available and not explicitly bypassing cache
      if (useCache && !cacheLoadedRef.current) {
        const cachedOrgs = loadFromCache();
        if (cachedOrgs && cachedOrgs.length > 0) {
          setOrganizations(cachedOrgs);
          setFetching(false);
          cacheLoadedRef.current = true;
          // Continue to fetch fresh data in background
        }
      }

      // Always fetch fresh data (either immediately or in background)
      setFetching(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setOrganizations([]);
        saveToCache([]);
        return;
      }

      // Parallelize all independent queries
      const [
        memberDataResult,
        pendingInvitationsByIdResult,
        emailInvitationsResult,
      ] = await Promise.all([
        // Fetch organization member IDs
        supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id),
        // Fetch invitations by user_id (parallel)
        user.id
          ? supabase
              .from("organization_invitations")
              .select("organization_id")
              .eq("user_id", user.id)
              .in("status", ["pending_approval", "pending"])
          : Promise.resolve({ data: [], error: null }),
        // Fetch invitations by email (parallel, if user has email)
        user.email
          ? supabase
              .from("organization_invitations")
              .select("organization_id")
              .eq("email", user.email.toLowerCase())
              .in("status", ["pending_approval", "pending"])
              .is("user_id", null)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Process member organizations
      let memberOrgs = [];
      const { data: memberData, error: memberError } = memberDataResult;

      if (memberError) {
        console.error("Error fetching member organization IDs:", memberError);
      } else if (memberData && memberData.length > 0) {
        const orgIds = memberData.map((m) => m.organization_id);

        // Fetch organizations for members
        const { data: orgsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, created_at")
          .in("id", orgIds)
          .order("created_at", { ascending: false });

        if (orgsError) {
          console.error("Error fetching organizations:", orgsError);
        } else {
          memberOrgs = orgsData || [];
        }
      }

      // Process pending invitations
      let pendingOrgs = [];
      const { data: pendingInvitationsById, error: pendingErrorById } =
        pendingInvitationsByIdResult;
      const { data: emailInvitations, error: pendingErrorByEmail } =
        emailInvitationsResult;

      if (pendingErrorById) {
        console.error(
          "Error fetching pending invitations by user_id:",
          pendingErrorById
        );
      }

      if (pendingErrorByEmail) {
        console.warn(
          "Error fetching pending invitations by email:",
          pendingErrorByEmail
        );
      }

      // Combine both invitation results and extract unique organization IDs
      const allPendingInvitations = [
        ...(pendingInvitationsById || []),
        ...(emailInvitations || []),
      ];

      if (allPendingInvitations.length > 0) {
        const orgIds = [
          ...new Set(allPendingInvitations.map((inv) => inv.organization_id)),
        ];

        // Fetch organizations for pending invitations
        const { data: orgsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, created_at")
          .in("id", orgIds);

        if (orgsError) {
          console.error("Error fetching pending organizations:", orgsError);
        } else if (orgsData) {
          // Mark all as pending approval
          pendingOrgs = orgsData.map((org) => ({
            ...org,
            isPendingApproval: true,
          }));
        }
      }

      // Combine and deduplicate organizations
      const allOrgs = [...memberOrgs, ...pendingOrgs];
      const uniqueOrgs = Array.from(
        new Map(allOrgs.map((org) => [org.id, org])).values()
      );

      // Sort by created_at
      uniqueOrgs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Update state and cache
      setOrganizations(uniqueOrgs);
      saveToCache(uniqueOrgs);
      cacheLoadedRef.current = true;
    } catch (err) {
      setError(err);
      setOrganizations([]);
      saveToCache([]);
    } finally {
      setFetching(false);
    }
  }, [supabase, loadFromCache, saveToCache]);

  // Load from cache on mount, then fetch fresh data in background
  useEffect(() => {
    const cachedOrgs = loadFromCache();
    if (cachedOrgs && cachedOrgs.length > 0) {
      setOrganizations(cachedOrgs);
      setFetching(false);
      cacheLoadedRef.current = true;
      // Fetch fresh data in background
      fetchOrganizations(false);
    } else {
      // No cache, fetch immediately
      fetchOrganizations(false);
    }
  }, [fetchOrganizations, loadFromCache]);

  // Listen for events to refetch organizations (e.g., when a member is removed)
  useEffect(() => {
    const handleRefetch = () => {
      // Clear cache on refetch
      try {
        localStorage.removeItem(STORAGE_KEY_ORGS);
      } catch (err) {
        // Silently handle cache clear errors
      }
      cacheLoadedRef.current = false;
      fetchOrganizations(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("organizations:refetch", handleRefetch);
      return () => {
        window.removeEventListener("organizations:refetch", handleRefetch);
      };
    }
  }, [fetchOrganizations]);

  // Set up real-time subscription to detect when user is removed from an organization
  // Defer subscription setup by 1 second to avoid blocking initial render
  useEffect(() => {
    let mounted = true;
    let retryTimeout = null;
    let subscriptionTimeout = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 5000]; // Exponential backoff in ms
    const SUBSCRIPTION_DELAY = 1000; // 1 second delay

    const setupSubscription = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return;
        }

        // Clean up existing channel if any
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Create a unique channel name for this user
        const channelName = `user-organizations-${user.id}`;

        // Try to subscribe with a filter first (more efficient and RLS-friendly)
        // If RLS blocks filtered subscriptions, we'll fall back to unfiltered
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "organization_members",
              // Use filter to only receive DELETE events for this user
              // This is more efficient and RLS-friendly
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // User was removed from an organization - refetch the list
              if (mounted) {
                const removedOrgId = payload.old?.organization_id;

                // Dispatch event to clear cache for this organization
                if (typeof window !== "undefined" && removedOrgId) {
                  window.dispatchEvent(
                    new CustomEvent("organization:removed", {
                      detail: { organizationId: removedOrgId },
                    })
                  );
                }

                // Refetch organizations list
                fetchOrganizations();
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "organization_members",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // User was added to an organization - refetch the list
              if (mounted) {
                fetchOrganizations();
              }
            }
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to organization_members changes");
              retryCount = 0; // Reset retry count on success
            } else if (status === "CHANNEL_ERROR") {
              const errorMessage = err?.message || "Unknown error";
              console.warn(
                "Error subscribing to organization_members changes:",
                errorMessage,
                err
              );

              // Only retry if we haven't exceeded max retries and component is still mounted
              if (mounted && retryCount < MAX_RETRIES) {
                const delay =
                  RETRY_DELAYS[retryCount] ||
                  RETRY_DELAYS[RETRY_DELAYS.length - 1];
                console.log(
                  `Retrying subscription in ${delay}ms (attempt ${
                    retryCount + 1
                  }/${MAX_RETRIES})`
                );

                retryTimeout = setTimeout(() => {
                  if (mounted) {
                    retryCount++;
                    // Clean up failed channel before retrying
                    if (channelRef.current) {
                      supabase.removeChannel(channelRef.current);
                      channelRef.current = null;
                    }
                    setupSubscription();
                  }
                }, delay);
              } else if (mounted) {
                // Max retries exceeded - gracefully degrade
                console.warn(
                  "Max retries exceeded for organization_members subscription. " +
                    "Real-time updates disabled. The app will continue to work, " +
                    "but you may need to refresh to see organization changes."
                );
                // The app continues to work - users can still manually refresh
                // or rely on the existing refetch mechanisms
              }
            } else if (status === "TIMED_OUT") {
              console.warn(
                "Subscription to organization_members changes timed out. " +
                  "This may be due to network issues."
              );
              // Retry on timeout
              if (mounted && retryCount < MAX_RETRIES) {
                const delay =
                  RETRY_DELAYS[retryCount] ||
                  RETRY_DELAYS[RETRY_DELAYS.length - 1];
                retryTimeout = setTimeout(() => {
                  if (mounted) {
                    retryCount++;
                    if (channelRef.current) {
                      supabase.removeChannel(channelRef.current);
                      channelRef.current = null;
                    }
                    setupSubscription();
                  }
                }, delay);
              }
            } else if (status === "CLOSED") {
              // Channel was closed - this is normal during cleanup
              if (mounted) {
                console.log("Organization subscription channel closed");
              }
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error("Error setting up organization subscription:", err);
        // Retry on exception if we haven't exceeded max retries
        if (mounted && retryCount < MAX_RETRIES) {
          const delay =
            RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          retryTimeout = setTimeout(() => {
            if (mounted) {
              retryCount++;
              setupSubscription();
            }
          }, delay);
        }
      }
    };

    // Delay subscription setup to avoid blocking initial render
    subscriptionTimeout = setTimeout(() => {
      if (mounted) {
        setupSubscription();
      }
    }, SUBSCRIPTION_DELAY);

    // Cleanup function
    return () => {
      mounted = false;
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
        subscriptionTimeout = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, fetchOrganizations]);

  const createOrganization = useCallback(
    async (name, organizationTypeId = null) => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        if (!name || typeof name !== "string") {
          throw new Error("El nombre de la organización es requerido.");
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
          throw new Error(
            "El nombre de la organización debe tener al menos 2 caracteres."
          );
        }

        if (trimmedName.length > 100) {
          throw new Error(
            "El nombre de la organización no puede tener más de 100 caracteres."
          );
        }

        // Build request body
        const requestBody = { name: trimmedName };
        if (organizationTypeId !== null && organizationTypeId !== undefined) {
          requestBody.organization_type_id = organizationTypeId;
        }

        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al crear la organización.");
        }

        if (result.error) {
          throw new Error(result.message || "Error al crear la organización.");
        }

        setData(result.data);
        // Clear cache and refresh organizations list after creating
        try {
          localStorage.removeItem(STORAGE_KEY_ORGS);
        } catch (err) {
          // Silently handle cache clear errors
        }
        cacheLoadedRef.current = false;
        await fetchOrganizations(false);
        return {
          error: false,
          message: result.message || "Organización creada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al crear la organización.";
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
    [fetchOrganizations]
  );

  const getOrganization = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!id || typeof id !== "string") {
        throw new Error("ID de organización inválido.");
      }

      const response = await fetch(`/api/organizations/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al obtener la organización.");
      }

      if (result.error) {
        throw new Error(result.message || "Error al obtener la organización.");
      }

      setData(result.data);
      return {
        error: false,
        message: result.message || "Organización obtenida exitosamente.",
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err.message || "Error inesperado al obtener la organización.";
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

  const updateOrganization = useCallback(
    async (id, name) => {
      try {
        setLoading(true);
        setError(null);

        if (!id || typeof id !== "string") {
          throw new Error("ID de organización inválido.");
        }

        if (!name || typeof name !== "string") {
          throw new Error("El nombre de la organización es requerido.");
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
          throw new Error(
            "El nombre de la organización debe tener al menos 2 caracteres."
          );
        }

        if (trimmedName.length > 100) {
          throw new Error(
            "El nombre de la organización no puede tener más de 100 caracteres."
          );
        }

        const response = await fetch(`/api/organizations/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Error al actualizar la organización."
          );
        }

        if (result.error) {
          throw new Error(
            result.message || "Error al actualizar la organización."
          );
        }

        setData(result.data);
        // Clear cache and refresh organizations list after updating
        try {
          localStorage.removeItem(STORAGE_KEY_ORGS);
        } catch (err) {
          // Silently handle cache clear errors
        }
        cacheLoadedRef.current = false;
        await fetchOrganizations(false);
        return {
          error: false,
          message: result.message || "Organización actualizada exitosamente.",
          data: result.data,
        };
      } catch (err) {
        const errorMessage =
          err.message || "Error inesperado al actualizar la organización.";
        setError(err);
        return {
          error: true,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrganizations]
  );

  return {
    data,
    organizations,
    loading,
    fetching,
    error,
    createOrganization,
    getOrganization,
    updateOrganization,
    refetch: fetchOrganizations,
  };
}
