import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";
import OrganizationNotFound from "./_components/OrganizationNotFound";
import { getDefaultRoute } from "@/utils/menu/organizationMenu";

export default async function OrganizationDetailPage({ params }) {
  const supabase = await createClient();
  const { id, locale } = await params;
  const t = await getTranslations({ locale });

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
    return <OrganizationNotFound />;
  }

  // Fetch organization data using the API utility function
  let organization;
  let errorMessage = null;
  let shouldRedirect = false;
  let shouldRedirectToOrganizations = false;

  try {
    const result = await getOrganizationById(id);

    if (result.error) {
      errorMessage = result.message;

      // If unauthorized, mark for redirect (redirect() throws an error, so we handle it outside try-catch)
      if (result.status === 401) {
        shouldRedirect = true;
      }

      // If user has pending approval, redirect to organizations page
      if (result.status === 404) {
        // Check if user has pending approval for this organization
        const { data: pendingInvitation } = await supabase
          .from("organization_invitations")
          .select("id")
          .eq("organization_id", id)
          .eq("email", user.email.toLowerCase())
          .eq("status", "pending_approval")
          .single();

        if (pendingInvitation) {
          shouldRedirectToOrganizations = true;
        }
      }
    } else {
      organization = result.data;

      // If user has pending approval, redirect to organizations page
      if (organization.isPendingApproval) {
        shouldRedirectToOrganizations = true;
      }
    }
  } catch (error) {
    // Re-throw redirect errors (Next.js redirect() throws a special error)
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("Error fetching organization:", error);
    errorMessage = null; // Will use default from OrganizationNotFound
  }

  // Handle redirect outside try-catch to avoid catching redirect error
  if (shouldRedirect) {
    redirect("/login");
  }

  if (shouldRedirectToOrganizations) {
    redirect("/organizations");
  }

  // Error state
  if (errorMessage || !organization) {
    return <OrganizationNotFound message={errorMessage} />;
  }

  // Redirect to default route based on permissions
  const defaultRoute = getDefaultRoute(
    id, // organizationId
    organization.permissions || [], // permissions array
    locale
  );

  if (defaultRoute) {
    redirect(defaultRoute);
  }

  // Fallback: if no default route but user is a member, redirect to chat
  // Chat should be accessible to all roles (admin, resident, security)
  // This handles cases where seat types don't have permissions assigned in seat_type_permissions
  // If chat is also not accessible, the chat page will handle the redirect appropriately
  if (organization.userRole) {
    // Chat is the most universal route - should be accessible to all roles
    // If user doesn't have chat:read permission, the chat page will handle it
    redirect(`/${locale}/organizations/${id}/chat`);
  }

  // Final fallback: if no default route and no role-based route, show not found
  return (
    <OrganizationNotFound
      message={t("organizations.typeRouter.errors.cannotDetermineDefaultRoute")}
    />
  );
}
