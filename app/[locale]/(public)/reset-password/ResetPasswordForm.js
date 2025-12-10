"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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

export default function ResetPasswordForm() {
  const t = useTranslations();
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
        } else if (result && !result.error) {
          // Success - show success message, then redirect after 2 seconds
          setLoading(false);
          setShowSuccess(true);
          
          // Wait 2 seconds then redirect to login
          setTimeout(() => {
            router.push("/login?message=password_reset_success");
          }, 2000);
        }
      } catch (error) {
        setErrorMessage(t("auth.resetPassword.errors.unexpectedError"));
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
          orientation="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine className="text-4xl text-blue-600" />
            <Title level={2} className="!mb-0">
              {t("auth.resetPassword.title")}
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            {t("auth.resetPassword.subtitle")}
          </Paragraph>
        </Space>

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

          {showSuccess ? (
            <Space
              orientation="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <RiCheckLine className="text-3xl text-green-600" />
              </div>
              <Title level={3}>{t("auth.resetPassword.success.title")}</Title>
              <Paragraph className="text-gray-600">
                {t("auth.resetPassword.success.message")}
              </Paragraph>
              <Paragraph className="text-gray-500 text-sm">
                {t("auth.resetPassword.success.redirecting")}
              </Paragraph>
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
                    message: t("auth.resetPassword.errors.passwordRequired"),
                  },
                  {
                    min: 6,
                    message: t("auth.resetPassword.errors.passwordMinLength"),
                  },
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder={t("auth.resetPassword.password")}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: t("auth.resetPassword.errors.confirmPasswordRequired"),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(t("auth.resetPassword.errors.passwordsMismatch"))
                      );
                    },
                  }),
                ]}
              >
                <Password
                  prefixIcon={<RiLockLine />}
                  placeholder={t("auth.resetPassword.confirmPassword")}
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
                  {t("auth.resetPassword.button")}
                </Button>
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="large"
                  icon={<RiArrowLeftLine />}
                >
                  {t("auth.resetPassword.backToLogin")}
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}

