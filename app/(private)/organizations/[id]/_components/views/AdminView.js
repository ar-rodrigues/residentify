"use client";

import MembersList from "../widgets/MembersList";
import InvitationsList from "../widgets/InvitationsList";

export default function AdminView({ organizationId }) {
  return (
    <>
      <MembersList organizationId={organizationId} />
      <InvitationsList organizationId={organizationId} />
    </>
  );
}



