"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RiMailLine, RiRocketLine, RiCheckLine, RiArrowLeftLine } from "react-icons/ri";
import { forgotPassword } from "./actions";
import { Form, Card, Typography, Space, Alert } from "antd";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function ForgotPasswordForm() {
  const t = useTranslations();
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
        setErrorMessage(t("auth.forgotPassword.errors.unexpectedError"));
        setLoading(false);
        console.error("Forgot password error:", error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Space
          orientation="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine className="text-4xl text-blue-600" />
            <Title level={2} className="!mb-0">
              Residentify
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            {t("auth.forgotPassword.subtitle")}
          </Paragraph>
        </Space>

        {/* Success Message */}
        {showSuccess ? (
          <Card>
            <Space
              orientation="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <RiCheckLine className="text-3xl text-green-600" />
              </div>
              <Title level={3}>{t("auth.forgotPassword.success.title")}</Title>
              <Paragraph className="text-gray-600">
                {t("auth.forgotPassword.success.message")}
              </Paragraph>
              <Space orientation="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="large"
                >
                  {t("auth.forgotPassword.success.backToLogin")}
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
                  {t("auth.forgotPassword.success.sendAnother")}
                </Button>
              </Space>
            </Space>
          </Card>
        ) : (
          <Card>
            {/* Error Alert */}
            {errorMessage && (
              <Alert
                title={errorMessage}
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
                    message: t("auth.forgotPassword.errors.emailRequired"),
                  },
                  {
                    type: "email",
                    message: t("auth.forgotPassword.errors.emailInvalid"),
                  },
                ]}
              >
                <Input
                  prefixIcon={<RiMailLine />}
                  placeholder={t("auth.forgotPassword.email")}
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
                  {t("auth.forgotPassword.button")}
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Text type="secondary" className="text-sm">
                  {t("auth.forgotPassword.rememberPassword")}{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t("auth.forgotPassword.backToLogin")}
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






