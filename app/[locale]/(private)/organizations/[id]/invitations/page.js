import { requireRouteAccess } from "@/utils/auth/organization";
import InvitationsPageClient from "./InvitationsPageClient";

export default async function InvitationsPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/invitations");

  // Render client component that uses context for fast client-side checks
  return <InvitationsPageClient organizationId={id} />;
}
