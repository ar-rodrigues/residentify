"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RiLockLine,
  RiMailLine,
  RiRocketLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { login } from "./actions";
import { Form, Card, Typography, Space, Alert } from "antd";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loginForm] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is already logged in and redirect if so
  useUser({ redirectIfAuthenticated: true });

  useEffect(() => {
    // Check for success message
    const message = searchParams.get("message");
    if (message === "signup_success") {
      setShowSuccess(true);
    } else {
      // Reset showSuccess when message parameter is removed or changed
      setShowSuccess(false);
      if (message === "password_reset_success") {
        // Show success message for password reset on login form
        setErrorMessage(null);
      }
    }
  }, [searchParams]);

  const handleLogin = async (values) => {
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    const formDataObj = new FormData();
    formDataObj.append("email", values.email);
    formDataObj.append("password", values.password);

    // Call server action within startTransition for proper redirect handling
    startTransition(async () => {
      try {
        const result = await login(formDataObj);

        // If we get here, there was an error (redirect() throws, so we never reach this)
        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        }
      } catch (error) {
        // Handle actual errors (redirect errors are automatically handled by Next.js in startTransition)
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Login error:", error);
      }
    });
  };

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
              Proyecto Starter
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            Un proyecto base completo y listo para usar con Next.js 15, Tailwind
            CSS 4 y autenticación
          </Paragraph>
        </Space>

        {/* Success Message */}
        {showSuccess ? (
          <Card>
            <Space
              direction="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <RiCheckLine className="text-3xl text-green-600" />
              </div>
              <Title level={3}>¡Cuenta Creada Exitosamente!</Title>
              <Paragraph className="text-gray-600">
                Hemos enviado un enlace de confirmación a tu correo electrónico.
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace
                para activar tu cuenta.
              </Paragraph>
              <Space direction="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  onClick={() => router.push("/")}
                  className="w-full"
                  size="large"
                >
                  Volver al Inicio
                </Button>
                <Button
                  onClick={() => {
                    router.replace("/login");
                    setShowSuccess(false);
                  }}
                  className="w-full"
                  size="large"
                  icon={<RiArrowLeftLine />}
                >
                  Volver al Login
                </Button>
              </Space>
            </Space>
          </Card>
        ) : (
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

            {/* Success Alert for Password Reset */}
            {searchParams.get("message") === "password_reset_success" && (
              <Alert
                message="Contraseña restablecida exitosamente"
                description="Tu contraseña ha sido restablecida. Ahora puedes iniciar sesión con tu nueva contraseña."
                type="success"
                showIcon
                closable
                className="mb-6"
              />
            )}

            <Form
              form={loginForm}
              onFinish={handleLogin}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Por favor ingresa tu email" },
                  {
                    type: "email",
                    message: "Por favor ingresa un email válido",
                  },
                ]}
              >
                <Input prefixIcon={<RiMailLine />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu contraseña",
                  },
                  {
                    min: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder="Contraseña"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading || isPending}
                  className="w-full"
                  size="large"
                >
                  Iniciar Sesión
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Text type="secondary" className="text-sm">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/signup"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Crear cuenta
                  </Link>
                </Text>
              </div>
            </Form>
          </Card>
        )}

        <div className="text-center mt-6">
          <Text type="secondary" className="text-sm">
            Al crear una cuenta o iniciar sesión, aceptas nuestros términos y
            condiciones
          </Text>
        </div>
      </div>
    </div>
  );
}
