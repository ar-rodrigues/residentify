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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card>
              <div className="text-center py-8">
                <Title level={3}>Cargando...</Title>
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
