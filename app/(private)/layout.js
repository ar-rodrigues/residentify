"use client";

import {
  RiRocketLine,
  RiTeamLine,
  RiUserLine,
  RiDashboardLine,
} from "react-icons/ri";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { Menu, Avatar, Space, Typography } from "antd";
import { Layout, Header, Content, Sider } from "@/components/ui/Layout";
import LogoutButton from "@/components/ui/LogoutButton";
import { getPrivateMenu } from "@/utils/config/app";

const { Text } = Typography;

// Icon mapping for menu items
const iconMap = {
  RiDashboardLine: RiDashboardLine,
  RiRocketLine: RiRocketLine,
  RiTeamLine: RiTeamLine,
  RiUserLine: RiUserLine,
};

export default function PrivateLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: user } = useUser({ redirectToLogin: true });
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
        }}
        className="ant-layout-sider"
      >
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
  );
}
