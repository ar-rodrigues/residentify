"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  RiUserAddLine,
  RiMailLine,
  RiUserLine,
  RiFileTextLine,
} from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSeatTypes } from "@/hooks/useSeatTypes";
import {
  Form,
  Card,
  Typography,
  Space,
  Alert,
  Select,
  Input as AntInput,
} from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;
const { TextArea } = AntInput;

export default function InviteUserPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inviteForm] = Form.useForm();
  const { createInvitation, loading } = useInvitations();
  const { getOrganization, data: organization } = useOrganizations();
  const { data: seatTypes, loading: loadingSeatTypes } = useSeatTypes(organization?.organization_type_id);

  useEffect(() => {
    if (id) {
      getOrganization(id).then((result) => {
        if (result.error) {
          setErrorMessage(result.message);
        } else if (!result.data?.isAdmin) {
          setErrorMessage(
            t("organizations.invite.errors.accessDenied") ||
              "No tienes permisos para invitar usuarios. Solo los administradores pueden invitar usuarios."
          );
        }
      });
    }
  }, [id, getOrganization, t]);

  const handleInvite = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await createInvitation(id, {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      seat_type_id: values.seat_type_id,
      description: values.description || null,
    });

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Reset form
      inviteForm.resetFields();
      // Redirect to organization detail page after 2 seconds
      setTimeout(() => {
        router.push(`/organizations/${id}`);
      }, 2000);
    }
  };

  // Map role names to translated display names
  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      admin: t("organizations.invite.roles.admin") || "Administrador",
      resident: t("organizations.invite.roles.resident") || "Residente",
      security:
        t("organizations.invite.roles.security") || "Personal de Seguridad",
    };
    return roleMap[roleName] || roleName;
  };

  if (organization && !organization.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full py-4 sm:py-12 px-4 pb-20 sm:pb-12">
        <div className="max-w-md w-full">
          <Card styles={{ body: { padding: "20px 16px" } }}>
            <Alert
              title={
                t("organizations.invite.errors.accessDeniedTitle") ||
                "Acceso Denegado"
              }
              description={
                t("organizations.invite.errors.accessDenied") ||
                "No tienes permisos para invitar usuarios. Solo los administradores pueden invitar usuarios."
              }
              type="error"
              showIcon
            />
            <Button
              type="primary"
              onClick={() => router.push(`/organizations/${id}`)}
              className="w-full mt-4"
              size="large"
            >
              {t("common.back")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" styles={{ body: { padding: "20px 16px" } }}>
          <Space orientation="vertical" size="middle" className="w-full">
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
              </div>
              <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                {t("organizations.invite.title")}
              </Title>
              <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                {t("organizations.invite.subtitle")}
              </Paragraph>
            </div>

            {errorMessage && (
              <Alert
                title={t("common.error")}
                description={errorMessage}
                type="error"
                showIcon
                closable
                afterClose={() => setErrorMessage(null)}
              />
            )}

            {successMessage ? (
              <div className="text-center py-8">
                <Alert
                  title={t("common.success")}
                  description={successMessage}
                  type="success"
                  showIcon
                  className="mb-4"
                />
                <Paragraph type="secondary" className="text-sm">
                  {t("common.redirecting") || "Redirigiendo..."}
                </Paragraph>
              </div>
            ) : (
              <Form
                form={inviteForm}
                onFinish={handleInvite}
                layout="vertical"
                requiredMark={false}
                className="w-full"
              >
                <Form.Item
                  name="first_name"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("organizations.invite.firstName")}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: t(
                        "organizations.invite.errors.firstNameRequired"
                      ),
                    },
                    {
                      min: 2,
                      message: t(
                        "organizations.invite.errors.firstNameMinLength"
                      ),
                    },
                    {
                      max: 100,
                      message: t(
                        "organizations.invite.errors.firstNameMaxLength"
                      ),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder={t("organizations.invite.firstName")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="last_name"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("organizations.invite.lastName")}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: t(
                        "organizations.invite.errors.lastNameRequired"
                      ),
                    },
                    {
                      min: 2,
                      message: t(
                        "organizations.invite.errors.lastNameMinLength"
                      ),
                    },
                    {
                      max: 100,
                      message: t(
                        "organizations.invite.errors.lastNameMaxLength"
                      ),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder={t("organizations.invite.lastName")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("organizations.invite.email")}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: t("organizations.invite.errors.emailRequired"),
                    },
                    {
                      type: "email",
                      message: t("organizations.invite.errors.emailInvalid"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiMailLine className="text-base" />}
                    placeholder={t("organizations.invite.emailPlaceholder")}
                    type="email"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="seat_type_id"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("organizations.invite.role")}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: t("organizations.invite.errors.roleRequired"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Select
                    placeholder={t("organizations.invite.rolePlaceholder")}
                    size="large"
                    loading={loadingSeatTypes}
                    className="w-full"
                    options={seatTypes.map((type) => ({
                      value: type.id,
                      label: getRoleDisplayName(type.name),
                      description: type.description,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("organizations.invite.description") ||
                        "Descripción (Opcional)"}
                    </span>
                  }
                  rules={[
                    {
                      max: 500,
                      message:
                        t("organizations.invite.errors.descriptionMaxLength") ||
                        "La descripción no puede tener más de 500 caracteres",
                    },
                  ]}
                  className="!mb-4"
                >
                  <TextArea
                    rows={3}
                    placeholder={
                      t("organizations.invite.descriptionPlaceholder") ||
                      "Descripción del usuario (opcional)"
                    }
                    maxLength={500}
                    showCount
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item className="!mb-0">
                  <Space
                    className="w-full"
                    orientation="vertical"
                    size="middle"
                  >
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="w-full"
                      size="large"
                      icon={<RiUserAddLine />}
                    >
                      {t("organizations.invite.button")}
                    </Button>
                    <Button
                      onClick={() => router.push(`/organizations/${id}`)}
                      className="w-full"
                      size="large"
                    >
                      {t("common.cancel")}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
}
