"use client";

import {
  RiUserLine,
  RiLogoutBoxLine,
  RiGlobalLine,
  RiCheckLine,
} from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { Avatar, Space, Dropdown } from "antd";
import { Layout, Header, Content } from "@/components/ui/Layout";
import { FeatureFlagsProvider } from "@/components/providers/FeatureFlagsProvider";
import AppNavigation from "@/components/navigation/AppNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const languages = [
  { value: "es", label: "Español", abbreviation: "ES" },
  { value: "pt", label: "Português (BR)", abbreviation: "PT-BR" },
];

export default function PrivateLayout({ children }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: user } = useUser({ redirectToLogin: true });
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const collapseTimeoutRef = useRef(null);
  const isTogglingLanguageRef = useRef(false);

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

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

  const handleLanguageChange = useCallback(
    ({ key: newLocale }) => {
      // Get current path without locale prefix
      const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

      // Save preference to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred-locale", newLocale);
      }

      // Navigate to new locale path
      router.push(`/${newLocale}${pathWithoutLocale}`);
    },
    [pathname, locale, router]
  );

  // Handle language menu toggle
  const handleLanguageToggle = useCallback(() => {
    isTogglingLanguageRef.current = true;
    setLanguageExpanded((prev) => !prev);
    // Reset flag after state update
    setTimeout(() => {
      isTogglingLanguageRef.current = false;
    }, 100);
  }, []);

  // Language option items (shown inline when expanded)
  const languageOptionItems = useMemo(() => {
    return languages.map((lang) => {
      const isCurrent = locale === lang.value;
      return {
        key: `lang-${lang.value}`,
        label: (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: "44px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              backgroundColor: isCurrent
                ? "rgba(37, 99, 235, 0.1)"
                : "rgba(0, 0, 0, 0.02)",
              margin: "0",
              marginTop: "0",
              marginBottom: "0",
              marginLeft: "-12px",
              marginRight: "-12px",
              borderLeft: "3px solid",
              borderColor: isCurrent ? "#2563eb" : "transparent",
              borderRadius: "8px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              position: "relative",
            }}
          >
            <span
              style={{
                color: isCurrent ? "#2563eb" : "inherit",
                fontWeight: isCurrent ? 500 : 400,
              }}
            >
              {lang.label}
            </span>
            {isCurrent && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <RiCheckLine
                  style={{
                    color: "#2563eb",
                    fontSize: "16px",
                    marginLeft: "8px",
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        ),
        onClick: () => {
          handleLanguageChange({ key: lang.value });
          setLanguageExpanded(false);
          setDropdownOpen(false);
        },
      };
    });
  }, [locale, handleLanguageChange]);

  // Profile menu items for dropdown
  // Include language option that expands inline (both mobile and desktop)
  const profileMenuItems = useMemo(
    () => [
      {
        key: "profile",
        label: t("navigation.profile"),
        icon: <RiUserLine />,
        onClick: () => router.push("/profile"),
      },
      {
        type: "divider",
      },
      {
        key: "language",
        label: (
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span>Idioma</span>
            <span
              style={{
                fontSize: "12px",
                color: "#8b8b8b",
                fontWeight: "normal",
              }}
            >
              (
              {languages.find((lang) => lang.value === locale)
                ?.abbreviation || ""}
              )
            </span>
          </div>
        ),
        icon: <RiGlobalLine />,
        onClick: (e) => {
          if (e?.domEvent) {
            e.domEvent.stopPropagation();
            e.domEvent.preventDefault();
          }
          handleLanguageToggle();
          // Force dropdown to stay open after state update
          setTimeout(() => {
            setDropdownOpen(true);
          }, 0);
        },
      },
      ...(languageExpanded ? languageOptionItems : []),
      {
        type: "divider",
      },
      {
        key: "logout",
        label: t("navigation.logout"),
        icon: <RiLogoutBoxLine />,
        danger: true,
        onClick: handleLogout,
      },
    ],
    [
      t,
      router,
      locale,
      languageExpanded,
      languageOptionItems,
      handleLogout,
      handleLanguageToggle,
    ]
  );

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <FeatureFlagsProvider>
      <Layout
        className="min-h-screen overflow-x-hidden"
        style={{ maxWidth: "100vw" }}
      >
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
            width: isMobile
              ? "100%"
              : `calc(100vw - ${collapsed ? 80 : 256}px)`,
            maxWidth: isMobile
              ? "100%"
              : `calc(100vw - ${collapsed ? 80 : 256}px)`,
            overflowX: "hidden",
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
              {/* Profile icon dropdown */}
              <Dropdown
                open={dropdownOpen}
                menu={{
                  items: profileMenuItems,
                  onClick: (info) => {
                    // For language item, the onClick is handled in the item definition
                    // For other items, close the dropdown
                    if (
                      info.key !== "language" &&
                      !info.key.startsWith("lang-")
                    ) {
                      setDropdownOpen(false);
                    }
                  },
                }}
                placement="bottomRight"
                trigger={["click"]}
                onOpenChange={(open) => {
                  // Prevent dropdown from closing if we're toggling language
                  if (!open && isTogglingLanguageRef.current) {
                    setDropdownOpen(true);
                    return;
                  }
                  setDropdownOpen(open);
                  if (!open) {
                    setLanguageExpanded(false);
                  }
                }}
                popupRender={(menu) => (
                  <div
                    style={{
                      minWidth: "200px",
                      maxWidth: "200px",
                      overflow: "visible",
                    }}
                  >
                    {menu}
                  </div>
                )}
              >
                <Avatar
                  icon={<RiUserLine />}
                  style={{
                    backgroundColor: "#2563eb",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  className="hover:opacity-80 hover:scale-110 active:scale-95"
                  size="default"
                />
              </Dropdown>
            </Space>
          </Header>
          <Content className="p-2 bg-gray-50 overflow-x-hidden">
            <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-hidden">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </FeatureFlagsProvider>
  );
}
