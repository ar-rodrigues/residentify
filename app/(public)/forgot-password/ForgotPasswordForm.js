"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RiMailLine, RiRocketLine, RiCheckLine, RiArrowLeftLine } from "react-icons/ri";
import { forgotPassword } from "./actions";
import { Form, Card, Typography, Space, Alert } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [forgotPasswordForm] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleForgotPassword = async (values) => {
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    const formDataObj = new FormData();
    formDataObj.append("email", values.email);

    startTransition(async () => {
      try {
        const result = await forgotPassword(formDataObj);

        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        } else if (result && !result.error) {
          setShowSuccess(true);
          setLoading(false);
          forgotPasswordForm.resetFields();
        }
      } catch (error) {
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Forgot password error:", error);
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
            Recupera tu contraseña ingresando tu correo electrónico
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
              <Title level={3}>¡Enlace Enviado!</Title>
              <Paragraph className="text-gray-600">
                Se ha enviado un enlace de restablecimiento a tu correo
                electrónico. Por favor, revisa tu bandeja de entrada y haz clic
                en el enlace para restablecer tu contraseña.
              </Paragraph>
              <Space direction="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="large"
                >
                  Volver al Login
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    forgotPasswordForm.resetFields();
                  }}
                  className="w-full"
                  size="large"
                  icon={<RiArrowLeftLine />}
                >
                  Enviar Otro Enlace
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

            <Form
              form={forgotPasswordForm}
              onFinish={handleForgotPassword}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu dirección de correo electrónico",
                  },
                  {
                    type: "email",
                    message: "Por favor ingresa un email válido",
                  },
                ]}
              >
                <Input
                  prefixIcon={<RiMailLine />}
                  placeholder="Email"
                  type="email"
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
                  Enviar Enlace de Restablecimiento
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Text type="secondary" className="text-sm">
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Volver al Login
                  </Link>
                </Text>
              </div>
            </Form>
          </Card>
        )}
      </div>
    </div>
  );
}






