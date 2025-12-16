import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/organizations/[id]/chat/messages
 * Send a message
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    // Parse request body
    const body = await request.json();
    const { recipientId, content } = body;

    // Validate input
    if (!recipientId || typeof recipientId !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "El ID del destinatario es requerido.",
        },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "El contenido del mensaje es requerido.",
        },
        { status: 400 }
      );
    }

    if (content.trim().length > 5000) {
      return NextResponse.json(
        {
          error: true,
          message: "El mensaje no puede tener más de 5000 caracteres.",
        },
        { status: 400 }
      );
    }

    // Check if recipient is member of organization
    const { data: recipientMemberCheck, error: recipientMemberError } =
      await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", id)
        .eq("user_id", recipientId)
        .single();

    if (recipientMemberError || !recipientMemberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "El destinatario no es miembro de esta organización.",
        },
        { status: 404 }
      );
    }

    // Check permissions using the function
    const { data: canMessage, error: permissionError } = await supabase.rpc(
      "can_user_message_user",
      {
        p_sender_id: user.id,
        p_recipient_id: recipientId,
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

    if (!canMessage) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permiso para enviar mensajes a este usuario.",
        },
        { status: 403 }
      );
    }

    // Get or create conversation
    const { data: conversationId, error: convError } = await supabase.rpc(
      "get_or_create_conversation",
      {
        p_user1_id: user.id,
        p_user2_id: recipientId,
        p_organization_id: id,
      }
    );

    if (convError || !conversationId) {
      console.error("Error getting/creating conversation:", convError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener o crear la conversación.",
        },
        { status: 500 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        organization_id: id,
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al enviar el mensaje.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          message: {
            id: message.id,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            content: message.content,
            isRead: message.is_read,
            createdAt: message.created_at,
          },
          conversationId,
        },
        message: "Mensaje enviado exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error sending message:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al enviar el mensaje.",
      },
      { status: 500 }
    );
  }
}










