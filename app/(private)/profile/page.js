"use client";

import { useState, useTransition } from "react";
import {
  RiUserLine,
  RiLockLine,
  RiMailLine,
  RiCheckLine,
  RiKeyLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { changePassword, changeEmail } from "./actions";
import {
  Form,
  Tabs,
  Card,
  Typography,
  Space,
  Alert,
  Avatar,
  Descriptions,
  Spin,
} from "antd";
import { formatDateDDMMYYYY } from "@/utils/date";
import Password from "@/components/ui/Password";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function ProfilePage() {
  const { data: user, loading: userLoading } = useUser({
    redirectToLogin: true,
  });
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState(null);
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [isPending, startTransition] = useTransition();

  const handlePasswordChange = async (values) => {
    setLoading(true);
    setErrorMessage(null);
    setShowSuccess(false);

    const formDataObj = new FormData();
    formDataObj.append("currentPassword", values.currentPassword);
    formDataObj.append("newPassword", values.newPassword);
    formDataObj.append("confirmPassword", values.confirmPassword);

    startTransition(async () => {
      try {
        const result = await changePassword(formDataObj);

        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        } else {
          setShowSuccess(true);
          setLoading(false);
          passwordForm.resetFields();
          // Hide success message after 5 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 5000);
        }
      } catch (error) {
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Change password error:", error);
      }
    });
  };

  const handleEmailChange = async (values) => {
    setEmailLoading(true);
    setEmailErrorMessage(null);
    setShowEmailSuccess(false);

    const formDataObj = new FormData();
    formDataObj.append("currentPassword", values.currentPassword);
    formDataObj.append("newEmail", values.newEmail);
    formDataObj.append("confirmEmail", values.confirmEmail);

    startTransition(async () => {
      try {
        const result = await changeEmail(formDataObj);

        if (result && result.error) {
          setEmailErrorMessage(result.message);
          setEmailLoading(false);
        } else {
          setShowEmailSuccess(true);
          setEmailLoading(false);
          emailForm.resetFields();
          // Hide success message after 10 seconds (longer since user needs to check email)
          setTimeout(() => {
            setShowEmailSuccess(false);
          }, 10000);
        }
      } catch (error) {
        setEmailErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setEmailLoading(false);
        console.error("Change email error:", error);
      }
    });
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">Cargando perfil...</Paragraph>
        </Space>
      </div>
    );
  }

  // Format user ID to show only first and last 4 characters
  const formatUserId = (userId) => {
    if (!userId || userId.length < 9) return userId;
    return `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`;
  };

  const tabItems = [
    {
      key: "profile",
      label: "Información del Perfil",
      children: (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div className="text-center">
              <Avatar
                icon={<RiUserLine />}
                size={80}
                style={{
                  backgroundColor: "#2563eb",
                  marginBottom: "16px",
                }}
              />
              <Title level={3} className="!mb-2">
                Mi Perfil
              </Title>
              <Paragraph className="text-gray-600">
                Información de tu cuenta
              </Paragraph>
            </div>

            <Descriptions
              column={1}
              bordered
              items={[
                {
                  key: "email",
                  label: (
                    <Space>
                      <RiMailLine />
                      <Text strong>Email</Text>
                    </Space>
                  ),
                  children: <Text>{user?.email || "N/A"}</Text>,
                },
                {
                  key: "userId",
                  label: (
                    <Space>
                      <RiKeyLine />
                      <Text strong>ID de Usuario</Text>
                    </Space>
                  ),
                  children: <Text code>{formatUserId(user?.id) || "N/A"}</Text>,
                },
                {
                  key: "createdAt",
                  label: (
                    <Space>
                      <RiUserLine />
                      <Text strong>Miembro desde</Text>
                    </Space>
                  ),
                  children: <Text>{formatDateDDMMYYYY(user?.created_at)}</Text>,
                },
                {
                  key: "lastSignIn",
                  label: (
                    <Space>
                      <RiUserLine />
                      <Text strong>Último acceso</Text>
                    </Space>
                  ),
                  children: (
                    <Text>{formatDateDDMMYYYY(user?.last_sign_in_at)}</Text>
                  ),
                },
              ]}
            />
          </Space>
        </Card>
      ),
    },
    {
      key: "password",
      label: "Cambiar Contraseña",
      children: (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiLockLine className="text-3xl text-blue-600" />
              </div>
              <Title level={3} className="!mb-2">
                Cambiar Contraseña
              </Title>
              <Paragraph className="text-gray-600">
                Ingresa tu contraseña actual y elige una nueva contraseña segura
              </Paragraph>
            </div>

            {/* Success Alert */}
            {showSuccess && (
              <Alert
                message="¡Contraseña actualizada exitosamente!"
                description="Tu contraseña ha sido cambiada correctamente."
                type="success"
                showIcon
                icon={<RiCheckLine />}
                closable
                onClose={() => setShowSuccess(false)}
                className="mb-4"
              />
            )}

            {/* Error Alert */}
            {errorMessage && (
              <Alert
                message={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
                className="mb-4"
              />
            )}

            <Form
              form={passwordForm}
              onFinish={handlePasswordChange}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="currentPassword"
                label="Contraseña Actual"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu contraseña actual",
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder="Contraseña actual"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Nueva Contraseña"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu nueva contraseña",
                  },
                  {
                    min: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder="Nueva contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Por favor confirma tu nueva contraseña",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Las contraseñas no coinciden")
                      );
                    },
                  }),
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder="Confirmar nueva contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading || isPending}
                  className="w-full"
                  size="large"
                  icon={<RiLockLine />}
                >
                  Cambiar Contraseña
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      ),
    },
    {
      key: "email",
      label: "Cambiar Email",
      children: (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiMailLine className="text-3xl text-blue-600" />
              </div>
              <Title level={3} className="!mb-2">
                Cambiar Email
              </Title>
              <Paragraph className="text-gray-600">
                Ingresa tu contraseña actual y tu nuevo email. Recibirás un
                correo de confirmación.
              </Paragraph>
            </div>

            {/* Info Alert */}
            <Alert
              message="Importante"
              description="Se enviará un correo de confirmación a tu nuevo email. Debes verificar el correo para completar el cambio."
              type="info"
              showIcon
              className="mb-4"
            />

            {/* Success Alert */}
            {showEmailSuccess && (
              <Alert
                message="¡Correo de confirmación enviado!"
                description="Se ha enviado un correo de confirmación a tu nuevo email. Por favor, verifica tu correo electrónico para completar el cambio."
                type="success"
                showIcon
                icon={<RiCheckLine />}
                closable
                onClose={() => setShowEmailSuccess(false)}
                className="mb-4"
              />
            )}

            {/* Error Alert */}
            {emailErrorMessage && (
              <Alert
                message={emailErrorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setEmailErrorMessage(null)}
                className="mb-4"
              />
            )}

            <Form
              form={emailForm}
              onFinish={handleEmailChange}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="currentPassword"
                label="Contraseña Actual"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu contraseña actual",
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder="Contraseña actual"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="newEmail"
                label="Nuevo Email"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu nuevo email",
                  },
                  {
                    type: "email",
                    message: "Por favor ingresa un email válido",
                  },
                ]}
              >
                <Input
                  type="email"
                  prefixIcon={<RiMailLine />}
                  placeholder="Nuevo email"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmEmail"
                label="Confirmar Nuevo Email"
                dependencies={["newEmail"]}
                rules={[
                  {
                    required: true,
                    message: "Por favor confirma tu nuevo email",
                  },
                  {
                    type: "email",
                    message: "Por favor ingresa un email válido",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newEmail") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Los emails no coinciden")
                      );
                    },
                  }),
                ]}
              >
                <Input
                  type="email"
                  prefixIcon={<RiMailLine />}
                  placeholder="Confirmar nuevo email"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={emailLoading || isPending}
                  className="w-full"
                  size="large"
                  icon={<RiMailLine />}
                >
                  Cambiar Email
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <Title level={2}>Mi Perfil</Title>
          <Paragraph className="text-gray-600">
            Gestiona tu información personal y configuración de cuenta
          </Paragraph>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setErrorMessage(null);
            setShowSuccess(false);
            setEmailErrorMessage(null);
            setShowEmailSuccess(false);
          }}
          items={tabItems}
          size="large"
        />
      </Space>
    </div>
  );
}
