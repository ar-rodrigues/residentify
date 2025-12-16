"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RiBuildingLine } from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationTypes } from "@/hooks/useOrganizationTypes";
import { Form, Card, Typography, Space, Alert, Select, Spin } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function CreateOrganizationPage() {
  const t = useTranslations();
  const tOrgs = useTranslations("organizations");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const router = useRouter();
  const { createOrganization, loading } = useOrganizations();
  const { types, loading: typesLoading } = useOrganizationTypes();

  // Helper function to safely get translations with fallback
  // Uses namespace-scoped translator to avoid missing message warnings
  const safeTranslate = useCallback(
    (key, fallback) => {
      try {
        // Use namespace-scoped translator: organizations.types.residential.name -> types.residential.name
        // Remove 'organizations.' prefix since we're using useTranslations('organizations')
        const scopedKey = key.replace(/^organizations\./, "");
        const translation = tOrgs(scopedKey);
        // If translation returns the key itself, it means translation doesn't exist
        return translation !== scopedKey ? translation : fallback;
      } catch (e) {
        // If translation key doesn't exist (next-intl throws in dev mode), return fallback
        return fallback;
      }
    },
    [tOrgs]
  );

  const handleCreate = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await createOrganization(
        values.name,
        values.organization_type_id
      );

      if (result.error) {
        setErrorMessage(result.message);
        setIsSubmitting(false);
      } else {
        setSuccessMessage(result.message);
        // Disable form after success
        createForm.setFieldsValue({
          name: values.name,
          organization_type_id: values.organization_type_id,
        });
        // Redirect to organization detail page or dashboard after 2 seconds
        setTimeout(() => {
          router.push(`/organizations/${result.data.id}`);
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(
        error.message || "Error inesperado al crear la organización."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <Space orientation="vertical" size="large" className="w-full">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <RiBuildingLine className="text-4xl text-blue-600" />
              </div>
              <Title level={2} className="mb-2">
                {t("organizations.create.title")}
              </Title>
              <Paragraph className="text-gray-600">
                {t("organizations.create.subtitle")}
              </Paragraph>
            </div>

            {errorMessage && (
              <Alert
                title={t("common.error")}
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
              />
            )}

            {successMessage && (
              <Alert
                title={t("common.success")}
                description={successMessage}
                type="success"
                showIcon
              />
            )}

            <Form
              form={createForm}
              onFinish={handleCreate}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="name"
                rules={[
                  {
                    required: true,
                    message: t("organizations.create.errors.nameRequired"),
                  },
                  {
                    min: 2,
                    message: t("organizations.create.errors.nameMinLength"),
                  },
                  {
                    max: 100,
                    message: t("organizations.create.errors.nameMaxLength"),
                  },
                  {
                    whitespace: true,
                    message: t("organizations.create.errors.nameWhitespace"),
                  },
                ]}
              >
                <Input
                  prefixIcon={<RiBuildingLine />}
                  placeholder={t("organizations.create.name")}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="organization_type_id"
                label={t("organizations.create.type")}
                rules={[
                  {
                    required: true,
                    message: t("organizations.create.errors.typeRequired"),
                  },
                ]}
              >
                <Select
                  placeholder={t("organizations.create.typePlaceholder")}
                  size="large"
                  loading={typesLoading}
                  notFoundContent={
                    typesLoading ? (
                      <Spin size="small" />
                    ) : (
                      t("organizations.create.errors.noTypesAvailable")
                    )
                  }
                  options={useMemo(() => {
                    return types.map((type) => {
                      // Normalize type name to lowercase to match translation keys
                      const normalizedTypeName = type.name.toLowerCase();
                      const nameKey = `organizations.types.${normalizedTypeName}.name`;
                      const descriptionKey = `organizations.types.${normalizedTypeName}.description`;

                      // Get translations, fallback to database values if translation doesn't exist
                      const displayName = safeTranslate(nameKey, type.name);
                      const displayDescription = safeTranslate(
                        descriptionKey,
                        type.description || ""
                      );

                      return {
                        value: type.id,
                        label: (
                          <div>
                            <div className="font-medium">{displayName}</div>
                            {displayDescription && (
                              <div className="text-xs text-gray-500">
                                {displayDescription}
                              </div>
                            )}
                          </div>
                        ),
                      };
                    });
                  }, [types, safeTranslate])}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading || isSubmitting}
                  disabled={isSubmitting || !!successMessage}
                  className="w-full"
                  size="large"
                >
                  {t("organizations.create.button")}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}
