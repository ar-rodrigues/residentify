"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RiBuildingLine, RiArrowLeftLine } from "react-icons/ri";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import { Form, Card, Typography, Space, Alert, Spin } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

export default function EditOrganizationPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const {
    getOrganization,
    updateOrganization,
    loading,
    data: fetchedOrg,
  } = useOrganizations();
  const { organization: contextOrg, loading: contextLoading } =
    useCurrentOrganization();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editForm] = Form.useForm();

  // Security: Ensure we use the organization matching the URL parameter
  // The context organization may be a different organization (main org)
  const organization = contextOrg?.id === id ? contextOrg : fetchedOrg;
  const isAdmin = organization?.isAdmin || false;

  // Fetch organization explicitly if context org doesn't match URL
  useEffect(() => {
    if (!id) {
      setFetching(false);
      return;
    }

    // If context org matches URL, wait for context to finish loading
    if (contextOrg?.id === id) {
      setFetching(contextLoading);
      return;
    }

    // If context is still loading, wait for it to finish before deciding to fetch
    if (contextLoading) {
      return;
    }

    // Context org doesn't match URL (or doesn't exist), fetch the correct organization
    const fetchOrg = async () => {
      setFetching(true);
      const result = await getOrganization(id);
      if (result.error) {
        setErrorMessage(result.message);
      }
      setFetching(false);
    };

    fetchOrg();
  }, [id, contextOrg?.id, contextLoading, getOrganization]);

  // Set form initial values when organization is loaded
  useEffect(() => {
    // Only set form values if organization matches URL and user is admin
    if (
      organization &&
      organization.id === id &&
      isAdmin &&
      organization.name
    ) {
      editForm.setFieldsValue({
        name: organization.name,
      });
    }
  }, [organization, id, isAdmin, editForm]);

  const handleUpdate = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await updateOrganization(id, values.name);

      if (result.error) {
        setErrorMessage(result.message);
        setIsSubmitting(false);
      } else {
        setSuccessMessage(result.message);
        // Disable form after success
        editForm.setFieldsValue({
          name: values.name,
        });
        // Dispatch event to update organization in context
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("organization:updated", {
              detail: { organizationId: id },
            })
          );
        }
        // Redirect to organization detail page after 2 seconds
        setTimeout(() => {
          router.push(`/organizations/${id}`);
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(
        error.message || "Error inesperado al actualizar la organización."
      );
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/organizations/${id}`);
  };

  // Show loading if fetching organization or if context is loading and org matches
  const isLoading =
    fetching || (contextLoading && contextOrg?.id === id) || loading;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph>{t("organizations.edit.loading")}</Paragraph>
        </Space>
      </div>
    );
  }

  if (!organization || organization.id !== id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("common.error")}
                description={
                  errorMessage || t("organizations.edit.errors.loadError")
                }
                type="error"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => router.push("/organizations")}
                className="w-full"
              >
                {t("organizations.edit.backToOrganizations")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Security check: Verify admin status for the organization matching the URL parameter
  // At this point, we know organization.id === id (checked above)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("organizations.edit.errors.accessDeniedTitle")}
                description={t("organizations.edit.errors.accessDenied")}
                type="error"
                showIcon
              />
              <Button
                type="primary"
                onClick={() => router.push(`/organizations/${id}`)}
                className="w-full"
              >
                {t("organizations.edit.backToOrganization")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

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
                {t("organizations.edit.title")}
              </Title>
              <Paragraph className="text-gray-600">
                {t("organizations.edit.subtitle")}
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
              form={editForm}
              onFinish={handleUpdate}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="name"
                rules={[
                  {
                    required: true,
                    message: t("organizations.edit.errors.nameRequired"),
                  },
                  {
                    min: 2,
                    message: t("organizations.edit.errors.nameMinLength"),
                  },
                  {
                    max: 100,
                    message: t("organizations.edit.errors.nameMaxLength"),
                  },
                  {
                    whitespace: true,
                    message: t("organizations.edit.errors.nameWhitespace"),
                  },
                ]}
              >
                <Input
                  prefixIcon={<RiBuildingLine />}
                  placeholder={t("organizations.edit.namePlaceholder")}
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Space className="w-full" orientation="vertical" size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || isSubmitting}
                    disabled={isSubmitting || !!successMessage}
                    className="w-full"
                    size="large"
                  >
                    {t("organizations.edit.saveButton")}
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={handleCancel}
                    disabled={isSubmitting || !!successMessage}
                    className="w-full"
                    size="large"
                    icon={<RiArrowLeftLine />}
                  >
                    {t("organizations.edit.cancelButton")}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}
