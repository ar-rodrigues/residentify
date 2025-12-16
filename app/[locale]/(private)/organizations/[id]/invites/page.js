import { requireRouteAccess } from "@/utils/auth/organization";
import InvitesPageClient from "./InvitesPageClient";

export default async function InvitesPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/invites");

  // Render client component
  return <InvitesPageClient organizationId={id} />;
}
