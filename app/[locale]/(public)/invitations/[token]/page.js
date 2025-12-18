"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  RiUserAddLine,
  RiLockLine,
  RiMailLine,
  RiBuildingLine,
  RiUserLine,
  RiLoginBoxLine,
} from "react-icons/ri";
import { useInvitations } from "@/hooks/useInvitations";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { Form, Card, Typography, Space, Alert } from "antd";
import { localDateToUTC } from "@/utils/date";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

const { Title, Paragraph, Text } = Typography;

export default function InvitationAcceptPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { token } = params;
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [emailCheck, setEmailCheck] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [mode, setMode] = useState("checking"); // 'checking', 'logged-in', 'login', 'register'
  const [registerForm] = Form.useForm();
  const [loginForm] = Form.useForm();
  const supabase = createClient();
  const {
    getInvitationByToken,
    acceptInvitation,
    loading,
    checkEmail,
    acceptInvitationLoggedIn,
  } = useInvitations();
  const { data: currentUser, loading: userLoading } = useUser({
    redirectIfAuthenticated: false,
  });

  const checkEmailStatus = useCallback(
    async (email) => {
      try {
        setCheckingEmail(true);
        const result = await checkEmail(token);

        if (result.error) {
          console.error("Error checking email:", result.message);
          // Default to register mode if check fails
          setMode("register");
          setCheckingEmail(false);
          setLoadingInvitation(false);
          return;
        }

        setEmailCheck(result.data);

        // Check if user is already a member (if logged in and email matches)
        if (
          result.data.is_already_member &&
          result.data.email_matches &&
          result.data.is_logged_in
        ) {
          // User is already a member - show error message
          setErrorMessage(
            "Ya eres miembro de esta organización. No necesitas aceptar la invitación nuevamente."
          );
          setMode("logged-in"); // Still show logged-in mode but with error
          setLoadingInvitation(false);
          return;
        }

        // Determine mode based on check results
        // Handle all scenarios:
        // 1. User is logged in and email matches - can accept directly
        // 2. User exists but not logged in (or logged in with different email) - show login
        // 3. New user - show registration
        if (result.data.email_matches && result.data.is_logged_in) {
          // Scenario: User B logged in accessing own link (has account)
          setMode("logged-in");
        } else if (result.data.user_exists) {
          // Scenario: User exists but not logged in OR logged in with different email
          // - User A logged in accessing User B's link (B has account) → logout happened, now show login
          // - No one logged in, User B has account → show login
          setMode("login");
        } else {
          // Scenario: New user
          // - User A logged in accessing User B's link (B has no account) → logout happened, now show register
          // - No one logged in, User B has no account → show register
          setMode("register");
        }
      } catch (error) {
        console.error("Error checking email status:", error);
        // Default to register mode
        setMode("register");
      } finally {
        setCheckingEmail(false);
        setLoadingInvitation(false);
      }
    },
    [token, checkEmail]
  );

  const loadInvitation = useCallback(async () => {
    try {
      setLoadingInvitation(true);
      setErrorMessage(null);
      const result = await getInvitationByToken(token);

      if (result.error) {
        setErrorMessage(result.message);
        setLoadingInvitation(false);
        return;
      }

      setInvitation(result.data);

      // Check if a user is logged in and their email doesn't match the invitation email
      // If so, logout before proceeding to ensure clean session state
      const {
        data: { user: currentLoggedInUser },
      } = await supabase.auth.getUser();

      if (
        currentLoggedInUser &&
        currentLoggedInUser.email?.toLowerCase() !==
          result.data.email.toLowerCase()
      ) {
        // User is logged in but email doesn't match - logout silently
        await supabase.auth.signOut();
        // Wait a brief moment for session to clear before checking email status
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Check email status (will show login or register based on whether user exists)
      await checkEmailStatus(result.data.email);
    } catch (error) {
      console.error("Error loading invitation:", error);
      setErrorMessage("Error al cargar la invitación.");
      setLoadingInvitation(false);
    }
  }, [token, getInvitationByToken, checkEmailStatus, supabase]);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token, loadInvitation]);

  // Re-check email status when user logs in
  useEffect(() => {
    if (!userLoading && currentUser && invitation && mode === "login") {
      // User just logged in, re-check email status
      checkEmailStatus(invitation.email);
    }
  }, [currentUser, userLoading, invitation, mode, checkEmailStatus]);

  // Set form values after forms are mounted
  useEffect(() => {
    if (!invitation) return;

    // Set form values when forms are available
    if (mode === "register" || mode === "login") {
      // Use setTimeout to ensure forms are mounted
      setTimeout(() => {
        registerForm.setFieldsValue({
          email: invitation.email,
          firstName: invitation.first_name,
          lastName: invitation.last_name,
        });
        loginForm.setFieldsValue({
          email: invitation.email,
        });
      }, 0);
    }
  }, [invitation, mode, registerForm, loginForm]);

  // Get initial values for forms
  const loginInitialValues = invitation
    ? { email: invitation.email }
    : undefined;

  const registerInitialValues = invitation
    ? {
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
      }
    : undefined;

  const handleAcceptLoggedIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await acceptInvitationLoggedIn(token);

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization page after 2 seconds
      setTimeout(() => {
        if (result.data?.organization_id) {
          router.push(`/organizations/${result.data.organization_id}`);
        } else {
          router.push("/");
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
            ? "Credenciales inválidas. Por favor, verifica tu email y contraseña."
            : "Error al iniciar sesión. Por favor, intenta nuevamente."
        );
        return;
      }

      // After successful login, re-check email status
      // This will automatically switch to logged-in mode if email matches
      await checkEmailStatus(values.email);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Error inesperado al iniciar sesión.");
    }
  };

  const handleAccept = async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Convert local date to UTC for storage
    const dateOfBirth = values.dateOfBirth
      ? localDateToUTC(values.dateOfBirth)
      : null;

    if (!dateOfBirth) {
      setErrorMessage("La fecha de nacimiento es requerida.");
      return;
    }

    const result = await acceptInvitation(token, {
      password: values.password,
      date_of_birth: dateOfBirth,
    });

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage(result.message);
      // Redirect to organization page after 2 seconds
      setTimeout(() => {
        if (result.data?.organization_id) {
          router.push(`/organizations/${result.data.organization_id}`);
        } else {
          router.push("/");
        }
      }, 2000);
    }
  };

  // Map role names using translations
  const getRoleDisplayName = (roleName) => {
    return t(`organizations.invite.roles.${roleName}`, {
      defaultValue: roleName,
    });
  };

  if (loadingInvitation || checkingEmail || mode === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4">
        <Card
          className="shadow-2xl border-0 max-w-md w-full"
          style={{
            borderRadius: "20px",
            background: "var(--color-bg-elevated)",
          }}
        >
          <div className="w-full py-10 px-4 flex flex-col items-center">
            <div
              className="relative"
              style={{
                width: "80px",
                height: "80px",
                minWidth: "80px",
                minHeight: "80px",
              }}
            >
              {/* Spinning ring */}
              <div
                className="absolute border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"
                style={{
                  width: "80px",
                  height: "80px",
                  top: 0,
                  left: 0,
                }}
              />
              {/* Center icon */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  width: "80px",
                  height: "80px",
                  top: 0,
                  left: 0,
                }}
              >
                <RiUserAddLine className="text-3xl text-[var(--color-primary)]" />
              </div>
            </div>
            <div className="text-center mt-6">
              <Title level={4} className="!mb-0 !font-semibold">
                {t("emails.invitation.acceptPage.loading")}
              </Title>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <Space orientation="vertical" size="large" className="w-full">
              <Alert
                title={t("emails.invitation.acceptPage.notFound")}
                description={
                  errorMessage || t("emails.invitation.acceptPage.expired")
                }
                type="error"
                showIcon
              />
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Show success message only after acceptance
  if (successMessage) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <Space orientation="vertical" size="large" className="w-full">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <RiUserAddLine className="text-4xl text-green-600" />
                </div>
                <Title level={2} className="mb-2">
                  {t("emails.invitation.acceptPage.accepted")}
                </Title>
              </div>
              <Alert
                title={t("emails.invitation.acceptPage.success")}
                description={successMessage}
                type="success"
                showIcon
              />
              <Paragraph className="text-center text-[var(--color-text-secondary)]">
                {t("emails.invitation.acceptPage.redirecting")}
              </Paragraph>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Always render both forms to keep them connected (hidden when not needed)
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <Space orientation="vertical" size="large" className="w-full">
            {/* Logged-in user with matching email - show direct accept button */}
            <div style={{ display: mode === "logged-in" ? "block" : "none" }}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <RiUserAddLine className="text-4xl text-[var(--color-primary)]" />
                </div>
                <Title level={2} className="mb-2">
                  {t("emails.invitation.acceptPage.acceptTitle")}
                </Title>
                <Paragraph className="text-[var(--color-text-secondary)]">
                  {t("emails.invitation.acceptPage.authenticatedAs")}{" "}
                  {currentUser?.email}
                </Paragraph>
              </div>

              {/* Invitation Details */}
              <Card className="bg-[var(--color-primary-bg)] border-[var(--color-primary)]">
                <Space orientation="vertical" size="middle" className="w-full">
                  <div className="flex items-start gap-3">
                    <RiBuildingLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.organization")}
                      </Text>
                      <Text>{invitation?.organization?.name}</Text>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RiUserLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.role")}
                      </Text>
                      <Text>
                        {invitation?.role
                          ? getRoleDisplayName(invitation.role.name)
                          : ""}
                      </Text>
                    </div>
                  </div>
                  {invitation?.inviter_name && (
                    <div className="flex items-start gap-3">
                      <RiUserLine className="text-xl text-[var(--color-primary)] mt-1" />
                      <div>
                        <Text strong className="block mb-1">
                          {t("emails.invitation.invitedBy")}
                        </Text>
                        <Text>{invitation.inviter_name}</Text>
                      </div>
                    </div>
                  )}
                </Space>
              </Card>

              {errorMessage && (
                <Alert
                  title={t("emails.invitation.acceptPage.error")}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                />
              )}

              {successMessage && (
                <Alert
                  title={t("emails.invitation.acceptPage.success")}
                  description={successMessage}
                  type="success"
                  showIcon
                />
              )}

              <Button
                type="primary"
                onClick={handleAcceptLoggedIn}
                loading={loading}
                disabled={loading || emailCheck?.is_already_member}
                className="w-full"
                size="large"
                icon={<RiUserAddLine />}
              >
                {t("emails.invitation.acceptPage.acceptTitle")}
              </Button>
            </div>

            {/* Login mode - user exists but not logged in */}
            <div style={{ display: mode === "login" ? "block" : "none" }}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <RiLoginBoxLine className="text-4xl text-[var(--color-primary)]" />
                </div>
                <Title level={2} className="mb-2">
                  {t("emails.invitation.acceptPage.loginToAccept")}
                </Title>
                <Paragraph className="text-[var(--color-text-secondary)]">
                  {t("emails.invitation.acceptPage.loginMessage")}
                </Paragraph>
              </div>

              {/* Invitation Details */}
              <Card className="bg-[var(--color-primary-bg)] border-[var(--color-primary)]">
                <Space orientation="vertical" size="middle" className="w-full">
                  <div className="flex items-start gap-3">
                    <RiBuildingLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.organization")}
                      </Text>
                      <Text>{invitation?.organization?.name}</Text>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RiUserLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.role")}
                      </Text>
                      <Text>
                        {invitation?.role
                          ? getRoleDisplayName(invitation.role.name)
                          : ""}
                      </Text>
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
                preserve={false}
                initialValues={loginInitialValues}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Por favor ingresa tu email" },
                    { type: "email", message: "El email no es válido" },
                  ]}
                >
                  <Input
                    prefixIcon={<RiMailLine />}
                    placeholder={invitation?.email || "email@ejemplo.com"}
                    type="email"
                    size="large"
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Contraseña"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa tu contraseña",
                    },
                  ]}
                >
                  <Password
                    prefixIcon={<RiLockLine />}
                    placeholder="Contraseña"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Space className="w-full" orientation="vertical">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      disabled={loading}
                      className="w-full"
                      size="large"
                      icon={<RiLoginBoxLine />}
                    >
                      {t("emails.invitation.acceptPage.loginAndAccept")}
                    </Button>
                    <div className="text-center">
                      <Link
                        href={`/forgot-password?email=${encodeURIComponent(
                          invitation?.email || ""
                        )}`}
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] text-sm"
                      >
                        {t("emails.invitation.acceptPage.forgotPassword")}
                      </Link>
                    </div>
                  </Space>
                </Form.Item>
              </Form>
            </div>

            {/* Register mode - new user */}
            <div style={{ display: mode === "register" ? "block" : "none" }}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <RiUserAddLine className="text-4xl text-[var(--color-primary)]" />
                </div>
                <Title level={2} className="mb-2">
                  {t("emails.invitation.acceptPage.acceptTitle")}
                </Title>
                <Paragraph className="text-[var(--color-text-secondary)]">
                  {t("emails.invitation.acceptPage.completeRegistration")}
                </Paragraph>
              </div>

              {/* Invitation Details */}
              <Card className="bg-[var(--color-primary-bg)] border-[var(--color-primary)]">
                <Space orientation="vertical" size="middle" className="w-full">
                  <div className="flex items-start gap-3">
                    <RiBuildingLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.organization")}
                      </Text>
                      <Text>{invitation?.organization?.name}</Text>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RiUserLine className="text-xl text-[var(--color-primary)] mt-1" />
                    <div>
                      <Text strong className="block mb-1">
                        {t("emails.invitation.role")}
                      </Text>
                      <Text>
                        {invitation?.role
                          ? getRoleDisplayName(invitation.role.name)
                          : ""}
                      </Text>
                    </div>
                  </div>
                  {invitation?.inviter_name && (
                    <div className="flex items-start gap-3">
                      <RiUserLine className="text-xl text-[var(--color-primary)] mt-1" />
                      <div>
                        <Text strong className="block mb-1">
                          {t("emails.invitation.invitedBy")}
                        </Text>
                        <Text>{invitation.inviter_name}</Text>
                      </div>
                    </div>
                  )}
                </Space>
              </Card>

              {errorMessage && (
                <Alert
                  title={t("emails.invitation.acceptPage.error")}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                />
              )}

              {successMessage && (
                <Alert
                  title={t("emails.invitation.acceptPage.success")}
                  description={successMessage}
                  type="success"
                  showIcon
                />
              )}

              <Form
                form={registerForm}
                onFinish={handleAccept}
                layout="vertical"
                requiredMark={false}
                initialValues={registerInitialValues}
              >
                <Form.Item
                  name="firstName"
                  label="Nombre"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa tu nombre",
                    },
                  ]}
                >
                  <Input
                    prefixIcon={<RiUserLine />}
                    placeholder="Nombre"
                    size="large"
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label="Apellido"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa tu apellido",
                    },
                  ]}
                >
                  <Input
                    prefixIcon={<RiUserLine />}
                    placeholder="Apellido"
                    size="large"
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Por favor ingresa tu email" },
                    { type: "email", message: "El email no es válido" },
                  ]}
                >
                  <Input
                    prefixIcon={<RiMailLine />}
                    placeholder="email@ejemplo.com"
                    type="email"
                    size="large"
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name="dateOfBirth"
                  label="Fecha de Nacimiento"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa tu fecha de nacimiento",
                    },
                  ]}
                >
                  <DatePicker
                    onFormFieldChange={(date) => {
                      registerForm.setFieldValue("dateOfBirth", date);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Contraseña"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa una contraseña",
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
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirmar Contraseña"
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
                    placeholder="Confirma tu contraseña"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                    className="w-full"
                    size="large"
                    icon={<RiUserAddLine />}
                  >
                    {t("emails.invitation.acceptPage.acceptAndRegister")}
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
