import { NextResponse } from "next/server";
import { ApiReference } from "@scalar/nextjs-api-reference";

/**
 * GET /api/docs/html
 * Renders Scalar API Reference as HTML
 * Only accessible in development mode
 */
export async function GET() {
  try {
    // Check if running in development mode
    const isDevelopment =
      process.env.DEVELOPMENT === "true" ||
      process.env.NEXT_PUBLIC_DEVELOPMENT === "true" ||
      process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      return NextResponse.json(
        {
          error: true,
          message: "API documentation is only available in development mode.",
        },
        { status: 403 }
      );
    }

    // Get the base URL for the OpenAPI endpoint
    // Use getBaseUrl utility if available, otherwise construct from environment
    let baseUrl = "http://localhost:3000";
    if (process.env.WEBSITE_URL) {
      baseUrl = process.env.WEBSITE_URL;
    } else if (
      process.env.DEVELOPMENT === "true" ||
      process.env.NEXT_PUBLIC_DEVELOPMENT === "true"
    ) {
      baseUrl = "http://localhost:3000";
    }
    const openApiUrl = `${baseUrl}/api/docs/openapi`;

    // Create Scalar API Reference handler
    const apiReference = ApiReference({
      spec: {
        url: openApiUrl,
      },
      theme: "default",
      layout: "modern",
      hideDownloadButton: false,
      hideModels: false,
      hideSidebar: false,
    });

    // Call the handler to get the HTML response
    return apiReference();
  } catch (error) {
    console.error("Unexpected error rendering API documentation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al renderizar la documentación de la API.",
      },
      { status: 500 }
    );
  }
}
