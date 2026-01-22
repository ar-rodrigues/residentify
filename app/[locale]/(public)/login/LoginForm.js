"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import PWAInstallButton from "@/components/ui/PWAInstallButton";

const { Title, Paragraph, Text } = Typography;

export default function LoginForm() {
  const t = useTranslations();
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
        // Check if this is a Next.js redirect error - if so, don't show error message
        // Redirect errors have a digest property starting with 'NEXT_REDIRECT'
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
          // This is a redirect, let Next.js handle it - don't set error state
          return;
        }
        
        // Handle actual errors
        setErrorMessage(t("auth.login.errors.unexpectedError"));
        setLoading(false);
        console.error("Login error:", error);
      }
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-elevated))",
      }}
    >
      <div className="w-full max-w-md">
        <Space
          orientation="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine
              className="text-4xl"
              style={{ color: "var(--color-primary)" }}
            />
            <Title level={2} className="!mb-0" style={{ color: "var(--color-text-primary)" }}>
              Residentify
            </Title>
          </Space>
          <Paragraph style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.login.subtitle")}
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
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: "var(--color-primary-bg)",
                }}
              >
                <RiCheckLine
                  className="text-3xl"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <Title level={3} style={{ color: "var(--color-text-primary)" }}>
                {t("auth.login.success.title")}
              </Title>
              <Paragraph style={{ color: "var(--color-text-secondary)" }}>
                {t("auth.login.success.message")}
              </Paragraph>
              <Space orientation="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  onClick={() => router.push("/")}
                  className="w-full"
                  size="large"
                >
                  {t("auth.login.success.backToHome")}
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
                  {t("auth.login.success.backToLogin")}
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

            {/* Success Alert for Password Reset */}
            {searchParams.get("message") === "password_reset_success" && (
              <Alert
                title={t("auth.login.passwordResetSuccess.title")}
                description={t("auth.login.passwordResetSuccess.message")}
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
                  { required: true, message: t("auth.login.errors.emailRequired") },
                  {
                    type: "email",
                    message: t("auth.login.errors.emailInvalid"),
                  },
                ]}
              >
                <Input prefixIcon={<RiMailLine />} placeholder={t("auth.login.email")} />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: t("auth.login.errors.passwordRequired"),
                  },
                  {
                    min: 6,
                    message: t("auth.login.errors.passwordMinLength"),
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder={t("auth.login.password")}
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm"
                    style={{
                      color: "var(--color-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-primary-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                  >
                    {t("auth.login.forgotPassword")}
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
                  {t("auth.login.button")}
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Text className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {t("auth.login.noAccount")}{" "}
                  <Link
                    href="/signup"
                    className="font-medium"
                    style={{
                      color: "var(--color-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-primary-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                  >
                    {t("auth.login.createAccount")}
                  </Link>
                </Text>
              </div>
            </Form>
          </Card>
        )}

        {/* PWA Install Button - Only visible on mobile */}
        <div className="text-center mt-4">
          <PWAInstallButton variant="button" size="large" />
        </div>

        <div className="text-center mt-6">
          <Text className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.signup.terms")}
          </Text>
        </div>
      </div>
    </div>
  );
}







