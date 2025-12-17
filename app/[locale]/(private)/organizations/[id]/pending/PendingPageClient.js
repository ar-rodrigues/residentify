"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import PendingCodesList from "../_components/widgets/residential/PendingCodesList";
import { Spin } from "antd";

export default function PendingPageClient({ organizationId }) {
  const router = useRouter();
  const { organization, loading } = useCurrentOrganization();
  const { hasRole } = useOrganizationAuth();

  // Client-side check for immediate UX feedback
  useEffect(() => {
    if (!loading && organization) {
      if (!hasRole("security")) {
        router.push(`/organizations/${organizationId}`);
      }
    }
  }, [loading, organization, hasRole, organizationId, router]);

  // Show loading state while checking
  if (loading || !organization) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  // If not security, redirect (this will be handled by useEffect, but show nothing while redirecting)
  if (!hasRole("security")) {
    return null;
  }

  return (
    <div className="w-full">
      <PendingCodesList organizationId={organizationId} />
    </div>
  );
}



