import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Force dynamic rendering since we use search params
export const dynamic = "force-dynamic";

export default function LoginPage() {
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
            <div
              className="rounded-lg shadow-lg p-8"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="text-center py-8">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Loading...
                </h3>
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
