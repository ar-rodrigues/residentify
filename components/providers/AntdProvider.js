"use client";

import { ConfigProvider, App, theme as antdTheme } from "antd";
import esES from "antd/locale/es_ES";
import ptBR from "antd/locale/pt_BR";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

const localeMap = {
  es: esES,
  pt: ptBR,
};

export default function AntdProvider({ children, locale = "es" }) {
  const antdLocale = localeMap[locale] || esES;
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Prevent hydration mismatch: Ant Design's App component generates
  // dynamic CSS variable class names that differ between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get theme configuration from CSS variables
  const getThemeConfig = () => {
    // Only access CSS variables on client side
    if (typeof window === "undefined") {
      return {
        token: {
          colorPrimary: "#2563eb",
          colorError: "#dc2626",
          borderRadius: 8,
          fontFamily: "system-ui, -apple-system, sans-serif",
          colorTextPlaceholder: "#4b5563",
        },
        components: {
          Button: {
            borderRadius: 8,
            fontWeight: 500,
            colorPrimary: "#2563eb",
            colorPrimaryHover: "#3b82f6",
            colorPrimaryActive: "#1d4ed8",
          },
          Card: {
            borderRadius: 12,
          },
          Input: {
            borderRadius: 8,
          },
          Menu: {
            itemSelectedBg: "transparent",
            itemActiveBg: "transparent",
            itemHoverBg: "rgba(255, 255, 255, 0.05)",
            itemSelectedColor: "#2563eb",
            itemHoverColor: "#1a1a1a",
          },
        },
      };
    }

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    const errorColor = computedStyle.getPropertyValue("--color-error").trim() || (theme === "dark" ? "#6b7280" : "#dc2626");
    
    const textPrimary = computedStyle.getPropertyValue("--color-text-primary").trim() || (theme === "dark" ? "#e0e0e0" : "#1a1a1a");
    const textSecondary = computedStyle.getPropertyValue("--color-text-secondary").trim() || (theme === "dark" ? "#a0a0a0" : "#6b7280");
    const textPlaceholder = computedStyle.getPropertyValue("--color-text-placeholder").trim() || (theme === "dark" ? "#737373" : "#4b5563");
    const bgElevated = computedStyle.getPropertyValue("--color-bg-elevated").trim() || (theme === "dark" ? "#000000" : "#ffffff");
    const borderColor = computedStyle.getPropertyValue("--color-border").trim() || (theme === "dark" ? "#1a1a1a" : "#e5e7eb");
    const primaryBg = computedStyle.getPropertyValue("--color-primary-bg").trim() || (theme === "dark" ? "rgba(91, 141, 239, 0.15)" : "#eff6ff");

    return {
      algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
        colorError: errorColor,
        borderRadius: 8,
        fontFamily: computedStyle.getPropertyValue("--font-sans").trim() || "system-ui, -apple-system, sans-serif",
        colorText: textPrimary,
        colorTextSecondary: textSecondary,
        colorTextPlaceholder: textPlaceholder,
        colorBgContainer: bgElevated,
        colorBorder: borderColor,
      },
      components: {
        Button: {
          borderRadius: 8,
          fontWeight: 500,
          colorPrimary: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
          colorPrimaryHover: computedStyle.getPropertyValue("--color-primary-light").trim() || computedStyle.getPropertyValue("--color-primary").trim() || "#3b82f6",
          colorPrimaryActive: computedStyle.getPropertyValue("--color-primary-dark").trim() || computedStyle.getPropertyValue("--color-primary").trim() || "#1d4ed8",
        },
        Card: {
          borderRadius: 12,
          colorText: textPrimary,
          colorTextHeading: textPrimary,
          colorBgContainer: bgElevated,
          colorBorderSecondary: borderColor,
        },
        Table: {
          colorText: textPrimary,
          colorTextHeading: textPrimary,
          colorBgContainer: bgElevated,
          colorBorderSecondary: borderColor,
          headerBg: theme === "dark" ? computedStyle.getPropertyValue("--color-bg-secondary").trim() || "#000000" : "#f8f9fa",
        },
        Alert: {
          colorText: textPrimary,
          colorInfo: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
          colorInfoBg: primaryBg,
          colorInfoBorder: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
        },
        Input: {
          borderRadius: 8,
        },
        Menu: {
          itemSelectedBg: "transparent",
          itemActiveBg: "transparent",
          itemHoverBg: "rgba(255, 255, 255, 0.05)",
          itemSelectedColor: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
          itemHoverColor: textPrimary,
        },
      },
    };
  };

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={getThemeConfig()}
    >
      {mounted ? (
        <App>
          {children}
        </App>
      ) : (
        <div suppressHydrationWarning>{children}</div>
      )}
    </ConfigProvider>
  );
}
