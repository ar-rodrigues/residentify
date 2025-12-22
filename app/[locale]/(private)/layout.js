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
import { Avatar, Space, Dropdown, Spin } from "antd";
import { Layout, Header, Content } from "@/components/ui/Layout";
import { FeatureFlagsProvider } from "@/components/providers/FeatureFlagsProvider";
import { OrganizationProvider } from "@/components/providers/OrganizationProvider";
import { NavigationLoadingProvider } from "@/components/providers/NavigationLoadingProvider";
import AppNavigation from "@/components/navigation/AppNavigation";
import OrganizationSwitcher from "@/components/navigation/OrganizationSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useNavigationLoading } from "@/components/providers/NavigationLoadingProvider";

const languages = [
  { value: "es", label: "Español", abbreviation: "ES" },
  { value: "pt", label: "Português (BR)", abbreviation: "PT-BR" },
];

// Inner component that uses the navigation loading hook
function ContentWithOverlay({
  children,
  isMobile,
  hasOrganizations,
  collapsed,
}) {
  const { isPending } = useNavigationLoading();

  return (
    <Content
      className="p-2 overflow-x-hidden"
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "var(--color-bg-secondary)",
      }}
    >
      <div
        className="rounded-lg shadow-sm p-6 overflow-x-hidden"
        style={{
          height: "100%",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {children}
        {/* Loading Overlay */}
        {isPending && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "var(--color-bg-primary)",
              opacity: 0.8,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              pointerEvents: "all",
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            <Spin size="large" />
          </div>
        )}
      </div>
    </Content>
  );
}

export default function PrivateLayout({ children }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: user } = useUser({ redirectToLogin: true });
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
  const [collapsed, setCollapsed] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const collapseTimeoutRef = useRef(null);
  const isTogglingLanguageRef = useRef(false);
  const userPreferenceRef = useRef(null); // Track if user has manually set a preference

  // Check if user has organizations
  const hasOrganizations = !fetchingOrgs && organizations.length > 0;

  // Load sidebar preference from localStorage on mount
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
      return;
    }

    try {
      const savedPreference = localStorage.getItem("sidebar-collapsed");
      if (savedPreference !== null) {
        const isCollapsed = savedPreference === "true";
        setCollapsed(isCollapsed);
        userPreferenceRef.current = true; // User has a saved preference
      } else {
        // First visit: start expanded by default
        setCollapsed(false);
        userPreferenceRef.current = null; // No preference set yet
      }
    } catch (err) {
      console.error("Error loading sidebar preference:", err);
      // On error, default to expanded
      setCollapsed(false);
    }

    // Cleanup on unmount
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isMobile]);

  const handleMouseEnter = () => {
    if (isMobile) return;
    // Only expand on hover if user hasn't manually set a preference
    if (userPreferenceRef.current !== true) {
      // Expand sidebar on hover
      setCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    // Don't auto-collapse - respect user's preference or default to expanded
    // Only collapse on hover leave if user hasn't set a preference (optional behavior)
    // For now, we keep it expanded by default
  };

  // Handle manual sidebar toggle - save preference
  const handleCollapse = useCallback((newCollapsed) => {
    setCollapsed(newCollapsed);
    userPreferenceRef.current = true; // Mark that user has set a preference

    // Save preference to localStorage
    try {
      localStorage.setItem("sidebar-collapsed", String(newCollapsed));
    } catch (err) {
      console.error("Error saving sidebar preference:", err);
    }

    // Clear any pending auto-collapse timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, []);

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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Idioma</span>
            <span
              style={{
                fontSize: "12px",
                color: "#8b8b8b",
                fontWeight: "normal",
              }}
            >
              (
              {languages.find((lang) => lang.value === locale)?.abbreviation ||
                ""}
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
      <OrganizationProvider>
        <NavigationLoadingProvider>
          <Layout
            className="overflow-x-hidden"
            style={{
              height: "100vh",
              maxWidth: "100vw",
              display: "flex",
              flexDirection: "row",
            }}
          >
            {hasOrganizations && (
              <AppNavigation
                collapsed={collapsed}
                onCollapse={handleCollapse}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )}
            <Layout
              style={{
                marginLeft:
                  hasOrganizations && !isMobile ? (collapsed ? 80 : 256) : 0,
                transition:
                  "margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                paddingBottom: hasOrganizations && isMobile ? "64px" : 0,
                width:
                  hasOrganizations && !isMobile
                    ? `calc(100vw - ${collapsed ? 80 : 256}px)`
                    : "100%",
                maxWidth:
                  hasOrganizations && !isMobile
                    ? `calc(100vw - ${collapsed ? 80 : 256}px)`
                    : "100%",
                overflowX: "hidden",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100vh",
              }}
            >
              <Header
                className="shadow-sm border-b flex items-center justify-between"
                style={{
                  backgroundColor: "var(--color-bg-header)",
                  color: "var(--color-text-header)",
                  borderColor: "var(--color-border)",
                  paddingLeft: isMobile ? "16px" : "24px",
                  paddingRight: isMobile ? "16px" : "24px",
                  flexShrink: 0,
                }}
              >
                {/* Organization Switcher - Left side - always reserve space */}
                <div
                  className="flex items-center min-w-0 flex-1"
                  style={{
                    height: "100%",
                    maxWidth: isMobile ? "calc(100% - 120px)" : "none",
                  }}
                >
                  {hasOrganizations && (
                    <OrganizationSwitcher compact={isMobile} />
                  )}
                </div>

                {/* Right side actions - always on right */}
                <div style={{ flexShrink: 0 }}>
                  <Space size="middle">
                    {/* Theme toggle */}
                    <ThemeToggle />
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
                </div>
              </Header>
              <ContentWithOverlay
                isMobile={isMobile}
                hasOrganizations={hasOrganizations}
                collapsed={collapsed}
              >
                {children}
              </ContentWithOverlay>
            </Layout>
          </Layout>
        </NavigationLoadingProvider>
      </OrganizationProvider>
    </FeatureFlagsProvider>
  );
}
