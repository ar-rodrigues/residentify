"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomNav from "./MobileBottomNav";

export default function AppNavigation({
  collapsed,
  onCollapse,
}) {
  const isMobile = useIsMobile();

  // Render mobile bottom navigation
  if (isMobile) {
    return <MobileBottomNav />;
  }

  // Render desktop sidebar
  return (
    <DesktopSidebar
      collapsed={collapsed}
      onCollapse={onCollapse}
    />
  );
}

