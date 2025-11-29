"use client";

import { useEffect } from "react";

/**
 * Client component to store organization ID in localStorage
 * This is used for navigation purposes (e.g., redirecting to last used org)
 */
export default function OrganizationIdStorage({ organizationId }) {
  useEffect(() => {
    if (organizationId) {
      localStorage.setItem("lastUsedOrganizationId", organizationId);
    }
  }, [organizationId]);

  return null; // This component doesn't render anything
}



