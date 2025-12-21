"use client";

import { useMemo } from "react";
import { RiRocketLine, RiAddLine } from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { getOrganizationMenuItems } from "@/utils/menu/organizationMenu";
import { useNavigationLoading } from "@/components/providers/NavigationLoadingProvider";
import { Menu, Space, Typography, Button, Spin } from "antd";
import { Sider } from "@/components/ui/Layout";

export default function DesktopSidebar({
  collapsed,
  onCollapse,
  onMouseEnter,
  onMouseLeave,
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
  const { organization, loading: loadingOrg } = useCurrentOrganization();
  const { isPending, loadingPath, startNavigation } = useNavigationLoading();

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
      t,
      locale
    );
  }, [organization, t, locale]);

  // Handle menu item click with loading state
  const handleMenuClick = ({ key }) => {
    startNavigation(key, () => {
      router.push(key);
    });
  };

  // Handle add organization button click with loading state
  const handleAddOrganizationClick = () => {
    const path = `/${locale}/organizations/create`;
    startNavigation(path, () => {
      router.push(path);
    });
  };

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
        overflowX: "hidden",
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
        backgroundColor: "var(--color-bg-elevated)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid var(--color-border)",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
      }}
      className="ant-layout-sider desktop-sidebar-only"
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div
          className="p-4 border-b"
          style={{
            borderColor: "var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <Space size="small">
            <RiRocketLine
              className="text-2xl"
              style={{ color: "var(--color-primary)" }}
            />
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

        {/* Menu Items */}
        <div className="flex-1 overflow-auto overflow-x-hidden">
          {loadingOrg ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              items={orgMenuItems.map((item) => {
                const isLoading = loadingPath === item.path;
                return {
                  ...item,
                  key: item.path,
                  icon: isLoading ? (
                    <Spin size="small" />
                  ) : item.icon ? (
                    <item.icon />
                  ) : null,
                  disabled: isPending && !isLoading,
                };
              })}
              onClick={handleMenuClick}
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
              borderColor: "var(--color-border)",
            }}
          >
            <Button
              type="primary"
              icon={
                loadingPath === `/${locale}/organizations/create` ? (
                  <Spin size="small" />
                ) : (
                  <RiAddLine style={{ color: "var(--color-primary)" }} />
                )
              }
              block
              onClick={handleAddOrganizationClick}
              loading={loadingPath === `/${locale}/organizations/create`}
              disabled={
                isPending && loadingPath !== `/${locale}/organizations/create`
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: "var(--color-primary-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
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
              borderColor: "var(--color-border)",
            }}
          >
            <Button
              type="primary"
              icon={
                loadingPath === `/${locale}/organizations/create` ? (
                  <Spin size="small" />
                ) : (
                  <RiAddLine style={{ color: "var(--color-primary)" }} />
                )
              }
              shape="circle"
              onClick={handleAddOrganizationClick}
              loading={loadingPath === `/${locale}/organizations/create`}
              disabled={
                isPending && loadingPath !== `/${locale}/organizations/create`
              }
              aria-label={t("organizations.header.createNew")}
              style={{
                backgroundColor: "var(--color-primary-bg)",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            />
          </div>
        )}
      </div>
    </Sider>
  );
}
