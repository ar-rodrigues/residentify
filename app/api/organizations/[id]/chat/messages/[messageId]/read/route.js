import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/organizations/[id]/chat/messages/[messageId]/read
 * Mark message as read
 */
export async function PUT(request, { params }) {
  try {
    const { id, messageId } = await params;
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

    // Get message to verify recipient
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select("id, recipient_id, is_read")
      .eq("id", messageId)
      .eq("organization_id", id)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        {
          error: true,
          message: "Mensaje no encontrado.",
        },
        { status: 404 }
      );
    }

    // Check if user is the recipient
    if (message.recipient_id !== user.id) {
      return NextResponse.json(
        {
          error: true,
          message: "Solo el destinatario puede marcar el mensaje como leído.",
        },
        { status: 403 }
      );
    }

    // If already read, return success
    if (message.is_read) {
      return NextResponse.json(
        {
          error: false,
          message: "Mensaje ya estaba marcado como leído.",
        },
        { status: 200 }
      );
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("id", messageId)
      .eq("recipient_id", user.id);

    if (updateError) {
      console.error("Error marking message as read:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al marcar el mensaje como leído.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Mensaje marcado como leído exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error marking message as read:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al marcar el mensaje como leído.",
      },
      { status: 500 }
    );
  }
}























