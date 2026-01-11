import { NextResponse } from "next/server";

/**
 * GET /api/docs/openapi
 * Fetches OpenAPI specification from Supabase PostgREST endpoint
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

    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Supabase configuration is missing. Please check your environment variables.",
        },
        { status: 500 }
      );
    }

    // Construct PostgREST OpenAPI endpoint
    // PostgREST serves OpenAPI spec at the root with Accept header
    const postgrestUrl = `${supabaseUrl}/rest/v1/`;

    // Fetch OpenAPI specification from Supabase PostgREST
    const response = await fetch(postgrestUrl, {
      method: "GET",
      headers: {
        Accept: "application/openapi+json",
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Error fetching OpenAPI spec from Supabase:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        {
          error: true,
          message: `Failed to fetch OpenAPI specification from Supabase: ${response.statusText}`,
        },
        { status: 503 }
      );
    }

    const openApiSpec = await response.json();

    // Return the OpenAPI specification
    return NextResponse.json(openApiSpec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Unexpected error fetching OpenAPI spec:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la especificación OpenAPI.",
      },
      { status: 500 }
    );
  }
}
