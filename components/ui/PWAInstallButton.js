"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useTranslations } from "next-intl";
import { RiDownloadLine } from "react-icons/ri";
import PWAInstallInstructions from "./PWAInstallInstructions";

/**
 * PWA Install Button Component
 * Floating circular button with glass effect
 * Only visible on mobile devices
 * Shows install button for Android or instructions for iOS
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'floating' (default) or 'menuItem'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional click handler
 */
export default function PWAInstallButton({
  variant = "floating",
  className = "",
  onClick,
}) {
  const t = useTranslations();
  const {
    isMobile,
    isIOS,
    isInstalled,
    canInstall,
    showIOSInstructions,
    handleInstall,
    closeIOSInstructions,
  } = usePWAInstall();

  // Don't render if not mobile or already installed
  if (!isMobile || isInstalled) {
    return null;
  }

  // Only show button if installation is possible:
  // For iOS: always show (will display instructions)
  // For Android: only show if beforeinstallprompt event has fired (canInstall === true)
  if (!canInstall) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    handleInstall();
  };

  // Menu item variant (for dropdown menus)
  // Returns just the label text - icon is handled by Ant Design menu
  // The onClick is handled by the menu item's onClick prop in the layout
  if (variant === "menuItem") {
    // Store the install handler in a way that can be accessed
    // We'll use a ref or expose it via a custom property
    // For now, return the label and handle click via the menu's onClick
    return (
      <>
        <span>{t("pwa.install.button")}</span>
        <PWAInstallInstructions
          open={showIOSInstructions}
          onClose={closeIOSInstructions}
          isIOS={isIOS}
        />
      </>
    );
  }

  // Button variant (default)
  return (
    <>
      <button
        onClick={handleClick}
        className={`${className} group`}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          zIndex: 1000,
          color: "var(--color-primary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.15) inset";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset";
        }}
        aria-label={t("pwa.install.button")}
      >
        <RiDownloadLine style={{ fontSize: "24px" }} />
      </button>
      <PWAInstallInstructions
        open={showIOSInstructions}
        onClose={closeIOSInstructions}
        isIOS={isIOS}
      />
    </>
  );
}
