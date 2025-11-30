"use client";

import {
  RiRocketLine,
  RiUserLine,
  RiBuildingLine,
  RiAddLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Menu, Space, Typography, Button, List, Spin } from "antd";
import { Sider } from "@/components/ui/Layout";
import { getPrivateMenu } from "@/utils/config/app";

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
  const router = useRouter();
  const pathname = usePathname();
  const { organizations, fetching } = useOrganizations();

  // Transform config menu items to Ant Design menu format
  const menuItems = useMemo(() => {
    const privateMenu = getPrivateMenu();
    return privateMenu.map((item) => {
      const IconComponent = iconMap[item.iconName];
      return {
        key: item.key,
        icon: IconComponent ? <IconComponent /> : null,
        label: item.label,
      };
    });
  }, []);

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
            <div className="flex items-center justify-between mb-3">
              <Space size="small">
                <RiBuildingLine className="text-lg text-blue-600" />
                {!collapsed && (
                  <Typography.Text strong className="text-sm">
                    Organizaciones
                  </Typography.Text>
                )}
              </Space>
            </div>

            {!collapsed && (
              <>
                <Button
                  type="primary"
                  icon={<RiAddLine />}
                  size="small"
                  block
                  onClick={() => router.push("/organizations/create")}
                  className="mb-3"
                >
                  Crear
                </Button>

                {fetching ? (
                  <div className="flex justify-center py-4">
                    <Spin size="small" />
                  </div>
                ) : organizations.length === 0 ? (
                  <Typography.Text type="secondary" className="text-xs">
                    No tienes organizaciones
                  </Typography.Text>
                ) : (
                  <List
                    size="small"
                    dataSource={organizations}
                    renderItem={(org) => (
                      <List.Item
                        className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
                        onClick={() => router.push(`/organizations/${org.id}`)}
                      >
                        <Typography.Text
                          ellipsis
                          className="text-xs"
                          style={{
                            color:
                              pathname === `/organizations/${org.id}`
                                ? "#1890ff"
                                : undefined,
                          }}
                        >
                          {org.name}
                        </Typography.Text>
                      </List.Item>
                    )}
                  />
                )}
              </>
            )}

            {collapsed && (
              <div className="flex justify-center">
                <Button
                  type="primary"
                  icon={<RiAddLine />}
                  size="small"
                  onClick={() => router.push("/organizations/create")}
                  title="Crear Organización"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Sider>
  );
}

