"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import MembersListResponsive from "../_components/widgets/residential/MembersListResponsive";
import InvitationsListResponsive from "../_components/widgets/residential/InvitationsListResponsive";
import AddMemberFAB from "../_components/widgets/residential/AddMemberFAB";
import { Spin, Tabs } from "antd";
import { RiUserLine, RiMailLine } from "react-icons/ri";

export default function MembersPageClient({ organizationId }) {
  const t = useTranslations();
  const router = useRouter();
  const { organization, loading } = useCurrentOrganization();
  const { hasPermission } = useOrganizationAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [redirecting, setRedirecting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user has members:manage permission (required for members page)
  const hasMembersManagePermission = hasPermission("members:manage");

  // Client-side check for immediate UX feedback
  useEffect(() => {
    // Only redirect if organization is fully loaded and user doesn't have permission
    // Don't redirect while loading to avoid loops
    if (!loading && organization && !hasMembersManagePermission && !redirecting) {
      setRedirecting(true);
      // Use replace instead of push to avoid adding to history (prevents back button loops)
      router.replace(`/organizations/${organizationId}`);
    }
  }, [loading, organization, hasMembersManagePermission, organizationId, router, redirecting]);

  // Show loading state while checking
  if (loading || !organization || redirecting) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  // If user doesn't have members:manage permission, show nothing (redirect is handled by useEffect)
  if (!hasMembersManagePermission) {
    return null;
  }

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const tabItems = [
    {
      key: "members",
      label: (
        <span className="flex items-center gap-2">
          <RiUserLine />
          {t("organizations.members.title")}
        </span>
      ),
      children: <MembersListResponsive organizationId={organizationId} />,
    },
    {
      key: "invitations",
      label: (
        <span className="flex items-center gap-2">
          <RiMailLine />
          {t("organizations.invitations.title")}
        </span>
      ),
      children: <InvitationsListResponsive organizationId={organizationId} refreshTrigger={refreshTrigger} />,
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        className="w-full"
        size="large"
      />
      <AddMemberFAB
        organizationId={organizationId}
        onSwitchToInvitations={(linkData) => {
          setActiveTab("invitations");
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
