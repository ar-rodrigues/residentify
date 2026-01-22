"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  RiUserLine,
  RiLockLine,
  RiMailLine,
  RiRocketLine,
  RiCalendarLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { signup } from "./actions";
import { Form, Card, Typography, Space, Alert, DatePicker } from "antd";
import dayjs from "dayjs";
import { localDateToUTC } from "@/utils/date";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";
import PWAInstallButton from "@/components/ui/PWAInstallButton";

const { Title, Paragraph, Text } = Typography;

export default function SignupPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [signupForm] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const datePickerRef = useRef(null);

  // Check if user is already logged in and redirect if so
  useUser({ redirectIfAuthenticated: true });

  const handleSignup = async (values) => {
    setLoading(true);
    setErrorMessage(null);

    // Convert local date to UTC for storage
    // This ensures the date selected by the user in their timezone
    // is correctly interpreted on the server
    const dateOfBirth = values.dateOfBirth
      ? localDateToUTC(values.dateOfBirth)
      : null;

    const formDataObj = new FormData();
    formDataObj.append("firstName", values.firstName);
    formDataObj.append("lastName", values.lastName);
    formDataObj.append("dateOfBirth", dateOfBirth);
    formDataObj.append("email", values.email);
    formDataObj.append("password", values.password);

    // Call server action within startTransition for proper redirect handling
    startTransition(async () => {
      try {
        const result = await signup(formDataObj);

        // If we get here, there was an error (redirect() throws, so we never reach this)
        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        }
      } catch (error) {
        // Handle actual errors (redirect errors are automatically handled by Next.js in startTransition)
        setErrorMessage(t("auth.signup.errors.unexpectedError"));
        setLoading(false);
        console.error("Signup error:", error);
      }
    });
  };

  // Disable future dates for date of birth
  // This prevents users from selecting dates in the future
  const disabledDate = (current) => {
    if (!current) return false;
    // Disable dates after today (in user's local timezone)
    return current && current.isAfter(dayjs(), "day");
  };

  // Format date input as user types (dd/mm/yyyy)
  // Automatically adds slashes after day and month
  const formatDateInput = (value) => {
    if (!value) return "";

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    // Limit to 8 digits (ddmmyyyy)
    const limitedDigits = digits.slice(0, 8);

    // Format with slashes
    let formatted = limitedDigits;
    if (limitedDigits.length > 2) {
      formatted = `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
    }
    if (limitedDigits.length > 4) {
      formatted = `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(
        2,
        4
      )}/${limitedDigits.slice(4)}`;
    }

    return formatted;
  };

  // Handle date input change with auto-formatting
  const handleDateInputChange = useCallback(
    (e) => {
      const inputValue = e.target.value;
      const formatted = formatDateInput(inputValue);

      // Only update if the formatted value is different
      if (inputValue !== formatted) {
        // Store current cursor position
        const cursorPos = e.target.selectionStart || 0;

        // Use the native setter to update the value (bypasses React's controlled component)
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(e.target, formatted);
        }

        // Calculate new cursor position (adjust for added slashes)
        let newCursorPos = formatted.length;
        if (cursorPos <= 2 && formatted.length > 2) {
          // Cursor was in day section, keep it there
          newCursorPos = Math.min(cursorPos, 2);
        } else if (cursorPos <= 5 && formatted.length > 5) {
          // Cursor was in month section
          newCursorPos = Math.min(cursorPos + 1, 5); // +1 for the slash
        } else {
          // Cursor was in year section
          newCursorPos = formatted.length;
        }

        // Trigger input event so React/Ant Design recognizes the change
        const inputEvent = new Event("input", {
          bubbles: true,
          cancelable: true,
        });
        e.target.dispatchEvent(inputEvent);

        // Position cursor
        setTimeout(() => {
          const input = e.target;
          if (input) {
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else {
        // Even if not formatted, position cursor at end
        setTimeout(() => {
          const input = e.target;
          if (input) {
            input.setSelectionRange(formatted.length, formatted.length);
          }
        }, 0);
      }

      // Try to parse the formatted date and update the form
      if (formatted.length === 10) {
        // Full date entered (dd/mm/yyyy)
        const [day, month, year] = formatted.split("/").map(Number);
        if (day && month && year && day <= 31 && month <= 12) {
          const date = dayjs(
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
              2,
              "0"
            )}`
          );
          if (date.isValid() && !date.isAfter(dayjs(), "day")) {
            // Use setTimeout to avoid conflicts with the input event
            setTimeout(() => {
              signupForm.setFieldValue("dateOfBirth", date);
            }, 10);
          }
        }
      }
      // Don't clear partial dates - let user continue typing
    },
    [signupForm]
  );

  // Set up input event listener for date formatting
  useEffect(() => {
    let cleanup = null;
    let observer = null;

    // Function to attach the event listener
    const attachListener = () => {
      const datePickerInput = datePickerRef.current?.querySelector("input");
      if (datePickerInput && !datePickerInput.dataset.listenerAttached) {
        const handleInput = (e) => {
          handleDateInputChange(e);
        };

        const handleBeforeInput = (e) => {
          // Intercept before input to format as user types
          if (e.data && /^\d$/.test(e.data)) {
            // User is typing a digit
            const currentValue = e.target.value || "";
            const newValue = currentValue + e.data;
            const formatted = formatDateInput(newValue);

            // Only proceed if formatting would change the value
            if (formatted !== newValue) {
              e.preventDefault();

              // Update the value
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              )?.set;
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(e.target, formatted);
              }

              // Trigger input event
              const inputEvent = new Event("input", { bubbles: true });
              e.target.dispatchEvent(inputEvent);

              // Position cursor
              setTimeout(() => {
                e.target.setSelectionRange(formatted.length, formatted.length);
              }, 0);

              // Try to parse if complete
              if (formatted.length === 10) {
                const [day, month, year] = formatted.split("/").map(Number);
                if (day && month && year && day <= 31 && month <= 12) {
                  const date = dayjs(
                    `${year}-${String(month).padStart(2, "0")}-${String(
                      day
                    ).padStart(2, "0")}`
                  );
                  if (date.isValid() && !date.isAfter(dayjs(), "day")) {
                    setTimeout(() => {
                      signupForm.setFieldValue("dateOfBirth", date);
                    }, 10);
                  }
                }
              }
            }
          }
        };

        datePickerInput.addEventListener("input", handleInput);
        datePickerInput.addEventListener("beforeinput", handleBeforeInput);
        datePickerInput.dataset.listenerAttached = "true";

        cleanup = () => {
          datePickerInput.removeEventListener("input", handleInput);
          datePickerInput.removeEventListener("beforeinput", handleBeforeInput);
          delete datePickerInput.dataset.listenerAttached;
        };
        return true;
      }
      return false;
    };

    // Try to attach immediately
    if (!attachListener()) {
      // If input not found, use MutationObserver to watch for it
      observer = new MutationObserver(() => {
        attachListener();
      });

      if (datePickerRef.current) {
        observer.observe(datePickerRef.current, {
          childList: true,
          subtree: true,
        });
      }

      // Also try after a short delay
      const timeoutId = setTimeout(() => {
        attachListener();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (observer) observer.disconnect();
        if (cleanup) cleanup();
      };
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [handleDateInputChange, signupForm]);

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
              {t("auth.signup.title")}
            </Title>
          </Space>
          <Paragraph style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.signup.subtitle")}
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

          <Form
            form={signupForm}
            onFinish={handleSignup}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: t("auth.signup.errors.firstNameRequired") },
                {
                  min: 2,
                  message: t("auth.signup.errors.firstNameMinLength"),
                },
              ]}
            >
              <Input
                prefixIcon={<RiUserLine />}
                placeholder={t("auth.signup.firstName")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[
                { required: true, message: t("auth.signup.errors.lastNameRequired") },
                {
                  min: 2,
                  message: t("auth.signup.errors.lastNameMinLength"),
                },
              ]}
            >
              <Input
                prefixIcon={<RiUserLine />}
                placeholder={t("auth.signup.lastName")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              rules={[
                {
                  required: true,
                  message: t("auth.signup.errors.dateOfBirthRequired"),
                },
              ]}
            >
              <div ref={datePickerRef}>
                <DatePicker
                  placeholder="DD/MM/YYYY"
                  format="DD/MM/YYYY"
                  disabledDate={disabledDate}
                  className="w-full"
                  size="large"
                  style={{ width: "100%" }}
                  suffixIcon={
                    <RiCalendarLine style={{ color: "var(--color-text-secondary)" }} />
                  }
                  inputReadOnly={false}
                  onChange={(date) => {
                    // This handles both calendar selection and programmatic updates
                    signupForm.setFieldValue("dateOfBirth", date);
                  }}
                />
              </div>
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("auth.signup.errors.emailRequired") },
                {
                  type: "email",
                  message: t("auth.signup.errors.emailInvalid"),
                },
              ]}
            >
              <Input
                prefixIcon={<RiMailLine />}
                placeholder={t("auth.signup.email")}
                type="email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t("auth.signup.errors.passwordRequired") },
                {
                  min: 6,
                  message: t("auth.signup.errors.passwordMinLength"),
                },
              ]}
            >
              <Password
                prefixIcon={<RiLockLine />}
                placeholder={t("auth.signup.password")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: t("auth.signup.errors.confirmPasswordRequired"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t("auth.signup.errors.passwordsMismatch"))
                    );
                  },
                }),
              ]}
            >
              <Password
                prefixIcon={<RiLockLine />}
                placeholder={t("auth.signup.confirmPassword")}
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
                {t("auth.signup.button")}
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {t("auth.signup.hasAccount")}{" "}
                <Link
                  href="/login"
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
                  {t("auth.signup.login")}
                </Link>
              </Text>
            </div>
          </Form>
        </Card>

        {/* PWA Install Button - Floating button, only visible on mobile */}
        <PWAInstallButton />

        <div className="text-center mt-6">
          <Text className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.signup.terms")}
          </Text>
        </div>
      </div>
    </div>
  );
}
