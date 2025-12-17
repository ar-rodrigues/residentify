"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  RiUserAddLine,
  RiMailLine,
  RiUserLine,
  RiLockLine,
  RiLoginBoxLine,
  RiBuildingLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { useGeneralInviteLinks } from "@/hooks/useGeneralInviteLinks";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { Form, Card, Typography, Space, Alert } from "antd";
import { localDateToUTC } from "@/utils/date";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

const { Title, Paragraph, Text } = Typography;

export default function GeneralInviteLinkPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { token } = params;
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [link, setLink] = useState(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [statusCheck, setStatusCheck] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [mode, setMode] = useState("checking"); // 'checking' | 'logged-in' | 'select' | 'login' | 'register' | 'already-member'
  const [registerForm] = Form.useForm();
  const [loginForm] = Form.useForm();
  const supabase = createClient();
  const {
    getGeneralInviteLinkByToken,
    acceptGeneralInviteLink,
    checkGeneralInviteLinkStatus,
    acceptGeneralInviteLinkLoggedIn,
    loading,
  } = useGeneralInviteLinks();
  const { data: currentUser, loading: userLoading } = useUser({
    redirectIfAuthenticated: false,
  });

  const checkStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      setErrorMessage(null);
      const result = await checkGeneralInviteLinkStatus(token);

      if (result.error) {
        console.error("Error checking status:", result.message);
        // Default to register mode if check fails
        setMode("register");
        setCheckingStatus(false);
        setLoadingLink(false);
        return;
      }

      setStatusCheck(result.data);

      // Check if user is already a member
      if (result.data.is_already_member && result.data.is_logged_in) {
        // User is already a member - show info message
        setMode("already-member");
        setCheckingStatus(false);
        setLoadingLink(false);
        return;
      }

      // Determine mode based on check results
      if (result.data.is_logged_in) {
        // User is logged in - show direct accept
        setMode("logged-in");
      } else {
        // User is not logged in - show selection screen
        setMode("select");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      // Default to select mode
      setMode("select");
    } finally {
      setCheckingStatus(false);
      setLoadingLink(false);
    }
  }, [token, checkGeneralInviteLinkStatus]);

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

      // Check if a user is logged in
      // If so, check their status
      const {
        data: { user: currentLoggedInUser },
      } = await supabase.auth.getUser();

      // Check status (will determine mode)
      await checkStatus();
    } catch (error) {
      console.error("Error loading general invite link:", error);
      setErrorMessage(t("organizations.generalInviteLinks.acceptPage.loadError"));
      setLoadingLink(false);
    }
  }, [token, getGeneralInviteLinkByToken, checkStatus, supabase]);

  useEffect(() => {
    if (token) {
      loadLink();
    }
  }, [token, loadLink]);

  // Re-check status when user logs in
  useEffect(() => {
    if (!userLoading && currentUser && link && (mode === "register" || mode === "login")) {
      // User just logged in, re-check status
      checkStatus();
    }
  }, [currentUser, userLoading, link, mode, checkStatus]);

  const handleAcceptLoggedIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await acceptGeneralInviteLinkLoggedIn(token);

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization page after 2 seconds
      setTimeout(() => {
        if (result.data?.organization_id) {
          router.push(`/organizations/${result.data.organization_id}`);
        } else {
          router.push("/organizations");
        }
      }, 2000);
    }
  };

  const handleLogin = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setErrorMessage(
          error.message.includes("Invalid login credentials")
            ? t("organizations.generalInviteLinks.acceptPage.invalidCredentials")
            : t("organizations.generalInviteLinks.acceptPage.loginError")
        );
        return;
      }

      // After successful login, re-check status
      // This will automatically switch to logged-in mode if user is logged in
      await checkStatus();
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(t("organizations.generalInviteLinks.acceptPage.unexpectedLoginError"));
    }
  };

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

  if (loadingLink || checkingStatus || mode === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <Card className="max-w-md w-full">
          <div className="flex justify-center py-8">
            <Space orientation="vertical" align="center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <Text type="secondary">{t("organizations.generalInviteLinks.acceptPage.loading")}</Text>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  if (errorMessage && !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Alert
              title={t("common.errorTitle")}
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
              {t("organizations.generalInviteLinks.acceptPage.backToHome")}
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
              title={t("organizations.generalInviteLinks.acceptPage.expiredTitle")}
              description={t("organizations.generalInviteLinks.acceptPage.expiredDescription")}
              type="error"
              showIcon
            />
            <Button
              type="primary"
              onClick={() => router.push("/")}
              className="w-full mt-4"
              size="large"
            >
              {t("organizations.generalInviteLinks.acceptPage.backToHome")}
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
              title={t("common.success")}
              description={successMessage}
              type="success"
              showIcon
              className="mb-4"
            />
            <Paragraph type="secondary" className="text-center">
              {t("common.redirecting")}
            </Paragraph>
          </Card>
        </div>
      </div>
    );
  }

  // Already member mode - show centered card
  if (mode === "already-member") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <Space orientation="vertical" size="middle" className="w-full">
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <RiUserAddLine className="text-3xl sm:text-4xl text-green-600" />
                </div>
                <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                  {t("organizations.generalInviteLinks.acceptPage.alreadyMemberTitle")}
                </Title>
                <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                  {t("organizations.generalInviteLinks.acceptPage.alreadyMemberDescription", {
                    organization: link.organization_name,
                  })}
                </Paragraph>
                {statusCheck?.user_name && (
                  <Paragraph className="text-gray-600 text-sm sm:text-base !mt-2 !mb-0">
                    {statusCheck.user_name}
                  </Paragraph>
                )}
                {statusCheck?.user_email && (
                  <Paragraph className="text-gray-500 text-xs sm:text-sm !mt-1 !mb-0">
                    {statusCheck.user_email}
                  </Paragraph>
                )}
              </div>

              <Button
                type="primary"
                onClick={() => {
                  if (statusCheck?.organization_id) {
                    router.push(`/organizations/${statusCheck.organization_id}`);
                  } else {
                    router.push("/organizations");
                  }
                }}
                className="w-full"
                size="large"
              >
                {t("organizations.generalInviteLinks.acceptPage.goToOrganization")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Selection mode - show centered selection cards
  if (mode === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-12 px-4">
        <div className="max-w-3xl w-full">
          <Card className="shadow-lg">
            <Space orientation="vertical" size="middle" className="w-full">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
                </div>
                <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                  {t("organizations.generalInviteLinks.acceptPage.joinTitle", {
                    organization: link.organization_name,
                  })}
                </Title>
                <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                  {t("organizations.generalInviteLinks.acceptPage.invitedMessage")}
                </Paragraph>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* I have an account card */}
                <Card
                  hoverable
                  onClick={() => setMode("login")}
                  className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-500"
                  styles={{
                    body: { padding: "24px", textAlign: "center" },
                  }}
                >
                  <Space
                    orientation="vertical"
                    size="middle"
                    className="w-full"
                    align="center"
                  >
                    <div className="flex justify-center">
                      <RiLoginBoxLine className="text-4xl sm:text-5xl text-blue-600" />
                    </div>
                    <Title level={4} className="!mb-0 !text-lg">
                      {t("organizations.generalInviteLinks.acceptPage.haveAccount")}
                    </Title>
                    <Paragraph className="text-gray-600 text-sm !mb-0">
                      {t("organizations.generalInviteLinks.acceptPage.haveAccountDescription")}
                    </Paragraph>
                  </Space>
                </Card>

                {/* I don't have an account card */}
                <Card
                  hoverable
                  onClick={() => setMode("register")}
                  className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-500"
                  styles={{
                    body: { padding: "24px", textAlign: "center" },
                  }}
                >
                  <Space
                    orientation="vertical"
                    size="middle"
                    className="w-full"
                    align="center"
                  >
                    <div className="flex justify-center">
                      <RiUserAddLine className="text-4xl sm:text-5xl text-blue-600" />
                    </div>
                    <Title level={4} className="!mb-0 !text-lg">
                      {t("organizations.generalInviteLinks.acceptPage.createAccount")}
                    </Title>
                    <Paragraph className="text-gray-600 text-sm !mb-0">
                      {t("organizations.generalInviteLinks.acceptPage.createAccountDescription")}
                    </Paragraph>
                  </Space>
                </Card>
              </div>

              <Button
                onClick={() => router.push("/")}
                className="w-full"
                size="large"
              >
                {t("common.cancel")}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Always render forms to keep them connected (hidden when not needed)
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" styles={{ body: { padding: "20px 16px" } }}>
          <Space orientation="vertical" size="middle" className="w-full">
            {/* Logged-in user - show direct accept button */}
            <div style={{ display: mode === "logged-in" ? "block" : "none" }}>
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
                </div>
                <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                  {t("organizations.generalInviteLinks.acceptPage.joinTitle", {
                    organization: link.organization_name,
                  })}
                </Title>
                <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                  {t("emails.invitation.acceptPage.authenticatedAs")}{" "}
                  {statusCheck?.user_email || currentUser?.email}
                </Paragraph>
                {statusCheck?.user_name && (
                  <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                    {statusCheck.user_name}
                  </Paragraph>
                )}
              </div>

              {/* Organization Details */}
              <Card className="bg-blue-50 border-blue-200">
                <Space orientation="vertical" size="middle" className="w-full">
                  <div className="flex items-start gap-3">
                    <RiBuildingLine className="text-xl text-blue-600 mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.organization")}
                      </Text>
                      <Text>{link.organization_name}</Text>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RiUserLine className="text-xl text-blue-600 mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.role")}
                      </Text>
                      <Text>
                        {link.role_name ||
                          link.role_description ||
                          t("organizations.generalInviteLinks.acceptPage.defaultRole")}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>

              {errorMessage && (
                <Alert
                  title={t("common.errorTitle")}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                />
              )}

              {link.requires_approval && (
                <Alert
                  title={t("organizations.generalInviteLinks.acceptPage.approvalRequired")}
                  description={t("organizations.generalInviteLinks.acceptPage.approvalRequiredDescription")}
                  type="info"
                  showIcon
                  className="mb-4"
                  size="small"
                />
              )}

              <Button
                type="primary"
                onClick={handleAcceptLoggedIn}
                loading={loading}
                className="w-full"
                size="large"
                icon={<RiUserAddLine />}
              >
                {t("emails.invitation.acceptButton")}
              </Button>
            </div>

            {/* Login mode - user exists but not logged in */}
            <div style={{ display: mode === "login" ? "block" : "none" }}>
              <Button
                type="text"
                icon={<RiArrowLeftLine />}
                onClick={() => setMode("select")}
                className="mb-4 -ml-2"
              >
                {t("common.back")}
              </Button>
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <RiLoginBoxLine className="text-3xl sm:text-4xl text-blue-600" />
                </div>
                <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                  {t("organizations.generalInviteLinks.acceptPage.loginToJoin")}
                </Title>
                <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                  {t("organizations.generalInviteLinks.acceptPage.loginToJoinDescription")}
                </Paragraph>
              </div>

              {/* Organization Details */}
              <Card className="bg-blue-50 border-blue-200">
                <Space orientation="vertical" size="middle" className="w-full">
                  <div className="flex items-start gap-3">
                    <RiBuildingLine className="text-xl text-blue-600 mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.organization")}
                      </Text>
                      <Text>{link.organization_name}</Text>
                    </div>
                  </div>
                </Space>
              </Card>

              {errorMessage && (
                <Alert
                  title="Error"
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                />
              )}

              <Form
                form={loginForm}
                onFinish={handleLogin}
                layout="vertical"
                requiredMark={false}
                className="w-full"
              >
                <Form.Item
                  name="email"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.email")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.emailRequired"),
                    },
                    {
                      type: "email",
                      message: t("emails.invitation.acceptPage.emailInvalid"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiMailLine className="text-base" />}
                    placeholder={t("organizations.invite.emailPlaceholder")}
                    type="email"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.password")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.passwordRequired"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Password
                    prefixIcon={<RiLockLine className="text-base" />}
                    placeholder={t("emails.invitation.acceptPage.password")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item className="!mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full mt-4"
                    size="large"
                    icon={<RiLoginBoxLine />}
                  >
                    {t("organizations.generalInviteLinks.acceptPage.loginAndJoin")}
                  </Button>
                </Form.Item>
              </Form>
            </div>

            {/* Register mode - new user */}
            <div style={{ display: mode === "register" ? "block" : "none" }}>
              <Button
                type="text"
                icon={<RiArrowLeftLine />}
                onClick={() => setMode("select")}
                className="mb-4 -ml-2"
              >
                {t("common.back")}
              </Button>
              <div className="text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <RiUserAddLine className="text-3xl sm:text-4xl text-blue-600" />
                </div>
                <Title level={2} className="!mb-2 !text-xl sm:!text-2xl">
                  {t("organizations.generalInviteLinks.acceptPage.joinTitle", {
                    organization: link.organization_name,
                  })}
                </Title>
                <Paragraph className="text-gray-600 text-sm sm:text-base !mb-0">
                  {t("organizations.generalInviteLinks.acceptPage.invitedMessage")}
                </Paragraph>
              </div>

              {errorMessage && (
                <Alert
                  title={t("common.errorTitle")}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                />
              )}

              <Form
                form={registerForm}
                onFinish={handleAccept}
                layout="vertical"
                requiredMark={false}
                className="w-full"
              >
                <Form.Item
                  name="first_name"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.firstName")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.firstNameRequired"),
                    },
                    {
                      min: 2,
                      message: t("organizations.generalInviteLinks.acceptPage.firstNameMinLength"),
                    },
                    {
                      max: 100,
                      message: t("organizations.generalInviteLinks.acceptPage.firstNameMaxLength"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder={t("emails.invitation.acceptPage.firstName")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="last_name"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.lastName")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.lastNameRequired"),
                    },
                    {
                      min: 2,
                      message: t("organizations.generalInviteLinks.acceptPage.lastNameMinLength"),
                    },
                    {
                      max: 100,
                      message: t("organizations.generalInviteLinks.acceptPage.lastNameMaxLength"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiUserLine className="text-base" />}
                    placeholder={t("emails.invitation.acceptPage.lastName")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.email")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.emailRequired"),
                    },
                    {
                      type: "email",
                      message: t("emails.invitation.acceptPage.emailInvalid"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefixIcon={<RiMailLine className="text-base" />}
                    placeholder={t("organizations.invite.emailPlaceholder")}
                    type="email"
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={<span className="text-sm sm:text-base">{t("emails.invitation.acceptPage.password")}</span>}
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.passwordRequiredRegister"),
                    },
                    {
                      min: 6,
                      message: t("emails.invitation.acceptPage.passwordMinLength"),
                    },
                  ]}
                  className="!mb-4"
                >
                  <Password
                    prefixIcon={<RiLockLine className="text-base" />}
                    placeholder={t("emails.invitation.acceptPage.password")}
                    size="large"
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="date_of_birth"
                  label={
                    <span className="text-sm sm:text-base">
                      {t("emails.invitation.acceptPage.dateOfBirth")}
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: t("emails.invitation.acceptPage.dateOfBirthRequired"),
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
                    title={t("organizations.generalInviteLinks.acceptPage.approvalRequired")}
                    description={t("organizations.generalInviteLinks.acceptPage.approvalRequiredDescription")}
                    type="info"
                    showIcon
                    className="mb-4"
                    size="small"
                  />
                )}

                <Form.Item className="!mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full mt-4"
                    size="large"
                    icon={<RiUserAddLine />}
                  >
                    {t("organizations.generalInviteLinks.acceptPage.createAccountAndJoin")}
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}
