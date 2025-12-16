import { requireRouteAccess } from "@/utils/auth/organization";
import ValidatePageClient from "./ValidatePageClient";

export default async function ValidatePage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/validate");

  // Render client component
  return <ValidatePageClient organizationId={id} />;
}
