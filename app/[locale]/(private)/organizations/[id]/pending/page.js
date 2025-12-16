import { requireRouteAccess } from "@/utils/auth/organization";
import PendingPageClient from "./PendingPageClient";

export default async function PendingPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/pending");

  // Render client component that uses context for fast client-side checks
  return <PendingPageClient organizationId={id} />;
}
