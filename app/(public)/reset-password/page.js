"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiLockLine,
  RiCheckLine,
  RiArrowLeftLine,
  RiRocketLine,
} from "react-icons/ri";
import { Form, Card, Typography, Space, Alert } from "antd";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";
import { resetPassword } from "./actions";

const { Title, Paragraph } = Typography;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [tokenHash, setTokenHash] = useState(null);
  const [tokenType, setTokenType] = useState(null);
  const [form] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL query params (if user navigates directly with token)
    // Note: If coming from route handler, session is already set
    const hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (hash && type) {
      setTokenHash(hash);
      setTokenType(type);
    }
    // If no token, that's okay - the route handler should have set the session
    // The action will check for session if no token is provided
  }, [searchParams]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setErrorMessage(null);
    setShowSuccess(false);

    const formDataObj = new FormData();
    formDataObj.append("password", values.password);
    
    if (tokenHash && tokenType) {
      formDataObj.append("token_hash", tokenHash);
      formDataObj.append("type", tokenType);
    }

    startTransition(async () => {
      try {
        const result = await resetPassword(formDataObj);

        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        }
        // If no error object returned, reset was successful and redirect happened
      } catch (error) {
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Reset password error:", error);
      }
    });
  };

  // Note: We allow the form to render even without token
  // The action will handle verification if token exists, or use session if token was already verified

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Space
          direction="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine className="text-4xl text-blue-600" />
            <Title level={2} className="!mb-0">
              Establecer Nueva Contraseña
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de
            recordar.
          </Paragraph>
        </Space>

        <Card>
          {/* Error Alert */}
          {errorMessage && (
            <Alert
              message={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMessage(null)}
              className="mb-6"
            />
          )}

          {showSuccess ? (
            <Space
              direction="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <RiCheckLine className="text-3xl text-green-600" />
              </div>
              <Title level={3}>¡Contraseña Restablecida!</Title>
              <Paragraph className="text-gray-600">
                Tu contraseña ha sido restablecida exitosamente. Ahora puedes
                iniciar sesión con tu nueva contraseña.
              </Paragraph>
              <Button
                type="primary"
                onClick={() => router.push("/login")}
                className="w-full"
                size="large"
              >
                Ir al Login
              </Button>
            </Space>
          ) : (
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="password"
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
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Por favor confirma tu contraseña",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
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
                >
                  Restablecer Contraseña
                </Button>
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="large"
                  icon={<RiArrowLeftLine />}
                >
                  Volver al Login
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}

