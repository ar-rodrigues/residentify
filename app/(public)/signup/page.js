"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

const { Title, Paragraph, Text } = Typography;

export default function SignupPage() {
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
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
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
              Crear Cuenta
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            Completa el formulario para crear tu cuenta
          </Paragraph>
        </Space>

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
            form={signupForm}
            onFinish={handleSignup}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: "Por favor ingresa tu nombre" },
                {
                  min: 2,
                  message: "El nombre debe tener al menos 2 caracteres",
                },
              ]}
            >
              <Input
                prefixIcon={<RiUserLine />}
                placeholder="Nombre"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[
                { required: true, message: "Por favor ingresa tu apellido" },
                {
                  min: 2,
                  message: "El apellido debe tener al menos 2 caracteres",
                },
              ]}
            >
              <Input
                prefixIcon={<RiUserLine />}
                placeholder="Apellido"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              rules={[
                {
                  required: true,
                  message: "Por favor ingresa tu fecha de nacimiento",
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
                  suffixIcon={<RiCalendarLine className="text-gray-400" />}
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
                { required: true, message: "Por favor ingresa tu email" },
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
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Por favor ingresa tu contraseña" },
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
                placeholder="Confirmar Contraseña"
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
                style={{ backgroundColor: "#16a34a" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#15803d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#16a34a";
                }}
              >
                Crear Cuenta
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary" className="text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Inicia sesión
                </Link>
              </Text>
            </div>
          </Form>
        </Card>

        <div className="text-center mt-6">
          <Text type="secondary" className="text-sm">
            Al crear una cuenta, aceptas nuestros términos y condiciones
          </Text>
        </div>
      </div>
    </div>
  );
}
