import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationById } from "@/utils/api/organizations";
import { Card, Space, Alert } from "antd";
import Button from "@/components/ui/Button";
import OrganizationHeader from "./_components/widgets/OrganizationHeader";
import OrganizationIdStorage from "./_components/widgets/OrganizationIdStorage";
import AdminView from "./_components/views/AdminView";
import ResidentView from "./_components/views/ResidentView";
import SecurityView from "./_components/views/SecurityView";

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

  try {
    const result = await getOrganizationById(id);

    if (result.error) {
      errorMessage = result.message || "Error al obtener la organización.";

      // If unauthorized, mark for redirect (redirect() throws an error, so we handle it outside try-catch)
      if (result.status === 401) {
        shouldRedirect = true;
      }
    } else {
      organization = result.data;
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

  // Render role-specific view
  const renderRoleView = () => {
    if (!organization.userRole) {
      return (
        <Card title="Información">
          <p className="text-gray-500">
            No tienes un rol asignado en esta organización.
          </p>
        </Card>
      );
    }

    switch (organization.userRole) {
      case "admin":
        return <AdminView organizationId={id} />;
      case "resident":
        return <ResidentView organizationId={id} />;
      case "security":
        return <SecurityView organizationId={id} />;
      default:
        return (
          <Card title="Información">
            <p className="text-gray-500">
              Rol no reconocido: {organization.userRole}
            </p>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <OrganizationIdStorage organizationId={id} />
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <OrganizationHeader organization={organization} organizationId={id} />
          {renderRoleView()}
        </Space>
      </div>
    </div>
  );
}
