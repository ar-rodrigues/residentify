"use client";

import { Tabs } from "antd";
import MembersListResponsive from "../widgets/MembersListResponsive";
import InvitationsListResponsive from "../widgets/InvitationsListResponsive";
import AddMemberFAB from "../widgets/AddMemberFAB";

export default function AdminView({ organizationId }) {
  return (
    <div className="w-full">
      <Tabs
        defaultActiveKey="members"
        items={[
          {
            key: "members",
            label: "Miembros",
            children: (
              <MembersListResponsive organizationId={organizationId} />
            ),
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
      <AddMemberFAB organizationId={organizationId} />
    </div>
  );
}



