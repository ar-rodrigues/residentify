import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";
import MembersListResponsive from "../_components/widgets/residential/MembersListResponsive";
import AddMemberFAB from "../_components/widgets/residential/AddMemberFAB";

export default async function MembersPage({ params }) {
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

  // Fetch organization data
  const result = await getOrganizationById(id);

  if (result.error || !result.data) {
    redirect("/organizations");
  }

  const organization = result.data;

  // Check if user is admin
  if (organization.userRole !== "admin") {
    redirect(`/organizations/${id}`);
  }

  return (
    <div className="w-full">
      <MembersListResponsive organizationId={id} />
      <AddMemberFAB organizationId={id} />
    </div>
  );
}
