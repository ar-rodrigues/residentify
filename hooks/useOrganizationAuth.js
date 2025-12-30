"use client";

import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

/**
 * Hook for client-side authorization checks using organization context
 * Note: These checks are for UX only. Server-side verification is still required for security.
 *
 * @returns {{
 *   isAdmin: boolean,
 *   userRole: string | null,
 *   hasRole: (role: string) => boolean,
 *   canAccess: (permission: string) => boolean
 * }}
 */
export function useOrganizationAuth() {
  const { organization } = useCurrentOrganization();

  /**
   * Check if user has a specific role
   * @param {string} role - The role to check (e.g., 'admin', 'resident', 'security')
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return organization?.userRole === role;
  };

  /**
   * Check if user can access a specific permission
   * @param {string} permission - The permission to check
   * @returns {boolean}
   */
  const canAccess = (permission) => {
    if (!organization) return false;

    const role = organization.userRole;
    const isAdmin = organization.isAdmin || false;

    // Admin has access to everything
    if (isAdmin) return true;

    // Permission-based checks
    switch (permission) {
      case "manage_members":
      case "manage_invitations":
      case "manage_chat_permissions":
      case "edit_organization":
        return isAdmin;
      case "view_pending":
      case "view_history":
        return role === "security";
      case "view_members":
        return isAdmin || role === "resident" || role === "security";
      default:
        return false;
    }
  };

  return {
    isAdmin: organization?.isAdmin || false,
    userRole: organization?.userRole || null,
    hasRole,
    canAccess,
  };
}











