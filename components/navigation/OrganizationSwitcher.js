"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNavigationLoading } from "@/components/providers/NavigationLoadingProvider";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  RiBuildingLine,
  RiAddLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { Dropdown, Button, Space, Typography, Spin, Tooltip, Tag } from "antd";
import { getRoleConfig } from "@/config/roles";

const { Text } = Typography;

/**
 * OrganizationSwitcher component for header
 * Displays current organization and allows switching between organizations
 * @param {Object} props
 * @param {boolean} props.compact - Whether to show compact mobile version
 */
export default function OrganizationSwitcher({ compact = false }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
  const {
    organization,
    organizationId,
    loading: loadingOrg,
  } = useCurrentOrganization();
  const { isPending, loadingPath, startNavigation } = useNavigationLoading();

  // Build organization selector dropdown items
  const organizationMenuItems = useMemo(() => {
    const otherOrganizations = organizations.filter(
      (org) => org.id !== organizationId
    );

    return [
      ...otherOrganizations.map((org) => ({
        key: org.id,
        label: org.name,
        onClick: async () => {
          // Validate that the organization is still in the user's list
          // This prevents navigation to organizations the user was removed from
          const orgStillExists = organizations.some((o) => o.id === org.id);
          if (!orgStillExists) {
            // Organization was removed - refetch organizations list
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("organizations:refetch"));
            }
            return;
          }

          // Update main organization
          try {
            const response = await fetch("/api/profiles/main-organization", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ organization_id: org.id }),
            });

            const result = await response.json();

            // If update fails (e.g., user no longer has access), don't navigate
            if (!response.ok || result.error) {
              // Refetch organizations list in case it's stale
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("organizations:refetch"));
              }
              return;
            }
          } catch (err) {
            console.error("Error updating main organization:", err);
            // Don't navigate if there's an error
            return;
          }
          const targetPath = `/${locale}/organizations/${org.id}`;
          startNavigation(targetPath, () => {
            router.push(targetPath);
          });
        },
      })),
      ...(otherOrganizations.length > 0
        ? [
            {
              type: "divider",
            },
          ]
        : []),
      {
        key: "create",
        label: (
          <Space>
            <RiAddLine />
            <span>{t("organizations.header.createNew")}</span>
          </Space>
        ),
        onClick: () => {
          const path = `/${locale}/organizations/create`;
          startNavigation(path, () => {
            router.push(path);
          });
        },
      },
    ];
  }, [organizations, organizationId, router, t, startNavigation, locale]);

  // Get role label and config for badge
  const roleLabel = useMemo(() => {
    if (!organization?.userRole) return null;
    const roleMap = {
      admin: t("roles.admin"),
      resident: t("roles.resident"),
      security: t("roles.security"),
    };
    return roleMap[organization.userRole] || organization.userRole;
  }, [organization, t]);

  const roleConfig = useMemo(() => {
    if (!organization?.userRole) return null;
    return getRoleConfig(organization.userRole);
  }, [organization]);

  // Don't render if organization is not loaded
  if (!organization && loadingOrg) {
    return (
      <div className="flex items-center">
        <Spin size="small" />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  // Mobile compact version
  if (isMobile || compact) {
    return (
      <div className="flex items-center min-w-0 flex-1" style={{ overflow: "visible" }}>
        {fetchingOrgs ? (
          <Spin size="small" />
        ) : (
          <Dropdown
            menu={{ items: organizationMenuItems }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              className="flex items-center gap-2 min-w-0"
              style={{
                color: isLightMode ? "var(--color-text-header)" : "var(--color-text-primary)",
                height: "auto",
                padding: "4px 8px",
                maxWidth: "100%",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isLightMode ? "rgba(37, 99, 235, 0.25)" : "var(--color-primary-bg)",
                }}
              >
                <RiBuildingLine
                  className="text-lg"
                  style={{ color: isLightMode ? "#60a5fa" : "var(--color-primary)" }}
                />
              </div>
              <div className="flex flex-col items-start min-w-0" style={{ gap: "2px" }}>
                <Tooltip title={organization.name} placement="bottom">
                  <Text
                    strong
                    ellipsis
                    className="text-sm min-w-0"
                    style={{
                      margin: 0,
                      color: isLightMode ? "var(--color-text-header)" : "var(--color-text-primary)",
                      whiteSpace: "nowrap",
                      maxWidth: "calc(100vw - 200px)", // Account for icon, arrow, and right side buttons
                      lineHeight: "1.2",
                    }}
                  >
                    {organization.name}
                  </Text>
                </Tooltip>
                {roleLabel && roleConfig && (
                  <Tag 
                    color={roleConfig.color} 
                    style={{ 
                      margin: 0,
                      fontSize: "9px",
                      padding: "2px 6px",
                      lineHeight: "1.2",
                      height: "auto",
                      ...(isLightMode && {
                        backgroundColor: roleConfig.color === "red" ? "rgba(239, 68, 68, 0.3)" : roleConfig.color === "orange" ? "rgba(249, 115, 22, 0.3)" : "rgba(37, 99, 235, 0.3)",
                        borderColor: roleConfig.color === "red" ? "rgba(239, 68, 68, 0.5)" : roleConfig.color === "orange" ? "rgba(249, 115, 22, 0.5)" : "rgba(37, 99, 235, 0.5)",
                        color: roleConfig.color === "red" ? "#fca5a5" : roleConfig.color === "orange" ? "#fdba74" : "#93c5fd",
                      }),
                    }}
                  >
                    {roleLabel}
                  </Tag>
                )}
              </div>
              <RiArrowDownSLine
                className="text-sm flex-shrink-0"
                style={{ color: isLightMode ? "rgba(255, 255, 255, 0.8)" : "var(--color-text-secondary)" }}
              />
            </Button>
          </Dropdown>
        )}
      </div>
    );
  }

  // Desktop version - show organization name with optional dropdown
  return (
    <div className="flex items-center min-w-0" style={{ overflow: "visible" }}>
      {fetchingOrgs ? (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isLightMode ? "rgba(37, 99, 235, 0.25)" : "var(--color-primary-bg)",
            }}
          >
            <RiBuildingLine
              className="text-xl"
              style={{ color: isLightMode ? "#60a5fa" : "var(--color-primary)" }}
            />
          </div>
          <Spin size="small" />
        </div>
      ) : (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isLightMode ? "rgba(37, 99, 235, 0.25)" : "var(--color-primary-bg)",
            }}
          >
            <RiBuildingLine
              className="text-xl"
              style={{ color: isLightMode ? "#60a5fa" : "var(--color-primary)" }}
            />
          </div>
          <Dropdown
            menu={{ items: organizationMenuItems }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              className="flex items-center gap-2 min-w-0 px-2"
              style={{
                color: isLightMode ? "var(--color-text-header)" : "var(--color-text-primary)",
                height: "auto",
                padding: "4px 8px",
                maxWidth: "100%",
              }}
            >
              <div className="flex flex-col items-start min-w-0" style={{ gap: "2px" }}>
                <Tooltip title={organization.name} placement="bottom">
                  <Text
                    strong
                    ellipsis
                    className="text-base min-w-0"
                    style={{
                      margin: 0,
                      color: isLightMode ? "var(--color-text-header)" : "var(--color-text-primary)",
                      whiteSpace: "nowrap",
                      lineHeight: "1.2",
                    }}
                  >
                    {organization.name}
                  </Text>
                </Tooltip>
                {roleLabel && roleConfig && (
                  <Tag 
                    color={roleConfig.color} 
                    style={{ 
                      margin: 0,
                      fontSize: "10px",
                      padding: "2px 6px",
                      lineHeight: "1.2",
                      height: "auto",
                      ...(isLightMode && {
                        backgroundColor: roleConfig.color === "red" ? "rgba(239, 68, 68, 0.3)" : roleConfig.color === "orange" ? "rgba(249, 115, 22, 0.3)" : "rgba(37, 99, 235, 0.3)",
                        borderColor: roleConfig.color === "red" ? "rgba(239, 68, 68, 0.5)" : roleConfig.color === "orange" ? "rgba(249, 115, 22, 0.5)" : "rgba(37, 99, 235, 0.5)",
                        color: roleConfig.color === "red" ? "#fca5a5" : roleConfig.color === "orange" ? "#fdba74" : "#93c5fd",
                      }),
                    }}
                  >
                    {roleLabel}
                  </Tag>
                )}
              </div>
              <RiArrowDownSLine
                className="text-sm flex-shrink-0"
                style={{ color: isLightMode ? "rgba(255, 255, 255, 0.8)" : "var(--color-text-secondary)" }}
              />
            </Button>
          </Dropdown>
        </div>
      )}
    </div>
  );
}

