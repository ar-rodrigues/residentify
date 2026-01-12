import { NextResponse } from "next/server";
import { getOpenAPISpec } from "@/utils/swagger/generator";

/**
 * GET /api/docs/api/openapi
 * Generates OpenAPI 3.1 specification from swagger-jsdoc annotations
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

    // Generate OpenAPI specification
    const spec = getOpenAPISpec();

    // Return the OpenAPI specification
    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Unexpected error generating OpenAPI spec:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al generar la especificación OpenAPI.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
