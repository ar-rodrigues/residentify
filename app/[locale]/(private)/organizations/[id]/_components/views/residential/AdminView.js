"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs } from "antd";
import MembersListResponsive from "../../widgets/residential/MembersListResponsive";
import InvitationsListResponsive from "../../widgets/residential/InvitationsListResponsive";
import ChatPermissionsSettings from "../../widgets/residential/ChatPermissionsSettings";
import ChatWidget from "@/components/organizations/ChatWidget";
import AddMemberFAB from "../../widgets/residential/AddMemberFAB";

export default function AdminView({ organizationId }) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("members");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
              <InvitationsListResponsive organizationId={organizationId} refreshTrigger={refreshTrigger} />
            ),
          },
          {
            key: "chatPermissions",
            label: t("admin.view.tabs.chatPermissions"),
            children: (
              <ChatPermissionsSettings organizationId={organizationId} />
            ),
          },
          {
            key: "chat",
            label: t("admin.view.tabs.chat"),
            children: (
              <div className="h-[600px]">
                <ChatWidget organizationId={organizationId} />
              </div>
            ),
          },
        ]}
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
