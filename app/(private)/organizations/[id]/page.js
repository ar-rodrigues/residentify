import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";
import { Card, Space, Alert } from "antd";
import Button from "@/components/ui/Button";
import OrganizationHeader from "./_components/widgets/shared/OrganizationHeader";
import OrganizationIdStorage from "./_components/widgets/shared/OrganizationIdStorage";
import TypeRouter from "./_components/type-router";

export default async function OrganizationDetailPage({ params }) {
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

  // Validate organization ID
  if (!id || typeof id !== "string") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space direction="vertical" size="large" className="w-full">
              <Alert
                message="Error"
                description="ID de organización inválido."
                type="error"
                showIcon
              />
              <Link href="/organizations" className="block w-full">
                <Button type="primary" className="w-full">
                  Volver a Organizaciones
                </Button>
              </Link>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch organization data using the API utility function
  let organization;
  let errorMessage = null;
  let shouldRedirect = false;
  let shouldRedirectToOrganizations = false;

  try {
    const result = await getOrganizationById(id);

    if (result.error) {
      errorMessage = result.message || "Error al obtener la organización.";

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
    errorMessage = "Error inesperado al cargar la organización.";
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space direction="vertical" size="large" className="w-full">
              <Alert
                message="Error"
                description={
                  errorMessage || "No se pudo cargar la organización."
                }
                type="error"
                showIcon
              />
              <Link href="/organizations" className="block w-full">
                <Button type="primary" className="w-full">
                  Volver a Organizaciones
                </Button>
              </Link>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <OrganizationIdStorage organizationId={id} />
      <div className="w-full">
        <OrganizationHeader organization={organization} organizationId={id} />
        <div className="w-full">
          <TypeRouter
            organizationType={organization.organization_type}
            userRole={organization.userRole}
            organizationId={id}
          />
        </div>
      </div>
    </div>
  );
}
