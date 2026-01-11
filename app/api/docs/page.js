import { redirect } from "next/navigation";

/**
 * Page component for API documentation
 * Redirects to the HTML route handler that renders Scalar
 */
export default function ApiDocsPage() {
  // Check if running in development mode
  const isDevelopment =
    process.env.DEVELOPMENT === "true" ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === "true" ||
    process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    redirect("/");
    return null;
  }

  // Redirect to the HTML route handler
  redirect("/api/docs/html");
  return null;
}
