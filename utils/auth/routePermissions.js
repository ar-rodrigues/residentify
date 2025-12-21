/**
 * Route permissions mapper
 * Extracts route-to-role mappings from menu configuration
 * This serves as the single source of truth for route access control
 */

// Menu items for residential organizations (imported structure)
const RESIDENTIAL_MENU_ITEMS = {
  admin: [
    {
      key: "members",
      path: "/members",
      roles: ["admin"],
    },
    {
      key: "invitations",
      path: "/invitations",
      roles: ["admin"],
    },
    {
      key: "chatPermissions",
      path: "/chat-permissions",
      roles: ["admin"],
    },
    {
      key: "chat",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
  resident: [
    {
      key: "invites",
      path: "/invites",
      roles: ["resident"],
    },
    {
      key: "chat",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
  security: [
    {
      key: "validate",
      path: "/validate",
      roles: ["security"],
    },
    {
      key: "history",
      path: "/history",
      roles: ["security"],
    },
    {
      key: "pending",
      path: "/pending",
      roles: ["security"],
    },
    {
      key: "chat",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
};

/**
 * Build route-to-roles mapping from menu configuration
 * @param {string} organizationType - The organization type (e.g., 'residential')
 * @returns {Map<string, string[]>} Map of route paths to allowed roles
 */
function buildRoutePermissions(organizationType) {
  const routeMap = new Map();

  if (organizationType === "residential") {
    // Collect all menu items from all roles
    const allItems = [];
    Object.values(RESIDENTIAL_MENU_ITEMS).forEach((roleItems) => {
      allItems.push(...roleItems);
    });

    // Build map: route path -> array of allowed roles
    allItems.forEach((item) => {
      const path = item.path;
      const allowedRoles = item.roles || [];

      if (routeMap.has(path)) {
        // Merge roles if route already exists
        const existingRoles = routeMap.get(path);
        const mergedRoles = [...new Set([...existingRoles, ...allowedRoles])];
        routeMap.set(path, mergedRoles);
      } else {
        routeMap.set(path, [...allowedRoles]);
      }
    });
  }

  return routeMap;
}

// Cache for route permissions by organization type
const routePermissionsCache = new Map();

/**
 * Get allowed roles for a specific route
 * @param {string} routePath - The route path (e.g., '/invites', '/members')
 * @param {string} organizationType - The organization type (default: 'residential')
 * @returns {string[]} Array of roles that can access this route, or empty array if route not found
 */
export function getAllowedRolesForRoute(routePath, organizationType = "residential") {
  if (!routePermissionsCache.has(organizationType)) {
    routePermissionsCache.set(organizationType, buildRoutePermissions(organizationType));
  }

  const routeMap = routePermissionsCache.get(organizationType);
  return routeMap.get(routePath) || [];
}

/**
 * Check if a role has access to a specific route
 * @param {string} routePath - The route path (e.g., '/invites', '/members')
 * @param {string} userRole - The user's role (e.g., 'admin', 'resident', 'security')
 * @param {string} organizationType - The organization type (default: 'residential')
 * @returns {boolean} True if user role has access, false otherwise
 */
export function hasRouteAccess(routePath, userRole, organizationType = "residential") {
  if (!routePath || !userRole) {
    return false;
  }

  const allowedRoles = getAllowedRolesForRoute(routePath, organizationType);

  // If no roles are defined for this route, deny access by default
  if (allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

/**
 * Get all routes accessible by a specific role
 * @param {string} userRole - The user's role
 * @param {string} organizationType - The organization type (default: 'residential')
 * @returns {string[]} Array of route paths accessible by this role
 */
export function getRoutesForRole(userRole, organizationType = "residential") {
  if (!routePermissionsCache.has(organizationType)) {
    routePermissionsCache.set(organizationType, buildRoutePermissions(organizationType));
  }

  const routeMap = routePermissionsCache.get(organizationType);
  const accessibleRoutes = [];

  routeMap.forEach((allowedRoles, routePath) => {
    if (allowedRoles.includes(userRole)) {
      accessibleRoutes.push(routePath);
    }
  });

  return accessibleRoutes;
}






