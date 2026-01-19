"use client";

import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

/**
 * Hook for client-side authorization checks using organization context
 * Note: These checks are for UX only. Server-side verification is still required for security.
 *
 * @returns {{
 *   isAdmin: boolean,
 *   isFrozen: boolean,
 *   userRole: string | null,
 *   hasRole: (role: string) => boolean,
 *   canAccess: (permission: string) => boolean,
 *   hasPermission: (permission: string) => boolean
 * }}
 */
export function useOrganizationAuth() {
  const { organization, hasPermission } = useCurrentOrganization();

  /**
   * Check if user has a specific role (legacy - prefer hasPermission)
   * @param {string} role - The role to check (e.g., 'admin', 'resident', 'security')
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return organization?.userRole === role;
  };

  /**
   * Check if user can access a specific permission (legacy - prefer hasPermission)
   * @param {string} permission - The permission to check
   * @returns {boolean}
   */
  const canAccess = (permission) => {
    if (!organization) return false;

    // Map legacy permissions to new permission codes
    const legacyMap = {
      manage_members: "members:manage",
      manage_invitations: "invites:manage",
      manage_chat_permissions: "chat:manage",
      edit_organization: "org:update",
      view_pending: "qr:validate",
      view_history: "qr:view_history",
      view_members: "members:view",
    };

    const newPermission = legacyMap[permission] || permission;
    return hasPermission(newPermission);
  };

  // Admin check: use isAdmin field from organization OR check for admin seat type OR check for admin permissions
  const isAdmin = organization?.isAdmin || 
                  organization?.userRole === 'admin' || 
                  (hasPermission("members:manage") && hasPermission("org:update"));

  return {
    isAdmin,
    isFrozen: organization?.is_frozen || false,
    userRole: organization?.userRole || null,
    hasRole,
    canAccess,
    hasPermission,
  };
}















