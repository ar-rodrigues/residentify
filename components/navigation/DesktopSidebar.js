"use client";

import {
  RiRocketLine,
  RiUserLine,
  RiBuildingLine,
  RiAddLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Menu, Space, Typography, Button, Spin } from "antd";
import { Sider } from "@/components/ui/Layout";
import { useTranslatedMenu } from "@/hooks/useTranslatedMenu";

// Icon mapping for menu items
const iconMap = {
  RiBuildingLine: RiBuildingLine,
  RiUserLine: RiUserLine,
};

export default function DesktopSidebar({
  collapsed,
  onCollapse,
  onMouseEnter,
  onMouseLeave,
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { organizations, fetching } = useOrganizations();
  const translatedMenu = useTranslatedMenu();

  // Transform config menu items to Ant Design menu format
  const menuItems = useMemo(() => {
    return translatedMenu.map((item) => {
      const IconComponent = iconMap[item.iconName];
      return {
        key: item.key,
        icon: IconComponent ? <IconComponent /> : null,
        label: item.label,
      };
    });
  }, [translatedMenu]);

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
        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
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
                  "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              Residentify
            </Typography.Text>
          </Space>
        </div>
        <div className="flex-1 overflow-auto">
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{
              borderRight: 0,
              transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Organizations Section */}
        <div
          className="border-t flex-shrink-0"
          style={{
            borderColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="p-4">
            {!collapsed && (
              <>
                {/* Organization List */}
                {fetching ? (
                  <div className="flex justify-center py-4 mb-3">
                    <Spin size="small" />
                  </div>
                ) : organizations.length === 0 ? (
                  <Typography.Text
                    type="secondary"
                    className="text-xs block mb-3"
                  >
                    {t("navigation.noOrganizations")}
                  </Typography.Text>
                ) : (
                  <div className="space-y-1 mb-3">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="cursor-pointer rounded-md px-3 py-2 transition-all border border-transparent hover:border-blue-200 hover:bg-blue-50"
                        style={{
                          backgroundColor:
                            pathname === `/organizations/${org.id}`
                              ? "#e6f7ff"
                              : undefined,
                          borderColor:
                            pathname === `/organizations/${org.id}`
                              ? "#91d5ff"
                              : undefined,
                        }}
                        onClick={() => router.push(`/organizations/${org.id}`)}
                      >
                        <Typography.Text
                          ellipsis
                          className="text-xs"
                          style={{
                            color:
                              pathname === `/organizations/${org.id}`
                                ? "#1890ff"
                                : "#595959",
                            fontWeight:
                              pathname === `/organizations/${org.id}`
                                ? 500
                                : 400,
                          }}
                        >
                          {org.name}
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                )}

                {/* Organizations Label with Create Button */}
                <div className="flex items-center justify-between">
                  <Space size="small">
                    <RiBuildingLine className="text-lg text-blue-600" />
                    <Typography.Text strong className="text-sm">
                      {t("navigation.organizations")}
                    </Typography.Text>
                  </Space>
                  <Button
                    type="primary"
                    icon={<RiAddLine />}
                    size="small"
                    shape="circle"
                    onClick={() => router.push("/organizations/create")}
                    title={t("navigation.createOrganization")}
                    style={{
                      minWidth: "32px",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                </div>
              </>
            )}

            {collapsed && (
              <div className="flex justify-center">
                <Button
                  type="primary"
                  icon={<RiAddLine />}
                  size="small"
                  onClick={() => router.push("/organizations/create")}
                  title={t("navigation.createOrganization")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Sider>
  );
}
