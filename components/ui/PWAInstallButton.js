"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useTranslations } from "next-intl";
import { RiDownloadLine } from "react-icons/ri";
import Button from "./Button";
import PWAInstallInstructions from "./PWAInstallInstructions";

/**
 * PWA Install Button Component
 * Only visible on mobile devices
 * Shows install button for Android or instructions for iOS
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'button' (default) or 'menuItem'
 * @param {string} props.size - Button size (for button variant)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional click handler
 */
export default function PWAInstallButton({
  variant = "button",
  size = "middle",
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
      <Button
        type="default"
        icon={<RiDownloadLine />}
        onClick={handleClick}
        size={size}
        className={className}
        style={{
          width: variant === "fullWidth" ? "100%" : "auto",
        }}
      >
        {t("pwa.install.button")}
      </Button>
      <PWAInstallInstructions
        open={showIOSInstructions}
        onClose={closeIOSInstructions}
        isIOS={isIOS}
      />
    </>
  );
}
