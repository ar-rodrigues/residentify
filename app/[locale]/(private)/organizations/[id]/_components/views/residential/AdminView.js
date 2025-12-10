"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs } from "antd";
import MembersListResponsive from "../../widgets/residential/MembersListResponsive";
import InvitationsListResponsive from "../../widgets/residential/InvitationsListResponsive";
import AddMemberFAB from "../../widgets/residential/AddMemberFAB";

export default function AdminView({ organizationId }) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("members");

  return (
    <div className="w-full">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "members",
            label: t("admin.view.tabs.members"),
            children: <MembersListResponsive organizationId={organizationId} />,
          },
          {
            key: "invitations",
            label: t("admin.view.tabs.invitations"),
            children: (
              <InvitationsListResponsive organizationId={organizationId} />
            ),
          },
        ]}
      />
      <AddMemberFAB
        organizationId={organizationId}
        onSwitchToInvitations={() => setActiveTab("invitations")}
      />
    </div>
  );
}
