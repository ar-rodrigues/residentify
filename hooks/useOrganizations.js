"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

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

  const fetchOrganizations = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setOrganizations([]);
        return;
      }

      // Fetch organizations where user is a member
      // First get the organization IDs from organization_members
      let memberOrgs = [];
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);

      if (memberError) {
        console.error("Error fetching member organization IDs:", memberError);
        memberOrgs = [];
      } else if (memberData && memberData.length > 0) {
        // Extract organization IDs
        const orgIds = memberData.map((m) => m.organization_id);

        // Now fetch organizations separately (this uses the "Users can view organizations they belong to" policy)
        const { data: orgsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, created_at")
          .in("id", orgIds)
          .order("created_at", { ascending: false });

        if (orgsError) {
          console.error("Error fetching organizations:", orgsError);
          memberOrgs = [];
        } else {
          memberOrgs = orgsData || [];
        }
      }

      // Fetch organizations where user has pending approval invitations
      // Query by user_id OR email (for cases where user_id might be NULL)
      let pendingOrgs = [];

      if (user.id) {
        // First, fetch invitations by user_id (for general invite links where user_id is set)
        const { data: pendingInvitationsById, error: pendingErrorById } =
          await supabase
            .from("organization_invitations")
            .select("organization_id")
            .eq("user_id", user.id)
            .in("status", ["pending_approval", "pending"]);

        if (pendingErrorById) {
          console.error(
            "Error fetching pending invitations by user_id:",
            pendingErrorById
          );
        }

        // Also fetch by email if user has email (for admin-created invitations where user_id is NULL)
        let pendingInvitationsByEmail = [];
        if (user.email) {
          const { data: emailInvitations, error: pendingErrorByEmail } =
            await supabase
              .from("organization_invitations")
              .select("organization_id")
              .eq("email", user.email.toLowerCase())
              .in("status", ["pending_approval", "pending"])
              .is("user_id", null);

          if (pendingErrorByEmail) {
            console.warn(
              "Error fetching pending invitations by email:",
              pendingErrorByEmail
            );
          } else if (emailInvitations) {
            pendingInvitationsByEmail = emailInvitations;
          }
        }

        // Combine both invitation results and extract unique organization IDs
        const allPendingInvitations = [
          ...(pendingInvitationsById || []),
          ...pendingInvitationsByEmail,
        ];

        if (allPendingInvitations.length > 0) {
          const orgIds = [
            ...new Set(allPendingInvitations.map((inv) => inv.organization_id)),
          ];

          // Now fetch organizations separately using the organization IDs
          // This uses the "Users can view organizations with pending invitations" policy
          const { data: orgsData, error: orgsError } = await supabase
            .from("organizations")
            .select("id, name, created_at")
            .in("id", orgIds);

          if (orgsError) {
            console.error("Error fetching pending organizations:", orgsError);
            pendingOrgs = [];
          } else if (orgsData) {
            // Mark all as pending approval
            pendingOrgs = orgsData.map((org) => ({
              ...org,
              isPendingApproval: true,
            }));
          }
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

      setOrganizations(uniqueOrgs);
    } catch (err) {
      setError(err);
      setOrganizations([]);
    } finally {
      setFetching(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Listen for events to refetch organizations (e.g., when a member is removed)
  useEffect(() => {
    const handleRefetch = () => {
      fetchOrganizations();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("organizations:refetch", handleRefetch);
      return () => {
        window.removeEventListener("organizations:refetch", handleRefetch);
      };
    }
  }, [fetchOrganizations]);

  // Set up real-time subscription to detect when user is removed from an organization
  useEffect(() => {
    let mounted = true;

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

        // Subscribe to DELETE events on organization_members where this user is removed
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "organization_members",
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
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to organization_members changes");
            } else if (status === "CHANNEL_ERROR") {
              console.error(
                "Error subscribing to organization_members changes"
              );
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error("Error setting up organization subscription:", err);
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      mounted = false;
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
        // Refresh organizations list after creating
        await fetchOrganizations();
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
        // Refresh organizations list after updating
        await fetchOrganizations();
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
