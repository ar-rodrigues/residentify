import { requireRouteAccess } from "@/utils/auth/organization";
import ChatPermissionsPageClient from "./ChatPermissionsPageClient";

export default async function ChatPermissionsPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/chat-permissions");

  // Render client component that uses context for fast client-side checks
  return <ChatPermissionsPageClient organizationId={id} />;
}
