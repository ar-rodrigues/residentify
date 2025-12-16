import { requireRouteAccess } from "@/utils/auth/organization";
import HistoryPageClient from "./HistoryPageClient";

export default async function HistoryPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/history");

  // Render client component that uses context for fast client-side checks
  return <HistoryPageClient organizationId={id} />;
}
