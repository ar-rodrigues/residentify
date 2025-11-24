import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-800">
                  Cargando...
                </h3>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
