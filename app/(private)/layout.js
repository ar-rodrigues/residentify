"use client";

import {
  RiRocketLine,
  RiTeamLine,
  RiUserLine,
  RiDashboardLine,
  RiBuildingLine,
  RiAddLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Menu, Avatar, Space, Typography, Button, List, Spin } from "antd";
import { Layout, Header, Content, Sider } from "@/components/ui/Layout";
import LogoutButton from "@/components/ui/LogoutButton";
import { getPrivateMenu } from "@/utils/config/app";
import { FeatureFlagsProvider } from "@/components/providers/FeatureFlagsProvider";

const { Text } = Typography;

// Icon mapping for menu items
const iconMap = {
  RiDashboardLine: RiDashboardLine,
  RiRocketLine: RiRocketLine,
  RiTeamLine: RiTeamLine,
  RiUserLine: RiUserLine,
  RiBuildingLine: RiBuildingLine,
};

export default function PrivateLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: user } = useUser({ redirectToLogin: true });
  const { organizations, fetching } = useOrganizations();
  const collapseTimeoutRef = useRef(null);

  // Initialize: auto-collapse after 3 seconds on mount
  useEffect(() => {
    collapseTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    // Clear timeout when hovering to prevent collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    // Expand sidebar on hover
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    // Set timeout to collapse after 3 seconds when leaving
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 3000);
  };

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

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <FeatureFlagsProvider>
      <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={256}
        trigger={null}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
        }}
        className="ant-layout-sider"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
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
                Proyecto Starter
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
          <div className="border-t border-gray-200 flex-shrink-0">
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
                          onClick={() =>
                            router.push(`/organizations/${org.id}`)
                          }
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
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 256,
          transition: "margin-left 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Header
          className="shadow-sm border-b border-gray-700 flex items-center justify-end px-6"
          style={{
            backgroundColor: "#1e1b4b",
            color: "#ffffff",
          }}
        >
          <Space size="middle">
            <Space size="small">
              <Avatar
                icon={<RiUserLine />}
                style={{ backgroundColor: "#2563eb" }}
              />
              <Text style={{ color: "#ffffff" }}>{user?.email || "N/A"}</Text>
            </Space>
            <LogoutButton />
          </Space>
        </Header>
        <Content className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
    </FeatureFlagsProvider>
  );
}
