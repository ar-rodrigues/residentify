"use client";

import { useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createForm] = Form.useForm();
  const router = useRouter();
  const { createOrganization, loading } = useOrganizations();
  const { types, loading: typesLoading } = useOrganizationTypes();

  const handleCreate = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await createOrganization(
      values.name,
      values.organization_type_id
    );

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization detail page or dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/organizations/${result.data.id}`);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
                  options={types.map((type) => ({
                    value: type.id,
                    label: (
                      <div>
                        <div className="font-medium">{type.name}</div>
                        {type.description && (
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
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
