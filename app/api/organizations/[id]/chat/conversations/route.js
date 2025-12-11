import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeFullName } from "@/utils/name";

/**
 * GET /api/organizations/[id]/chat/conversations
 * Get conversations for current user in organization with pagination
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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

    // Use the function to get conversations with metadata
    const { data: conversations, error: conversationsError } =
      await supabase.rpc("get_user_conversations_with_metadata", {
        p_user_id: user.id,
        p_organization_id: id,
        p_limit: limit,
        p_offset: offset,
      });

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener las conversaciones.",
        },
        { status: 500 }
      );
    }

    // Get total count of conversations
    const { count, error: countError } = await supabase
      .from("chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (countError) {
      console.error("Error counting conversations:", countError);
    }

    // Transform RPC response from snake_case to camelCase for frontend
    // The RPC returns: conversation_id, other_user_id, other_user_name, last_message_content, last_message_at, unread_count, last_message_sender_id
    // Also fetch missing names using the same approach as members API
    const transformedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Handle both possible column names from RPC (depending on PostgreSQL version/configuration)
        const conversationId = conv.conversation_id || conv.conv_id;
        const otherUserId = conv.other_user_id || conv.other_user;
        let otherUserName =
          conv.other_user_name !== undefined && conv.other_user_name !== null
            ? conv.other_user_name.trim() || null
            : null;

        // If name is missing or empty, try to fetch it using get_user_name RPC (same as members API)
        if (!otherUserName && otherUserId) {
          try {
            const { data: userName, error: rpcError } = await supabase.rpc(
              "get_user_name",
              {
                p_user_id: otherUserId,
              }
            );

            if (
              !rpcError &&
              userName &&
              typeof userName === "string" &&
              userName.trim()
            ) {
              // RPC returns a string, normalize it
              otherUserName = normalizeFullName(
                userName.split(" ")[0] || "",
                userName.split(" ").slice(1).join(" ") || ""
              );
            }
          } catch (err) {
            console.error(
              `Error fetching user name for conversation ${conversationId}:`,
              err
            );
            // Continue without name if there's an error
          }
        }

        const lastMessage =
          conv.last_message_content || conv.last_msg_content || null;
        const lastMessageTime =
          conv.last_message_at || conv.last_msg_at || null;
        const unreadCount = conv.unread_count || 0;
        const lastMessageSenderId =
          conv.last_message_sender_id || conv.last_msg_sender_id || null;

        return {
          id: conversationId,
          otherUserId: otherUserId,
          otherUserName: otherUserName,
          otherUserAvatar: conv.other_user_avatar || null,
          lastMessage: lastMessage,
          lastMessageTime: lastMessageTime,
          unreadCount: unreadCount,
          lastMessageSenderId: lastMessageSenderId,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: {
          conversations: transformedConversations,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
        message: "Conversaciones obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching conversations:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las conversaciones.",
      },
      { status: 500 }
    );
  }
}
