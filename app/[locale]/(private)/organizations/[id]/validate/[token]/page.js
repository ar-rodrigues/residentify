import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRouteAccess } from "@/utils/auth/organization";
import { Card, Typography, Space, Alert } from "antd";
import Link from "next/link";
import Button from "@/components/ui/Button";
import QRValidationPage from "./_components/QRValidationPage";

const { Paragraph } = Typography;

export default async function ValidateTokenPage({ params }) {
  const { id, token, locale } = await params;
  const t = await getTranslations({ locale });

  // Validate token
  if (!token || typeof token !== "string") {
    return (
      <div className="flex items-center justify-center h-full py-12 px-4">
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

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/validate");

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <QRValidationPage organizationId={id} token={token} />
      </div>
    </div>
  );
}




