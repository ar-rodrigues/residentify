"use client";

import { useState } from "react";
import { Tabs } from "antd";
import MembersListResponsive from "../widgets/MembersListResponsive";
import InvitationsListResponsive from "../widgets/InvitationsListResponsive";
import AddMemberFAB from "../widgets/AddMemberFAB";

export default function AdminView({ organizationId }) {
  const [activeTab, setActiveTab] = useState("members");

  return (
    <div className="w-full">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "members",
            label: "Miembros",
            children: <MembersListResponsive organizationId={organizationId} />,
          },
          {
            key: "invitations",
            label: "Invitaciones",
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
