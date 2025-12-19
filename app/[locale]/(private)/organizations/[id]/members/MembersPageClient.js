"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import MembersListResponsive from "../_components/widgets/residential/MembersListResponsive";
import AddMemberFAB from "../_components/widgets/residential/AddMemberFAB";
import { Spin } from "antd";

export default function MembersPageClient({ organizationId }) {
  const router = useRouter();
  const { organization, loading } = useCurrentOrganization();
  const { isAdmin } = useOrganizationAuth();

  // Client-side check for immediate UX feedback
  useEffect(() => {
    if (!loading && organization) {
      if (!isAdmin) {
        router.push(`/organizations/${organizationId}`);
      }
    }
  }, [loading, organization, isAdmin, organizationId, router]);

  // Show loading state while checking
  if (loading || !organization) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  // If not admin, redirect (this will be handled by useEffect, but show nothing while redirecting)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="w-full">
      <MembersListResponsive organizationId={organizationId} />
      <AddMemberFAB organizationId={organizationId} />
    </div>
  );
}





