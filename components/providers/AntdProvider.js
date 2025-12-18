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
    
    return {
      algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
        colorError: errorColor,
        borderRadius: 8,
        fontFamily: computedStyle.getPropertyValue("--font-sans").trim() || "system-ui, -apple-system, sans-serif",
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
        },
        Input: {
          borderRadius: 8,
        },
        Menu: {
          itemSelectedBg: "transparent",
          itemActiveBg: "transparent",
          itemHoverBg: "rgba(255, 255, 255, 0.05)",
          itemSelectedColor: computedStyle.getPropertyValue("--color-primary").trim() || "#2563eb",
          itemHoverColor: computedStyle.getPropertyValue("--color-text-primary").trim() || "#1a1a1a",
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
