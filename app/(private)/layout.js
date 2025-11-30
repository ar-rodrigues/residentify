"use client";

import { RiUserLine, RiLogoutBoxLine } from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { Avatar, Space, Typography, Dropdown } from "antd";
import { Layout, Header, Content } from "@/components/ui/Layout";
import LogoutButton from "@/components/ui/LogoutButton";
import { FeatureFlagsProvider } from "@/components/providers/FeatureFlagsProvider";
import AppNavigation from "@/components/navigation/AppNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const { Text } = Typography;

export default function PrivateLayout({ children }) {
  const { data: user } = useUser({ redirectToLogin: true });
  const isMobile = useIsMobile();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const collapseTimeoutRef = useRef(null);

  // Initialize: auto-collapse after 3 seconds on mount (desktop only)
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
      return;
    }

    collapseTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isMobile]);

  const handleMouseEnter = () => {
    if (isMobile) return;

    // Clear timeout when hovering to prevent collapse
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    // Expand sidebar on hover
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;

    // Set timeout to collapse after 3 seconds when leaving
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Profile menu items for mobile dropdown
  const profileMenuItems = [
    {
      key: "profile",
      label: "Mi Perfil",
      icon: <RiUserLine />,
      onClick: () => router.push("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Cerrar Sesión",
      icon: <RiLogoutBoxLine />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <FeatureFlagsProvider>
      <Layout className="min-h-screen">
        <AppNavigation
          collapsed={collapsed}
          onCollapse={setCollapsed}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        <Layout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 80 : 256,
            transition: "margin-left 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            paddingBottom: isMobile ? "64px" : 0,
          }}
        >
          <Header
            className="shadow-sm border-b border-gray-700 flex items-center justify-end"
            style={{
              backgroundColor: "#1e1b4b",
              color: "#ffffff",
              paddingLeft: isMobile ? "16px" : "24px",
              paddingRight: isMobile ? "16px" : "24px",
            }}
          >
            <Space size="middle">
              {isMobile ? (
                // Mobile: Only profile icon with dropdown
                <Dropdown
                  menu={{ items: profileMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Avatar
                    icon={<RiUserLine />}
                    style={{
                      backgroundColor: "#2563eb",
                      cursor: "pointer",
                    }}
                    size="default"
                  />
                </Dropdown>
              ) : (
                // Desktop: Email and logout button
                <>
                  <Space size="small">
                    <Avatar
                      icon={<RiUserLine />}
                      style={{ backgroundColor: "#2563eb" }}
                    />
                    <Text style={{ color: "#ffffff" }}>
                      {user?.email || "N/A"}
                    </Text>
                  </Space>
                  <LogoutButton />
                </>
              )}
            </Space>
          </Header>
          <Content className="p-2 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-6">{children}</div>
          </Content>
        </Layout>
      </Layout>
    </FeatureFlagsProvider>
  );
}
