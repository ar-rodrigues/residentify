import { redirect } from "next/navigation";
import { getOrganizationById } from "@/utils/api/organizations";
import { hasRouteAccess, getAllowedRolesForRoute } from "@/utils/auth/routePermissions";
import { MENU_ITEMS } from "@/utils/menu/organizationMenu";

/**
 * Check if user has access to a specific route in an organization
 * Uses permission-based checks from menu configuration (preferred) with role-based fallback
 * @param {string} organizationId - The organization ID
 * @param {string} routePath - The route path (e.g., '/invites', '/members')
 * @returns {Promise<{hasAccess: boolean, organization?: Object, error?: Object}>}
 */
export async function checkRouteAccess(organizationId, routePath) {
  try {
    // Get organization data (includes authentication and validation)
    const result = await getOrganizationById(organizationId);

    if (result.error || !result.data) {
      return {
        hasAccess: false,
        error: result,
      };
    }

    const organization = result.data;

    // Check if user has access using permission-based system (from menu configuration)
    const permissions = organization.permissions || [];
    
    // Find the menu item for this route
    const menuItem = MENU_ITEMS.find(item => item.path === routePath);
    
    if (menuItem && menuItem.permission) {
      // Use permission-based check (preferred method)
      const hasPermission = permissions.includes(menuItem.permission);
      
      return {
        hasAccess: hasPermission,
        organization: organization,
        error: hasPermission
          ? null
          : {
              error: true,
              message: "No tienes permiso para acceder a esta página.",
              status: 403,
            },
      };
    }

    // Fallback to role-based check for routes not in menu or without permission requirement
    const organizationType = organization.organization_type || "residential";
    const userRole = organization.userRole;

    if (!userRole) {
      return {
        hasAccess: false,
        error: {
          error: true,
          message: "No tienes un rol asignado en esta organización.",
          status: 403,
        },
      };
    }

    const accessGranted = hasRouteAccess(routePath, userRole, organizationType);

    return {
      hasAccess: accessGranted,
      organization: organization,
      error: accessGranted
        ? null
        : {
            error: true,
            message: "No tienes permiso para acceder a esta página.",
            status: 403,
          },
    };
  } catch (error) {
    console.error("Error checking route access:", error);
    return {
      hasAccess: false,
      error: {
        error: true,
        message: "Error inesperado al verificar permisos.",
        status: 500,
      },
    };
  }
}

/**
 * Require route access - redirects if user doesn't have access
 * Use this in server components to protect routes
 * @param {string} organizationId - The organization ID
 * @param {string} routePath - The route path (e.g., '/invites', '/members')
 * @returns {Promise<Object>} Organization data if authorized (throws redirect if not)
 */
export async function requireRouteAccess(organizationId, routePath) {
  const { hasAccess, organization, error } = await checkRouteAccess(
    organizationId,
    routePath
  );

  if (!hasAccess || !organization) {
    // Redirect to organization home page if unauthorized
    redirect(`/organizations/${organizationId}`);
  }

  return organization;
}

/**
 * Require specific role(s) - redirects if user doesn't have the required role
 * Use this when you need to check for specific roles rather than route-based access
 * @param {string} organizationId - The organization ID
 * @param {string|string[]} requiredRoles - Single role or array of roles
 * @returns {Promise<Object>} Organization data if authorized (throws redirect if not)
 */
export async function requireRole(organizationId, requiredRoles) {
  const result = await getOrganizationById(organizationId);

  if (result.error || !result.data) {
    redirect("/organizations");
  }

  const organization = result.data;
  const userRole = organization.userRole;

  if (!userRole) {
    redirect(`/organizations/${organizationId}`);
  }

  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (!rolesArray.includes(userRole)) {
    redirect(`/organizations/${organizationId}`);
  }

  return organization;
}















