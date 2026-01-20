"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import AccessHistoryList from "../_components/widgets/residential/AccessHistoryList";
import { Spin } from "antd";

export default function HistoryPageClient({ organizationId }) {
  const router = useRouter();
  const { organization, loading } = useCurrentOrganization();
  const { hasPermission } = useOrganizationAuth();

  // Client-side check for immediate UX feedback
  // Check for qr:view_history permission instead of role-based check
  useEffect(() => {
    if (!loading && organization) {
      if (!hasPermission("qr:view_history")) {
        router.push(`/organizations/${organizationId}`);
      }
    }
  }, [loading, organization, hasPermission, organizationId, router]);

  // Show loading state while checking
  if (loading || !organization) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  // If user doesn't have permission, redirect (this will be handled by useEffect, but show nothing while redirecting)
  if (!hasPermission("qr:view_history")) {
    return null;
  }

  return (
    <div className="w-full">
      <AccessHistoryList organizationId={organizationId} />
    </div>
  );
}















