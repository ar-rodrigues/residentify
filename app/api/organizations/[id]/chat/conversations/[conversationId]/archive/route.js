import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/organizations/[id]/chat/conversations/[conversationId]/archive
 * Archive a resolved conversation
 */
export async function POST(request, { params }) {
  try {
    const { id, conversationId } = await params;
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

    // Archive conversation
    const { data: success, error: archiveError } = await supabase.rpc(
      "archive_conversation",
      {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      }
    );

    if (archiveError) {
      console.error("Error archiving conversation:", archiveError);
      return NextResponse.json(
        {
          error: true,
          message:
            archiveError.message || "Error al archivar la conversación.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          success,
        },
        message: "Conversación archivada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error archiving conversation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al archivar la conversación.",
      },
      { status: 500 }
    );
  }
}
