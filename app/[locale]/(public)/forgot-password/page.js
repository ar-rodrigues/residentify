import { Suspense } from "react";
import { Card, Typography } from "antd";
import ForgotPasswordForm from "./ForgotPasswordForm";

const { Title } = Typography;

// Force dynamic rendering since we use search params
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background: "linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-elevated))",
          }}
        >
          <div className="w-full max-w-md">
            <Card>
              <div className="text-center py-8">
                <Title level={3} style={{ color: "var(--color-text-primary)" }}>
                  Cargando...
                </Title>
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
