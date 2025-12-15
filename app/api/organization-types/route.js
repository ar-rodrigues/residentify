import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organization-types
 * Get all available organization types (public read access)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all organization types
    // RLS policy allows everyone to read organization types
    const { data: types, error } = await supabase
      .from("organization_types")
      .select("id, name, description")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching organization types:", error);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener los tipos de organización.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: types || [],
        message: "Tipos de organización obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching organization types:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener los tipos de organización.",
      },
      { status: 500 }
    );
  }
}











