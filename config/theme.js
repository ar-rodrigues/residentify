/**
 * Theme Configuration
 *
 * Simplified color palette following dark mode best practices:
 * - 2-3 main colors maximum
 * - Dark gray (#121212) instead of pure black
 * - Off-white text (#E0E0E0) instead of pure white
 * - Desaturated colors for better dark mode experience
 */

export const theme = {
  colors: {
    // 1. Primary Color (Blue) - for accents, buttons, active states
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    primaryDark: "#1d4ed8",
    primaryBg: "#eff6ff",

    // 2. Neutral Gray Scale - for backgrounds and text
    bgPrimary: "#ffffff",
    bgSecondary: "#f8f9fa",
    bgElevated: "#ffffff",
    textPrimary: "#1a1a1a",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    borderSubtle: "#f3f4f6",

    // 3. Accent Color (Error/Alert) - minimal use
    error: "#dc2626",
    errorBg: "#fef2f2",
  },
  fonts: {
    sans: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
};

// Dark mode - simplified and optimized
export const darkTheme = {
  colors: {
    // 1. Primary Color (Desaturated Blue)
    primary: "#5b8def",
    primaryLight: "#7ba3f0",
    primaryDark: "#4a7ae0",
    primaryBg: "rgba(91, 141, 239, 0.1)",

    // 2. Neutral Gray Scale (Dark Gray, not pure black)
    bgPrimary: "#121212",
    bgSecondary: "#1e1e1e",
    bgElevated: "#242424",
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0a0",
    border: "#2a2a2a",
    borderSubtle: "#1e1e1e",

    // 3. Accent Color (Desaturated Red)
    error: "#ef4444",
    errorBg: "rgba(239, 68, 68, 0.1)",
  },
  fonts: {
    ...theme.fonts,
  },
  borderRadius: {
    ...theme.borderRadius,
  },
};
