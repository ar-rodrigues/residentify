"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiUserAddLine,
  RiMailLine,
  RiUserLine,
  RiLockLine,
} from "react-icons/ri";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { Form, Card, Typography, Space, Alert } from "antd";
import dayjs from "dayjs";
import { localDateToUTC } from "@/utils/date";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

const { Title, Paragraph, Text } = Typography;

export default function GeneralInviteLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = params;
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [link, setLink] = useState(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [form] = Form.useForm();
  const { getGeneralInviteLinkByToken, acceptGeneralInviteLink, loading } =
    useGeneralInviteLinks();

  const loadLink = useCallback(async () => {
    try {
      setLoadingLink(true);
      setErrorMessage(null);
      const result = await getGeneralInviteLinkByToken(token);

      if (result.error) {
        setErrorMessage(result.message);
        setLoadingLink(false);
        return;
      }

      setLink(result.data);
      setLoadingLink(false);
    } catch (error) {
      console.error("Error loading general invite link:", error);
      setErrorMessage("Error al cargar el enlace de invitación.");
      setLoadingLink(false);
    }
  }, [token, getGeneralInviteLinkByToken]);

  useEffect(() => {
    if (token) {
      loadLink();
    }
  }, [token, loadLink]);

  const handleAccept = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Convert local date to UTC for storage
    const date_of_birth = values.date_of_birth
      ? localDateToUTC(values.date_of_birth)
      : null;

    const result = await acceptGeneralInviteLink(token, {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      password: values.password,
      date_of_birth: date_of_birth,
    });

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Always redirect to organizations page
      // If user has pending approval, they'll see the organization card there
      // If approved, they'll see it in the list
      setTimeout(() => {
        router.push("/organizations");
      }, 2000);
    }
  };

  if (loadingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <Card className="max-w-md w-full">
          <div className="flex justify-center py-8">
            <Space direction="vertical" align="center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <Text type="secondary">Cargando enlace de invitación...</Text>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Alert
              message="Error"
              description={errorMessage}
              type="error"
              showIcon
            />
            <Button
              type="primary"
              onClick={() => router.push("/")}
              className="w-full mt-4"
              size="large"
            >
              Volver al Inicio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!link) {
    return null;
  }

  if (link.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Alert
              message="Enlace Expirado"
              description="Este enlace de invitación ha expirado. Por favor, contacta al administrador para obtener un nuevo enlace."
              type="error"
              showIcon
            />
            <Button
              type="primary"
              onClick={() => router.push("/")}
              className="w-full mt-4"
              size="large"
            >
              Volver al Inicio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Alert
              message="Éxito"
              description={successMessage}
              type="success"
              showIcon
              className="mb-4"
            />
            <Paragraph type="secondary" className="text-center">
              Redirigiendo a la organización...
            </Paragraph>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" styles={{ body: { padding: "20px 16px" } }}>
          <Space direction="vertical" size="middle" className="w-full">
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
              </div>
              <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                Unirse a {link.organization_name}
              </Title>
              <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                Has sido invitado a unirte a esta organización
              </Paragraph>
            </div>

            {errorMessage && (
              <Alert
                message="Error"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
              />
            )}

            <Form
              form={form}
              onFinish={handleAccept}
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
                    message: "El apellido no puede tener más de 100 caracteres",
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
                name="password"
                label={<span className="text-sm sm:text-base">Contraseña</span>}
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa la contraseña",
                  },
                  {
                    min: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                ]}
                className="!mb-4"
              >
                <Password
                  prefixIcon={<RiLockLine className="text-base" />}
                  placeholder="Contraseña"
                  size="large"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="date_of_birth"
                label={
                  <span className="text-sm sm:text-base">
                    Fecha de Nacimiento
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu fecha de nacimiento",
                  },
                ]}
                className="!mb-4"
              >
                <DatePicker
                  placeholder="DD/MM/YYYY"
                  format="DD/MM/YYYY"
                  disabledFutureDates={true}
                  size="large"
                />
              </Form.Item>

              {link.requires_approval && (
                <Alert
                  message="Aprobación Requerida"
                  description="Tu solicitud será revisada por un administrador. Te notificaremos cuando sea aprobada."
                  type="info"
                  showIcon
                  className="mb-4"
                  size="small"
                />
              )}

              <Form.Item className="!mb-0">
                <Space
                  className="w-full mt-4"
                  direction="vertical"
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
                    Crear Cuenta y Unirse
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    className="w-full"
                    size="large"
                  >
                    Cancelar
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
