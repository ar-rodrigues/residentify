import { requireRouteAccess } from "@/utils/auth/organization";
import MembersPageClient from "./MembersPageClient";

export default async function MembersPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/members");

  // Render client component that uses context for fast client-side checks
  return <MembersPageClient organizationId={id} />;
}
