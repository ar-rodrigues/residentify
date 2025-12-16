"use client";

import { useEffect } from "react";
import {
  RiRocketLine,
  RiBuildingLine,
  RiAddLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { getOrganizationMenuItems } from "@/utils/menu/organizationMenu";
import {
  Menu,
  Space,
  Typography,
  Button,
  Spin,
  Dropdown,
  Badge,
  Tooltip,
} from "antd";
import { Sider } from "@/components/ui/Layout";

export default function DesktopSidebar({
  collapsed,
  onCollapse,
  onMouseEnter,
  onMouseLeave,
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
  const {
    organization,
    organizationId,
    loading: loadingOrg,
  } = useCurrentOrganization();

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
          router.push(`/organizations/${org.id}`);
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
        onClick: () => router.push("/organizations/create"),
      },
    ];
  }, [organizations, organizationId, router, t]);

  // Get dynamic menu items based on organization type and role
  // Always show organization menu items (from current/main organization)
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

  // Get role label for badge
  const roleLabel = useMemo(() => {
    if (!organization?.userRole) return null;
    const roleMap = {
      admin: t("roles.admin"),
      resident: t("roles.resident"),
      security: t("roles.security"),
    };
    return roleMap[organization.userRole] || organization.userRole;
  }, [organization, t]);

  // If user has no organizations, don't render sidebar
  if (!fetchingOrgs && organizations.length === 0) {
    return null;
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      width={256}
      trigger={null}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        transition: "width 2s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "width",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
      }}
      className="ant-layout-sider"
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div
          className="p-4 border-b"
          style={{
            borderColor: "rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <Space size="small">
            <RiRocketLine className="text-2xl text-blue-600" />
            <Typography.Text
              strong
              className="text-lg"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : "200px",
                overflow: "hidden",
                transition:
                  "opacity 2s cubic-bezier(0.16, 1, 0.3, 1), max-width 2s cubic-bezier(0.16, 1, 0.3, 1)",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              Residentify
            </Typography.Text>
          </Space>
        </div>

        {/* Organization Selector */}
        {organization && (
          <div
            className="p-4 border-b"
            style={{
              borderColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            {collapsed ? (
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RiBuildingLine className="text-xl text-blue-600" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: "#e6f7ff",
                  }}
                >
                  <RiBuildingLine
                    className="text-2xl"
                    style={{ color: "#1890ff" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Tooltip title={organization.name} placement="top">
                      <Typography.Text
                        strong
                        className="text-base"
                        style={{
                          margin: 0,
                          lineHeight: "1.4",
                          flex: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word",
                          hyphens: "auto",
                        }}
                      >
                        {organization.name}
                      </Typography.Text>
                    </Tooltip>
                    {fetchingOrgs ? (
                      <Spin
                        size="small"
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                    ) : (
                      <Dropdown
                        menu={{ items: organizationMenuItems }}
                        placement="bottomRight"
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<RiArrowDownSLine />}
                          style={{
                            padding: "4px",
                            height: "auto",
                            minWidth: "auto",
                            flexShrink: 0,
                            color: "#666",
                            marginTop: "2px",
                          }}
                          aria-label={t(
                            "organizations.header.changeOrganization"
                          )}
                        />
                      </Dropdown>
                    )}
                  </div>
                  {roleLabel && (
                    <div>
                      <span
                        style={{
                          backgroundColor: "#e6f7ff",
                          color: "#1890ff",
                          border: "1px solid #91d5ff",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 500,
                          display: "inline-block",
                        }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 overflow-auto">
          {loadingOrg ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              items={orgMenuItems.map((item) => ({
                ...item,
                key: item.path,
                icon: item.icon ? <item.icon /> : null,
              }))}
              onClick={({ key }) => router.push(key)}
              style={{
                borderRight: 0,
                transition: "all 2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          )}
        </div>

        {/* Add Organization Button at Bottom */}
        {!collapsed && (
          <div
            className="p-4 border-t"
            style={{
              borderColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <Button
              type="primary"
              icon={<RiAddLine />}
              block
              onClick={() => router.push("/organizations/create")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {t("organizations.header.createNew")}
            </Button>
          </div>
        )}
        {collapsed && (
          <div
            className="p-4 border-t flex justify-center"
            style={{
              borderColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <Button
              type="primary"
              icon={<RiAddLine />}
              shape="circle"
              onClick={() => router.push("/organizations/create")}
              aria-label={t("organizations.header.createNew")}
            />
          </div>
        )}
      </div>
    </Sider>
  );
}
