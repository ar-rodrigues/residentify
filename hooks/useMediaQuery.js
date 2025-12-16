"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect screen size changes using media queries
 * @param {string} query - Media query string (e.g., "(max-width: 768px)")
 * @returns {boolean} - True if media query matches, false otherwise
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event) => {
      setMatches(event.matches);
    };

    // Add listener (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect if screen is mobile (< 768px)
 * @returns {boolean} - True if screen width is less than 768px
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}
















