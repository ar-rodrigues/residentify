"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { RiSunLine, RiMoonLine } from "react-icons/ri";
import Button from "./Button";
import { Tooltip } from "antd";

/**
 * Theme toggle button component
 * Allows users to switch between light and dark modes
 * Shows sun icon when in dark mode (to switch to light)
 * Shows moon icon when in light mode (to switch to dark)
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Tooltip title={isDark ? "Modo claro" : "Modo oscuro"}>
      <Button
        type="text"
        icon={isDark ? <RiSunLine /> : <RiMoonLine />}
        onClick={toggleTheme}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        style={{
          color: "var(--color-text-header)",
        }}
      />
    </Tooltip>
  );
}

