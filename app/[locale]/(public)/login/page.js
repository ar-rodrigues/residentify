import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Force dynamic rendering since we use search params
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-800">Loading...</h3>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
