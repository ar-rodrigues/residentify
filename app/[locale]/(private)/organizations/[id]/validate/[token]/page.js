import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { Card, Typography, Space, Alert } from "antd";
import Link from "next/link";
import Button from "@/components/ui/Button";
import QRValidationPage from "./_components/QRValidationPage";

const { Paragraph } = Typography;

export default async function ValidateTokenPage({ params }) {
  const supabase = await createClient();
  const { id, token, locale } = await params;
  const t = await getTranslations({ locale });

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
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("common.errorTitle")}
                description={t("qrCodes.validationPage.errors.invalidOrganizationId")}
                type="error"
                showIcon
              />
              <Link href={`/${locale}/organizations/${id}`} className="block w-full">
                <Button type="primary" className="w-full">
                  {t("qrCodes.validationPage.backToOrganization")}
                </Button>
              </Link>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Validate token
  if (!token || typeof token !== "string") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("common.errorTitle")}
                description={t("qrCodes.validationPage.errors.invalidToken")}
                type="error"
                showIcon
              />
              <Link href={`/${locale}/organizations/${id}`} className="block w-full">
                <Button type="primary" className="w-full">
                  {t("qrCodes.validationPage.backToOrganization")}
                </Button>
              </Link>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is security of the organization
  const { data: memberCheck, error: memberError } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      organization_roles!inner(
        name
      )
    `
    )
    .eq("organization_id", id)
    .eq("user_id", user.id)
    .eq("organization_roles.name", "security")
    .single();

  if (memberError || !memberCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("qrCodes.validationPage.errors.accessDeniedTitle")}
                description={t("qrCodes.validationPage.errors.accessDeniedDescription")}
                type="error"
                showIcon
              />
              <Link href={`/${locale}/organizations/${id}`} className="block w-full">
                <Button type="primary" className="w-full">
                  {t("qrCodes.validationPage.backToOrganization")}
                </Button>
              </Link>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <QRValidationPage organizationId={id} token={token} />
      </div>
    </div>
  );
}




