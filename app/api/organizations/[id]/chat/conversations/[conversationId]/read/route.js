import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/organizations/[id]/chat/conversations/[conversationId]/read
 * Mark all unread messages in a conversation as read
 */
export async function PUT(request, { params }) {
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

    // Verify user is a participant in the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("chat_conversations")
      .select("id, user1_id, user2_id")
      .eq("id", conversationId)
      .eq("organization_id", id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        {
          error: true,
          message: "Conversación no encontrada.",
        },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (
      conversation.user1_id !== user.id &&
      conversation.user2_id !== user.id
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres participante de esta conversación.",
        },
        { status: 403 }
      );
    }

    // Mark all unread messages in this conversation as read
    const { error: updateError } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("organization_id", id)
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (updateError) {
      console.error("Error marking messages as read:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al marcar los mensajes como leídos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Mensajes marcados como leídos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error marking messages as read:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al marcar los mensajes como leídos.",
      },
      { status: 500 }
    );
  }
}

