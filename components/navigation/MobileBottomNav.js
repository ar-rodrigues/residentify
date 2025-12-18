"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { getOrganizationMenuItems } from "@/utils/menu/organizationMenu";
import { useTranslations } from "next-intl";
import { Spin } from "antd";
import { useNavigationLoading } from "@/components/providers/NavigationLoadingProvider";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
  const {
    organization,
    organizationId,
    loading: loadingOrg,
  } = useCurrentOrganization();
  const { isPending, loadingPath, startNavigation } = useNavigationLoading();

  // Get dynamic menu items based on organization type and role
  const orgMenuItems = useMemo(() => {
    if (
      !organization ||
      !organization.organization_type ||
      !organization.userRole
    ) {
      return [];
    }
    return getOrganizationMenuItems(
      organization.organization_type,
      organization.userRole,
      organization.id,
      t
    );
  }, [organization, t]);

  // Use only organization menu items (limit to 4 for mobile)
  const menuItems = useMemo(() => {
    return orgMenuItems.slice(0, 4).map((item) => ({
      ...item,
      key: item.path,
    }));
  }, [orgMenuItems]);

  // If user has no organizations, don't render mobile menu
  if (!fetchingOrgs && organizations.length === 0) {
    return null;
  }

  const handleItemClick = (key) => {
    startNavigation(key, () => {
      router.push(key);
    });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: "var(--color-bg-elevated)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--color-border)",
        boxShadow:
          "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");
          const isLoading = loadingPath === item.path;
          const isDisabled = isPending && !isLoading;

          return (
            <button
              key={item.path}
              onClick={() => handleItemClick(item.path)}
              disabled={isDisabled}
              className={`
                flex flex-col items-center justify-center flex-1 h-full mx-2 rounded-lg
                transition-all duration-200 ease-out
                active:scale-95 active:opacity-80
                ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
              style={{
                backgroundColor: isActive
                  ? "var(--color-primary-bg)"
                  : "transparent",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: isActive 
                  ? "var(--color-primary)" 
                  : "var(--color-text-secondary)",
              }}
              aria-label={item.label}
            >
              {isLoading ? (
                <Spin
                  size="small"
                  className="mb-1"
                  style={{ 
                    color: isActive 
                      ? "var(--color-primary)" 
                      : "var(--color-text-secondary)" 
                  }}
                />
              ) : (
                IconComponent && (
                  <IconComponent
                    className="text-xl mb-1 transition-colors duration-200"
                    style={{
                      color: isActive 
                        ? "var(--color-primary)" 
                        : "var(--color-text-secondary)",
                    }}
                  />
                )
              )}
              <span
                className="text-xs font-medium transition-colors duration-200"
                style={{
                  color: isActive 
                    ? "var(--color-primary)" 
                    : "var(--color-text-secondary)",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
