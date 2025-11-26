import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Card, Typography, Space, Alert } from "antd";
import Button from "@/components/ui/Button";
import OrganizationHeader from "./_components/widgets/OrganizationHeader";
import OrganizationIdStorage from "./_components/widgets/OrganizationIdStorage";
import AdminView from "./_components/views/AdminView";
import ResidentView from "./_components/views/ResidentView";
import SecurityView from "./_components/views/SecurityView";

const { Paragraph } = Typography;

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

  // Fetch organization data directly from Supabase (server component)
  let organization;
  let errorMessage = null;

  try {
    // Get organization (RLS will check if user is a member)
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, created_by, created_at, updated_at")
      .eq("id", id)
      .single();

    if (orgError || !orgData) {
      if (orgError?.code === "PGRST116") {
        errorMessage = "Organización no encontrada o no tienes acceso a ella.";
      } else {
        errorMessage = "Error al obtener la organización.";
      }
    } else {
      // Get user's membership and role
      const { data: userMember } = await supabase
        .from("organization_members")
        .select(
          `
          id,
          user_id,
          organization_role_id,
          organization_roles(
            id,
            name,
            description
          )
        `
        )
        .eq("organization_id", id)
        .eq("user_id", user.id)
        .single();

      // Normalize role name: security_personnel -> security
      let userRole = userMember?.organization_roles?.name || null;
      if (userRole === "security_personnel") {
        userRole = "security";
      }

      const isAdmin = userRole === "admin" || false;

      // Get creator's name
      const { data: creatorName } = await supabase.rpc("get_user_name", {
        p_user_id: orgData.created_by,
      });

      organization = {
        id: orgData.id,
        name: orgData.name,
        created_by: orgData.created_by,
        created_by_name: creatorName,
        created_at: orgData.created_at,
        updated_at: orgData.updated_at,
        userRole,
        isAdmin,
      };
    }
  } catch (error) {
    console.error("Error fetching organization:", error);
    errorMessage = "Error inesperado al cargar la organización.";
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
          <Paragraph type="secondary">
            No tienes un rol asignado en esta organización.
          </Paragraph>
        </Card>
      );
    }

    switch (organization.userRole) {
      case "admin":
        return <AdminView organizationId={id} />;
      case "resident":
        return <ResidentView />;
      case "security":
        return <SecurityView />;
      default:
        return (
          <Card title="Información">
            <Paragraph type="secondary">
              Rol no reconocido: {organization.userRole}
            </Paragraph>
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
