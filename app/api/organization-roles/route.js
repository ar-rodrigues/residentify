import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organization-roles
 * Get all organization roles (public read access)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all organization roles
    // RLS policy allows everyone to read organization roles
    const { data: roles, error } = await supabase
      .from("organization_roles")
      .select("id, name, description")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching organization roles:", error);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los roles de organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: roles || [],
        message: "Roles obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization roles:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los roles de organización.",
      },
      { status: 500 }
    );
  }
}

