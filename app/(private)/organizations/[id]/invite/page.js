"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiUserAddLine,
  RiMailLine,
  RiUserLine,
  RiFileTextLine,
} from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { useOrganizations } from "@/hooks/useOrganizations";
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
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inviteForm] = Form.useForm();
  const [organizationRoles, setOrganizationRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const { createInvitation, loading } = useInvitations();
  const { getOrganization, data: organization } = useOrganizations();

  useEffect(() => {
    if (id) {
      getOrganization(id).then((result) => {
        if (result.error) {
          setErrorMessage(result.message);
        } else if (!result.data?.isAdmin) {
          setErrorMessage(
            "No tienes permisos para invitar usuarios. Solo los administradores pueden invitar usuarios."
          );
        }
      });
    }
  }, [id, getOrganization]);

  useEffect(() => {
    // Fetch organization roles
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await fetch("/api/organization-roles");
        const result = await response.json();

        if (result.error) {
          setErrorMessage("Error al cargar los roles de organización.");
          return;
        }

        setOrganizationRoles(result.data || []);
      } catch (error) {
        console.error("Error fetching organization roles:", error);
        setErrorMessage("Error al cargar los roles de organización.");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleInvite = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await createInvitation(id, {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      organization_role_id: values.organization_role_id,
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

  // Map role names to Spanish for display
  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      admin: "Administrador",
      resident: "Residente",
      security: "Personal de Seguridad",
    };
    return roleMap[roleName] || roleName;
  };

  if (organization && !organization.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4 pb-20 sm:pb-12">
        <div className="max-w-md w-full">
          <Card styles={{ body: { padding: "20px 16px" } }}>
            <Alert
              message="Acceso Denegado"
              description="No tienes permisos para invitar usuarios. Solo los administradores pueden invitar usuarios."
              type="error"
              showIcon
            />
            <Button
              type="primary"
              onClick={() => router.push(`/organizations/${id}`)}
              className="w-full mt-4"
              size="large"
            >
              Volver a la Organización
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" styles={{ body: { padding: "20px 16px" } }}>
          <Space orientation="vertical" size="middle" className="w-full">
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
              </div>
              <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                Invitar Usuario
              </Title>
              <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                Invita a un nuevo usuario a unirse a la organización
              </Paragraph>
            </div>

            {errorMessage && (
              <Alert
                title="Error"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
              />
            )}

            {successMessage ? (
              <div className="text-center py-8">
                <Alert
                  title="Éxito"
                  description={successMessage}
                  type="success"
                  showIcon
                  className="mb-4"
                />
                <Paragraph type="secondary" className="text-sm">
                  Redirigiendo...
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
                  label={<span className="text-sm sm:text-base">Nombre</span>}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa el nombre",
                    },
                    {
                      min: 2,
                      message: "El nombre debe tener al menos 2 caracteres",
                    },
                    {
                      max: 100,
                      message: "El nombre no puede tener más de 100 caracteres",
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder="Nombre"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="last_name"
                  label={<span className="text-sm sm:text-base">Apellido</span>}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa el apellido",
                    },
                    {
                      min: 2,
                      message: "El apellido debe tener al menos 2 caracteres",
                    },
                    {
                      max: 100,
                      message:
                        "El apellido no puede tener más de 100 caracteres",
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder="Apellido"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={<span className="text-sm sm:text-base">Email</span>}
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa el email",
                    },
                    {
                      type: "email",
                      message: "El email no es válido",
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiMailLine className="text-base" />}
                    placeholder="email@ejemplo.com"
                    type="email"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="organization_role_id"
                  label={
                    <span className="text-sm sm:text-base">
                      Rol en la Organización
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Por favor selecciona un rol",
                    },
                  ]}
                  className="!mb-4"
                >
                  <Select
                    placeholder="Selecciona un rol"
                    size="large"
                    loading={loadingRoles}
                    className="w-full"
                    options={organizationRoles.map((role) => ({
                      value: role.id,
                      label: getRoleDisplayName(role.name),
                      description: role.description,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={
                    <span className="text-sm sm:text-base">
                      Descripción (Opcional)
                    </span>
                  }
                  rules={[
                    {
                      max: 500,
                      message:
                        "La descripción no puede tener más de 500 caracteres",
                    },
                  ]}
                  className="!mb-4"
                >
                  <TextArea
                    rows={3}
                    placeholder="Descripción del usuario (opcional)"
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
                      Enviar Invitación
                    </Button>
                    <Button
                      onClick={() => router.push(`/organizations/${id}`)}
                      className="w-full"
                      size="large"
                    >
                      Cancelar
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
