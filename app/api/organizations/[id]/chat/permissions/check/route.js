import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/organizations/[id]/chat/permissions/check?userId=[userId]
 * Check if current user can message a specific user
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: true,
          message: "El parámetro userId es requerido.",
        },
        { status: 400 }
      );
    }

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

    // Check if user is member of organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres miembro de esta organización.",
        },
        { status: 403 }
      );
    }

    // Check permissions using the function
    const { data: canMessage, error: permissionError } = await supabase.rpc(
      "can_user_message_user",
      {
        p_sender_id: user.id,
        p_recipient_id: userId,
        p_organization_id: id,
      }
    );

    if (permissionError) {
      console.error("Error checking permissions:", permissionError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al verificar los permisos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          canMessage: canMessage || false,
        },
        message: "Permisos verificados exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error checking permissions:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al verificar los permisos.",
      },
      { status: 500 }
    );
  }
}















