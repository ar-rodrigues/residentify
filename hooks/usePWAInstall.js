"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "./useMediaQuery";

/**
 * Custom hook to handle PWA installation
 * Detects mobile devices, iOS, installation status, and handles install prompts
 * @returns {Object} PWA install state and handlers
 */
export function usePWAInstall() {
  const isMobileMediaQuery = useIsMobile();
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Normalize to boolean to ensure consistent dependency array
  const isMobileMediaQueryBool = Boolean(isMobileMediaQuery);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Detect mobile device using multiple methods
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice =
      isMobileMediaQueryBool ||
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
      (window.innerWidth <= 1024 && "ontouchstart" in window);
    setIsMobile(isMobileDevice);

    // Detect iOS
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Detect if app is already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // For iOS, we can always show install instructions
    if (isIOSDevice) {
      setCanInstall(true);
    }
  }, [isMobileMediaQueryBool]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Handle beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log("PWA: beforeinstallprompt event fired");
      // Prevent the default mini-infobar from appearing
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      setCanInstall(true);
    };

    // Check if already installed or in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      console.log("PWA: App is already running in standalone mode");
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Log service worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log("PWA: Service Worker ready", registration);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Handle install button click
   * For Android: triggers native install prompt
   * For iOS: shows installation instructions
   */
  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    // Android/Chrome: use stored prompt if available
    if (installPrompt) {
      try {
        // Show the install prompt
        installPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await installPrompt.userChoice;

        if (outcome === "accepted") {
          setCanInstall(false);
          setInstallPrompt(null);
        } else {
          // User dismissed, clear the prompt
          setInstallPrompt(null);
        }
      } catch (error) {
        // Prompt failed, clear it
        console.warn("Install prompt error:", error);
        setInstallPrompt(null);
      }
    } else {
      // No prompt available on Android - this shouldn't happen if button visibility is controlled properly
      console.warn("Install prompt not available. Button should not be visible.");
    }
  };

  /**
   * Close iOS instructions modal
   */
  const closeIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  return {
    isMobile,
    isIOS,
    isInstalled,
    canInstall: canInstall && !isInstalled,
    installPrompt,
    showIOSInstructions,
    handleInstall,
    closeIOSInstructions,
  };
}
