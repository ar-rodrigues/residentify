import { redirect } from "next/navigation";

/**
 * Page component for Code API documentation
 * Redirects to the route handler that renders the documentation
 */
export default function CodeDocsPage() {
  // Check if running in development mode
  const isDevelopment =
    process.env.DEVELOPMENT === "true" ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === "true" ||
    process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    redirect("/");
    return null;
  }

  // Redirect to the route handler
  redirect("/api/docs/code/html");
  return null;
}
