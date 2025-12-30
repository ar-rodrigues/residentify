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
    const {
      recipientId,
      conversationId: providedConversationId,
      roleId,
      content,
    } = body;

    // Validate input
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
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

    let finalConversationId;
    let finalRecipientId;
    let isRoleConversation = false;

    // Handle role conversation (either via conversationId or roleId)
    if (providedConversationId || roleId) {
      isRoleConversation = true;

      if (providedConversationId) {
        // Using existing conversation
        const { data: conversation, error: convFetchError } = await supabase
          .from("chat_conversations")
          .select("id, user1_id, role_id, organization_id")
          .eq("id", providedConversationId)
          .eq("organization_id", id)
          .is("user2_id", null)
          .not("role_id", "is", null)
          .single();

        if (convFetchError || !conversation) {
          return NextResponse.json(
            {
              error: true,
              message: "Conversación de rol no encontrada.",
            },
            { status: 404 }
          );
        }

        finalConversationId = conversation.id;

        // Check if user is part of this conversation
        const isInitiator = conversation.user1_id === user.id;
        let isRoleMember = false;

        if (!isInitiator && conversation.role_id) {
          const { data: roleMemberCheck } = await supabase
            .from("organization_members")
            .select("id")
            .eq("organization_id", id)
            .eq("user_id", user.id)
            .eq("organization_role_id", conversation.role_id)
            .single();

          isRoleMember = !!roleMemberCheck;
        }

        if (!isInitiator && !isRoleMember) {
          return NextResponse.json(
            {
              error: true,
              message: "No tienes acceso a esta conversación.",
            },
            { status: 403 }
          );
        }

        // Set recipient based on who is sending
        if (isInitiator) {
          // User sending to role: recipient_id is null (role is not a specific user)
          finalRecipientId = null;
        } else {
          // Role member responding: recipient_id is the user who started the conversation
          finalRecipientId = conversation.user1_id;
        }

        // If user is the initiator, check permissions to message the role
        if (isInitiator) {
          const { data: canMessage, error: permissionError } =
            await supabase.rpc("can_user_message_role", {
              p_user_id: user.id,
              p_role_id: conversation.role_id,
              p_organization_id: id,
            });

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
                message: "No tienes permiso para enviar mensajes a este rol.",
              },
              { status: 403 }
            );
          }
        }
        // If user is a role member, they can always respond (no permission check needed)
      } else if (roleId) {
        // Creating new role conversation
        // Check permissions
        const { data: canMessage, error: permissionError } = await supabase.rpc(
          "can_user_message_role",
          {
            p_user_id: user.id,
            p_role_id: roleId,
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
              message: "No tienes permiso para enviar mensajes a este rol.",
            },
            { status: 403 }
          );
        }

        // Get or create role conversation
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "messages/route.js:205",
              message: "Before calling get_or_create_role_conversation",
              data: { userId: user.id, roleId, organizationId: id },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion
        const { data: newConversationId, error: convError } =
          await supabase.rpc("get_or_create_role_conversation", {
            p_user_id: user.id,
            p_role_id: roleId,
            p_organization_id: id,
          });
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "messages/route.js:215",
              message: "After calling get_or_create_role_conversation",
              data: {
                newConversationId,
                convError: convError
                  ? {
                      code: convError.code,
                      message: convError.message,
                      details: convError.details,
                    }
                  : null,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion

        if (convError || !newConversationId) {
          console.error("Error getting/creating role conversation:", convError);
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "messages/route.js:218",
                message: "Error in get_or_create_role_conversation",
                data: {
                  convError: convError
                    ? {
                        code: convError.code,
                        message: convError.message,
                        details: convError.details,
                        hint: convError.hint,
                      }
                    : null,
                  newConversationId,
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
          return NextResponse.json(
            {
              error: true,
              message: "Error al obtener o crear la conversación de rol.",
            },
            { status: 500 }
          );
        }

        finalConversationId = newConversationId;
        finalRecipientId = null; // User sending to role: recipient_id is null
      }
    } else {
      // Handle user-to-user conversation
      if (!recipientId || typeof recipientId !== "string") {
        return NextResponse.json(
          {
            error: true,
            message:
              "El ID del destinatario o el ID de conversación es requerido.",
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
      const { data: newConversationId, error: convError } = await supabase.rpc(
        "get_or_create_conversation",
        {
          p_user1_id: user.id,
          p_user2_id: recipientId,
          p_organization_id: id,
        }
      );

      if (convError || !newConversationId) {
        console.error("Error getting/creating conversation:", convError);
        return NextResponse.json(
          {
            error: true,
            message: "Error al obtener o crear la conversación.",
          },
          { status: 500 }
        );
      }

      finalConversationId = newConversationId;
      finalRecipientId = recipientId;
    }

    // Create message
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages/route.js:395",
        message: "Before inserting message",
        data: {
          finalConversationId,
          isRoleConversation,
          finalRecipientId,
          hasRecipientId: finalRecipientId !== null,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run2",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: finalConversationId,
        organization_id: id,
        sender_id: user.id,
        recipient_id: finalRecipientId, // null for role conversations when user sends to role
        content: content.trim(),
      })
      .select()
      .single();
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "messages/route.js:407",
        message: "After inserting message",
        data: {
          messageId: message?.id,
          messageError: messageError
            ? {
                code: messageError.code,
                message: messageError.message,
                details: messageError.details,
              }
            : null,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run2",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion

    if (messageError) {
      console.error("Error creating message:", messageError);
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "messages/route.js:409",
            message: "Error creating message",
            data: {
              messageError: messageError
                ? {
                    code: messageError.code,
                    message: messageError.message,
                    details: messageError.details,
                    hint: messageError.hint,
                  }
                : null,
              finalRecipientId,
              isRoleConversation,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run2",
            hypothesisId: "B",
          }),
        }
      ).catch(() => {});
      // #endregion
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
          conversationId: finalConversationId,
          isRoleConversation,
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
