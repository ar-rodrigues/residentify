"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  RiUserLine,
  RiLockLine,
  RiMailLine,
  RiCheckLine,
  RiKeyLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";
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
import { RiArrowLeftLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { formatDateDDMMYYYY } from "@/utils/date";
import Password from "@/components/ui/Password";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function ProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser({
    redirectToLogin: true,
  });
  const { organizations, fetching: fetchingOrgs } = useOrganizations();
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

  // Check if user has no organizations
  const hasNoOrganizations = !fetchingOrgs && organizations.length === 0;

  const handlePasswordChange = useCallback(
    async (values) => {
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
            t("profile.errors.unexpectedError")
          );
          setLoading(false);
          console.error("Change password error:", error);
        }
      });
    },
    [passwordForm]
  );

  const handleEmailChange = useCallback(
    async (values) => {
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
            t("profile.errors.unexpectedError")
          );
          setEmailLoading(false);
          console.error("Change email error:", error);
        }
      });
    },
    [emailForm]
  );

  const tabItems = useMemo(() => {
    // Format user ID to show only first and last 4 characters
    const formatUserId = (userId) => {
      if (!userId || userId.length < 9) return userId;
      return `${userId.substring(0, 4)}...${userId.substring(
        userId.length - 4
      )}`;
    };

    return [
      {
        key: "profile",
        label: t("profile.tabs.profile"),
        children: (
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
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
                  {t("profile.info.title")}
                </Title>
                <Paragraph className="text-gray-600">
                  {t("profile.info.subtitle")}
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
                        <Text strong>{t("profile.info.email")}</Text>
                      </Space>
                    ),
                    children: <Text>{user ? user.email : "N/A"}</Text>,
                  },
                  {
                    key: "userId",
                    label: (
                      <Space>
                        <RiKeyLine />
                        <Text strong>{t("profile.info.userId")}</Text>
                      </Space>
                    ),
                    children: (
                      <Text code>{user ? formatUserId(user.id) : "N/A"}</Text>
                    ),
                  },
                  {
                    key: "createdAt",
                    label: (
                      <Space>
                        <RiUserLine />
                        <Text strong>{t("profile.info.memberSince")}</Text>
                      </Space>
                    ),
                    children: (
                      <Text>
                        {user ? formatDateDDMMYYYY(user.created_at) : "N/A"}
                      </Text>
                    ),
                  },
                  {
                    key: "lastSignIn",
                    label: (
                      <Space>
                        <RiUserLine />
                        <Text strong>{t("profile.info.lastAccess")}</Text>
                      </Space>
                    ),
                    children: (
                      <Text>
                        {user
                          ? formatDateDDMMYYYY(user.last_sign_in_at)
                          : "N/A"}
                      </Text>
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
        label: t("profile.tabs.password"),
        children: (
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiLockLine className="text-3xl text-blue-600" />
                </div>
                <Title level={3} className="!mb-2">
                  {t("profile.password.title")}
                </Title>
                <Paragraph className="text-gray-600">
                  {t("profile.password.subtitle")}
                </Paragraph>
              </div>

              {/* Success Alert */}
              {showSuccess && (
                <Alert
                  title={t("profile.password.success.title")}
                  description={t("profile.password.success.description")}
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
                  title={errorMessage}
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
                  label={t("profile.password.currentPassword")}
                  rules={[
                    {
                      required: true,
                      message: t("profile.password.currentPasswordRequired"),
                    },
                  ]}
                >
                  <Password
                    prefixIcon={<RiLockLine />}
                    placeholder={t("profile.password.currentPasswordPlaceholder")}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label={t("profile.password.newPassword")}
                  rules={[
                    {
                      required: true,
                      message: t("profile.password.newPasswordRequired"),
                    },
                    {
                      min: 6,
                      message: t("profile.password.newPasswordMinLength"),
                    },
                  ]}
                >
                  <Password
                    prefixIcon={<RiLockLine />}
                    placeholder={t("profile.password.newPasswordPlaceholder")}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={t("profile.password.confirmPassword")}
                  dependencies={["newPassword"]}
                  rules={[
                    {
                      required: true,
                      message: t("profile.password.confirmPasswordRequired"),
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(t("profile.password.passwordsMismatch"))
                        );
                      },
                    }),
                  ]}
                >
                  <Password
                    prefixIcon={<RiLockLine />}
                    placeholder={t("profile.password.confirmPasswordPlaceholder")}
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
                    {t("profile.password.button")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        ),
      },
      {
        key: "email",
        label: t("profile.tabs.email"),
        children: (
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiMailLine className="text-3xl text-blue-600" />
                </div>
                <Title level={3} className="!mb-2">
                  {t("profile.email.title")}
                </Title>
                <Paragraph className="text-gray-600">
                  {t("profile.email.subtitle")}
                </Paragraph>
              </div>

              {/* Info Alert */}
              <Alert
                title={t("profile.email.info.title")}
                description={t("profile.email.info.description")}
                type="info"
                showIcon
                className="mb-4"
              />

              {/* Success Alert */}
              {showEmailSuccess && (
                <Alert
                  title={t("profile.email.success.title")}
                  description={t("profile.email.success.description")}
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
                  title={emailErrorMessage}
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
                  label={t("profile.email.currentPassword")}
                  rules={[
                    {
                      required: true,
                      message: t("profile.email.currentPasswordRequired"),
                    },
                  ]}
                >
                  <Password
                    prefixIcon={<RiLockLine />}
                    placeholder={t("profile.email.currentPasswordPlaceholder")}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="newEmail"
                  label={t("profile.email.newEmail")}
                  rules={[
                    {
                      required: true,
                      message: t("profile.email.newEmailRequired"),
                    },
                    {
                      type: "email",
                      message: t("profile.email.newEmailInvalid"),
                    },
                  ]}
                >
                  <Input
                    type="email"
                    prefixIcon={<RiMailLine />}
                    placeholder={t("profile.email.newEmailPlaceholder")}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmEmail"
                  label={t("profile.email.confirmEmail")}
                  dependencies={["newEmail"]}
                  rules={[
                    {
                      required: true,
                      message: t("profile.email.confirmEmailRequired"),
                    },
                    {
                      type: "email",
                      message: t("profile.email.confirmEmailInvalid"),
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newEmail") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(t("profile.email.emailsMismatch"))
                        );
                      },
                    }),
                  ]}
                >
                  <Input
                    type="email"
                    prefixIcon={<RiMailLine />}
                    placeholder={t("profile.email.confirmEmailPlaceholder")}
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
                    {t("profile.email.button")}
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        ),
      },
    ];
  }, [
    user,
    showSuccess,
    errorMessage,
    showEmailSuccess,
    emailErrorMessage,
    loading,
    isPending,
    emailLoading,
    passwordForm,
    emailForm,
    handlePasswordChange,
    handleEmailChange,
  ]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space orientation="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">{t("profile.loading")}</Paragraph>
        </Space>
      </div>
    );
  }

  return (
    <div>
      <Space orientation="vertical" size="large" className="w-full">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2}>{t("profile.title")}</Title>
            <Paragraph className="text-gray-600">
              {t("profile.subtitle")}
            </Paragraph>
          </div>
          {hasNoOrganizations && (
            <Button
              icon={<RiArrowLeftLine />}
              onClick={() => router.push("/organizations")}
              size="large"
            >
              {t("common.back")}
            </Button>
          )}
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
