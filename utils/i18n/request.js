/**
 * Get locale from request headers
 * @param {Request} request - The request object
 * @returns {string} The locale code (es or pt)
 */
export function getLocaleFromRequest(request) {
  // First, try to get from x-next-intl-locale header (set by middleware)
  const localeHeader = request.headers.get("x-next-intl-locale");
  if (localeHeader && (localeHeader === "es" || localeHeader === "pt")) {
    return localeHeader;
  }

  // Try to extract locale from Referer header URL (e.g., /pt/organizations/... or /es/organizations/...)
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const pathname = url.pathname;
      // Extract locale from pathname (first segment after /)
      const pathSegments = pathname.split("/").filter(Boolean);
      if (pathSegments.length > 0) {
        const firstSegment = pathSegments[0];
        if (firstSegment === "pt" || firstSegment === "es") {
          return firstSegment;
        }
      }
    } catch (e) {
      // If URL parsing fails, continue to next method
      console.warn("Failed to parse Referer URL:", e);
    }
  }

  // Try to get locale from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    // Check if Portuguese is preferred
    if (acceptLanguage.includes("pt")) {
      return "pt";
    }
    // Check if Spanish is preferred
    if (acceptLanguage.includes("es")) {
      return "es";
    }
  }

  // Default to Spanish
  return "es";
}












