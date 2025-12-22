import {
  RiUserLine,
  RiMailLine,
  RiSettingsLine,
  RiChat4Line,
  RiQrCodeLine,
  RiQrScanLine,
  RiHistoryLine,
  RiFileListLine,
} from "react-icons/ri";

// Icon mapping for menu items
const iconMap = {
  RiUserLine,
  RiMailLine,
  RiSettingsLine,
  RiChat4Line,
  RiQrCodeLine,
  RiQrScanLine,
  RiHistoryLine,
  RiFileListLine,
};

// Menu items for residential organizations
const RESIDENTIAL_MENU_ITEMS = {
  admin: [
    {
      key: "members",
      icon: "RiUserLine",
      path: "/members",
      roles: ["admin"],
    },
    {
      key: "chat",
      icon: "RiChat4Line",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
  resident: [
    {
      key: "invites",
      icon: "RiQrCodeLine",
      path: "/invites",
      roles: ["resident"],
    },
    {
      key: "chat",
      icon: "RiChat4Line",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
  security: [
    {
      key: "validate",
      icon: "RiQrScanLine",
      path: "/validate",
      roles: ["security"],
    },
    {
      key: "history",
      icon: "RiHistoryLine",
      path: "/history",
      roles: ["security"],
    },
    {
      key: "pending",
      icon: "RiFileListLine",
      path: "/pending",
      roles: ["security"],
    },
    {
      key: "chat",
      icon: "RiChat4Line",
      path: "/chat",
      roles: ["admin", "resident", "security"],
    },
  ],
};

/**
 * Get menu items for an organization based on type and role
 * @param {string} organizationType - The organization type (e.g., 'residential', 'commercial')
 * @param {string} role - The user's role in the organization (e.g., 'admin', 'resident', 'security')
 * @param {string} organizationId - The organization ID
 * @param {Function} t - Translation function
 * @param {string} locale - The locale code (e.g., 'es', 'pt')
 * @returns {Array} Array of menu items with full paths and icons
 */
export function getOrganizationMenuItems(
  organizationType,
  role,
  organizationId,
  t,
  locale
) {
  // Handle no organization case
  if (!organizationType || !role || !organizationId) {
    return []; // No menu items when no organization context
  }

  let menuItems = [];

  switch (organizationType) {
    case "residential":
      menuItems = RESIDENTIAL_MENU_ITEMS[role] || [];
      break;
    // Future organization types can be added here:
    // case "commercial":
    //   menuItems = COMMERCIAL_MENU_ITEMS[role] || [];
    //   break;
    default:
      menuItems = [];
  }

  // Filter by role permissions and build full paths with translations
  return menuItems
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      const IconComponent = iconMap[item.icon];
      return {
        key: item.key,
        label: t(`menu.${item.key}`),
        icon: IconComponent || null,
        path: `/${locale}/organizations/${organizationId}${item.path}`,
      };
    });
}

/**
 * Get the default route for a role in an organization type
 * @param {string} organizationType - The organization type
 * @param {string} role - The user's role
 * @param {string} organizationId - The organization ID
 * @param {string} locale - The locale code (e.g., 'es', 'pt')
 * @returns {string|null} Default route path or null
 */
export function getDefaultRoute(organizationType, role, organizationId, locale) {
  if (!organizationType || !role || !organizationId) {
    return null;
  }

  const menuItems = getOrganizationMenuItems(
    organizationType,
    role,
    organizationId,
    () => "",
    locale
  );

  if (menuItems.length > 0) {
    return menuItems[0].path;
  }

  return null;
}
