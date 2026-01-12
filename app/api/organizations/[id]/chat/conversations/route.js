import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeFullName } from "@/utils/name";

/**
 * @swagger
 * /api/organizations/{id}/chat/conversations:
 *   get:
 *     summary: Get chat conversations
 *     description: Get chat conversations for the current user in an organization. Includes both user-to-user and user-to-role conversations.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Pagination limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         conversations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               type: { type: string, enum: [user, role] }
 *                               otherUserId: { type: string, format: uuid, nullable: true }
 *                               otherUserName: { type: string, nullable: true }
 *                               otherUserAvatar: { type: string, nullable: true }
 *                               lastMessage: { type: string, nullable: true }
 *                               lastMessageTime: { type: string, format: date-time, nullable: true }
 *                               unreadCount: { type: integer }
 *                               lastMessageSenderId: { type: string, format: uuid, nullable: true }
 *                               isReadOnly: { type: boolean }
 *                         total: { type: integer }
 *                         hasMore: { type: boolean }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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

    // Get user-to-user conversations
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

    // Get role conversations where user is the initiator
    const { data: roleConversationsAsInitiator, error: roleConvError } =
      await supabase
        .from("chat_conversations")
        .select(
          `
          id,
          role_id,
          status,
          updated_at,
          organization_roles!inner(name)
        `
        )
        .eq("organization_id", id)
        .eq("user1_id", user.id)
        .is("user2_id", null)
        .not("role_id", "is", null)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(limit);

    if (roleConvError) {
      console.error("Error fetching role conversations as initiator:", roleConvError);
      // Don't fail, just log the error
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

    // Transform role conversations where user is initiator
    const transformedRoleConversations = await Promise.all(
      (roleConversationsAsInitiator || []).map(async (conv) => {
        // Get last message and unread count for this conversation
        const { data: messages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("content, created_at, sender_id, is_read, recipient_id")
          .eq("conversation_id", conv.id)
          .eq("organization_id", id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastMessage = messages && messages.length > 0 ? messages[0] : null;

        // Count unread messages (messages from role members where recipient_id = user.id)
        const { count: unreadCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("organization_id", id)
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        return {
          id: conv.id,
          type: "role",
          roleId: conv.role_id,
          roleName: conv.organization_roles?.name,
          otherUserId: null, // Role conversations don't have a specific other user
          otherUserName: conv.organization_roles?.name || "Rol",
          otherUserAvatar: null,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: lastMessage?.created_at || null,
          unreadCount: unreadCount || 0,
          lastMessageSenderId: lastMessage?.sender_id || null,
          status: conv.status,
        };
      })
    );

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
          type: "user", // User-to-user conversation
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

    // Combine user-to-user and role conversations
    const allConversations = [...transformedConversations, ...transformedRoleConversations];

    // Filter conversations by permissions - check both directions in parallel for performance
    // Show conversation if either direction is allowed, but track canSend and canReceive separately
    // Role conversations are already filtered (user is initiator), so skip permission checks for them
    const permissionChecks = await Promise.all(
      allConversations.map(async (conv) => {
        // Skip permission check for role conversations (already validated)
        if (conv.type === "role") {
          return {
            conv,
            canSend: true, // Initiator can always send to role
            canReceive: true, // Can receive from role members
            canSee: true,
          };
        }
        // Check if current user can message other user (can send)
        const { data: canSend, error: sendError } = await supabase.rpc(
          "can_user_message_user",
          {
            p_sender_id: user.id,
            p_recipient_id: conv.otherUserId,
            p_organization_id: id,
          }
        );

        // Check if other user can message current user (can receive)
        const { data: canReceive, error: receiveError } = await supabase.rpc(
          "can_user_message_user",
          {
            p_sender_id: conv.otherUserId,
            p_recipient_id: user.id,
            p_organization_id: id,
          }
        );

        return {
          conv,
          canSend: !sendError && (canSend || false),
          canReceive: !receiveError && (canReceive || false),
          canSee: (!sendError && (canSend || false)) || (!receiveError && (canReceive || false)), // Show if either direction is allowed
        };
      })
    );

    // Filter conversations where at least one direction is allowed
    const validConversations = permissionChecks
      .filter(({ canSee }) => canSee)
      .map(({ conv, canSend, canReceive }) => ({
        ...conv,
        canSend,
        canReceive,
        isReadOnly: canReceive && !canSend, // Can receive but not send
      }));

    return NextResponse.json(
      {
        error: false,
        data: {
          conversations: validConversations,
          total: validConversations.length,
          hasMore: false, // Note: total count may not be accurate after filtering, so hasMore is set to false
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
