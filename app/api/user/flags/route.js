/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserFlags } from "@/utils/featureFlags";

/**
 * GET /api/user/flags
 * Get all feature flags with enabled status for current authenticated user
 * 
 * @auth {Session} User must be authenticated
 * @response 200 {Object} { flags: Record<string, boolean> } Feature flags status
 * @response 401 {Error} Not authenticated
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: true,
          message: "No estás autenticado. Por favor, inicia sesión.",
        },
        { status: 401 }
      );
    }

    // Get user flags using utility function
    const flags = await getUserFlags(user.id);

    return NextResponse.json(
      {
        error: false,
        data: {
          flags: flags,
        },
        message: "Banderas obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching user flags:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las banderas.",
      },
      { status: 500 }
    );
  }
}




