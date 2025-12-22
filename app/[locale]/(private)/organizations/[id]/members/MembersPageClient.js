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
  const { isAdmin } = useOrganizationAuth();
  const [activeTab, setActiveTab] = useState("members");

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
      children: <InvitationsListResponsive organizationId={organizationId} />,
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
        onSwitchToInvitations={() => setActiveTab("invitations")}
      />
    </div>
  );
}
