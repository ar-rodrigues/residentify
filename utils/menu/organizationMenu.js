import {
  RiUserLine,
  RiMailLine,
  RiSettingsLine,
  RiChat4Line,
  RiQrCodeLine,
  RiQrScanLine,
  RiHistoryLine,
  RiFileListLine,
  RiLayoutMasonryLine,
  RiMoneyDollarBoxLine,
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
  RiLayoutMasonryLine,
  RiMoneyDollarBoxLine,
};

// Menu items with required permissions
export const MENU_ITEMS = [
  {
    key: "members",
    icon: "RiUserLine",
    path: "/members",
    permission: "members:view",
  },
  {
    key: "invites",
    icon: "RiQrCodeLine",
    path: "/invites",
    permission: "invites:create",
  },
  {
    key: "validate",
    icon: "RiQrScanLine",
    path: "/validate",
    permission: "qr:validate",
  },
  {
    key: "history",
    icon: "RiHistoryLine",
    path: "/history",
    permission: "qr:view_history",
  },
  {
    key: "pending",
    icon: "RiFileListLine",
    path: "/pending",
    permission: "qr:validate",
  },
  {
    key: "chat",
    icon: "RiChat4Line",
    path: "/chat",
    permission: "chat:read",
  },
  {
    key: "seats",
    icon: "RiLayoutMasonryLine",
    path: "/seats",
    permission: "members:manage",
  },
  {
    key: "billing",
    icon: "RiMoneyDollarBoxLine",
    path: "/billing",
    permission: "org:update",
  },
];

/**
 * Get menu items for an organization based on permissions
 * @param {string} organizationId - The organization ID
 * @param {Array} permissions - Array of permission codes the user has
 * @param {Function} t - Translation function
 * @param {string} locale - The locale code (e.g., 'es', 'pt')
 * @returns {Array} Array of menu items with full paths and icons
 */
export function getOrganizationMenuItems(
  organizationId,
  permissions,
  t,
  locale
) {
  // Handle no organization or permissions case
  if (!organizationId || !permissions) {
    return [];
  }

  // Filter by permissions and build full paths with translations
  return MENU_ITEMS.filter((item) => !item.permission || permissions.includes(item.permission)).map(
    (item) => {
      const IconComponent = iconMap[item.icon];
      return {
        key: item.key,
        label: t(`menu.${item.key}`),
        icon: IconComponent || null,
        path: `/${locale}/organizations/${organizationId}${item.path}`,
      };
    }
  );
}

/**
 * Get the default route for a user in an organization
 * @param {string} organizationId - The organization ID
 * @param {Array} permissions - Array of permission codes the user has
 * @param {string} locale - The locale code (e.g., 'es', 'pt')
 * @returns {string|null} Default route path or null
 */
export function getDefaultRoute(organizationId, permissions, locale) {
  if (!organizationId || !permissions) {
    return null;
  }

  const menuItems = getOrganizationMenuItems(
    organizationId,
    permissions,
    () => "",
    locale
  );

  if (menuItems.length > 0) {
    return menuItems[0].path;
  }

  return null;
}
