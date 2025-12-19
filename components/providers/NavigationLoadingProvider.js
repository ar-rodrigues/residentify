"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { usePathname } from "next/navigation";

const NavigationLoadingContext = createContext(null);

/**
 * Provider for navigation loading state
 * Tracks when navigation is in progress and which path is being navigated to
 */
export function NavigationLoadingProvider({ children }) {
  const [isPending, startTransition] = useTransition();
  const [loadingPath, setLoadingPath] = useState(null);
  const pathname = usePathname();

  // Clear loading state when pathname changes (navigation completes)
  const clearLoading = useCallback(() => {
    setLoadingPath(null);
  }, []);

  // Set loading path and start transition
  const startNavigation = useCallback(
    (path, navigationCallback) => {
      // If navigating to the same path, don't show loading state
      // Still call the navigation callback in case it does something
      if (path === pathname) {
        startTransition(() => {
          navigationCallback();
        });
        return;
      }

      setLoadingPath(path);
      startTransition(() => {
        navigationCallback();
      });
    },
    [startTransition, pathname]
  );

  const value = useMemo(
    () => ({
      isPending,
      loadingPath,
      startNavigation,
      clearLoading,
    }),
    [isPending, loadingPath, startNavigation, clearLoading]
  );

  // Clear loading when pathname changes (navigation completes)
  useEffect(() => {
    if (pathname) {
      clearLoading();
    }
  }, [pathname, clearLoading]);

  // Also clear loading if loadingPath matches current pathname (handles same-route clicks)
  // This ensures loading state clears even when pathname doesn't change
  useEffect(() => {
    if (loadingPath && loadingPath === pathname) {
      // Clear after a brief delay to allow any pending transitions to complete
      const timer = setTimeout(() => {
        clearLoading();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loadingPath, pathname, clearLoading]);

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

/**
 * Hook to access navigation loading state
 */
export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      "useNavigationLoading must be used within NavigationLoadingProvider"
    );
  }
  return context;
}
