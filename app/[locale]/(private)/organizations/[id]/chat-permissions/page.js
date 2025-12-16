import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";
import ChatPermissionsPageClient from "./ChatPermissionsPageClient";

export default async function ChatPermissionsPage({ params }) {
  const supabase = await createClient();
  const { id } = await params;

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Validate organization ID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || typeof id !== "string" || !uuidRegex.test(id)) {
    redirect("/organizations");
  }

  // Server-side verification (security check)
  // Client-side will use context for fast UX, but server verifies for security
  const result = await getOrganizationById(id);

  if (result.error || !result.data) {
    redirect("/organizations");
  }

  const organization = result.data;

  // Server-side authorization check (defense in depth)
  if (organization.userRole !== "admin") {
    redirect(`/organizations/${id}`);
  }

  // Render client component that uses context for fast client-side checks
  return <ChatPermissionsPageClient organizationId={id} />;
}
