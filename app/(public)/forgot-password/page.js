"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiMailLine, RiArrowLeftLine, RiCheckLine, RiRocketLine } from "react-icons/ri";
import { Form, Card, Typography, Space, Alert } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { forgotPassword } from "./actions";

const { Title, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [form] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error from route handler
    const error = searchParams.get("error");
    if (error === "invalid_token") {
      setErrorMessage(
        "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno nuevo."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setErrorMessage(null);
    setShowSuccess(false);

    const formDataObj = new FormData();
    formDataObj.append("email", values.email);

    startTransition(async () => {
      try {
        const result = await forgotPassword(formDataObj);

        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        } else {
          setShowSuccess(true);
          setLoading(false);
          form.resetFields();
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
              Restablecer Contraseña
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña
          </Paragraph>
        </Space>

        <Card>
          {showSuccess ? (
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
                Hemos enviado un enlace de restablecimiento a tu correo
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
              </Space>
            </Space>
          ) : (
            <>
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
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa tu correo electrónico",
                    },
                    {
                      type: "email",
                      message: "Por favor ingresa un email válido",
                    },
                  ]}
                >
                  <Input
                    prefixIcon={<RiMailLine />}
                    placeholder="Correo electrónico"
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
                    Enviar Enlace de Restablecimiento
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

