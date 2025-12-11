/**
 * Role Configuration
 *
 * Centralized configuration for organization roles including:
 * - Display colors (for badges, tags, etc.)
 * - Icons (from react-icons/ri)
 * - Any other role-specific styling
 *
 * To add a new role:
 * 1. Add the role name as a key
 * 2. Define color (Ant Design Badge/Tag color or custom hex)
 * 3. Define icon (from react-icons/ri)
 * 4. Optionally add custom styles
 */

import {
  RiShieldUserLine,
  RiHomeLine,
  RiShieldCheckLine,
} from "react-icons/ri";

export const roleConfig = {
  admin: {
    color: "red",
    icon: RiShieldUserLine,
    badgeStatus: "error", // For Ant Design Badge component
  },
  resident: {
    color: "blue",
    icon: RiHomeLine,
    badgeStatus: "processing", // For Ant Design Badge component
  },
  security: {
    color: "orange",
    icon: RiShieldCheckLine,
    badgeStatus: "warning", // For Ant Design Badge component
  },
};

/**
 * Get role configuration by role name
 * @param {string} roleName - The role name (e.g., "admin", "resident", "security")
 * @returns {Object} Role configuration object with color, icon, and badgeStatus
 */
export function getRoleConfig(roleName) {
  return (
    roleConfig[roleName] || {
      color: "default",
      icon: null,
      badgeStatus: "default",
    }
  );
}

/**
 * Get role color by role name
 * @param {string} roleName - The role name
 * @returns {string} Color string (Ant Design color or custom)
 */
export function getRoleColor(roleName) {
  return getRoleConfig(roleName).color;
}

/**
 * Get role icon component by role name
 * @param {string} roleName - The role name
 * @returns {React.Component|null} Icon component or null
 */
export function getRoleIcon(roleName) {
  const config = getRoleConfig(roleName);
  return config.icon ? config.icon : null;
}

/**
 * Get role badge status by role name
 * @param {string} roleName - The role name
 * @returns {string} Badge status for Ant Design Badge component
 */
export function getRoleBadgeStatus(roleName) {
  return getRoleConfig(roleName).badgeStatus;
}


