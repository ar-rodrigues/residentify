"use client";

/**
 * Hook to get the current organization from context
 * This is now a simple wrapper around the OrganizationProvider context
 * All the logic is handled in the provider for better performance and caching
 *
 * @returns {{ organization: Object | null, organizationId: string | null, loading: boolean, error: Error | null, refetch: () => void, updateOrganization: (org) => void, clearCache: () => void }}
 */
export { useCurrentOrganization } from "@/components/providers/OrganizationProvider";
