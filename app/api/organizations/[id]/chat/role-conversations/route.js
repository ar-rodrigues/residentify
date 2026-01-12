import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeFullName } from "@/utils/name";

/**
 * @swagger
 * /api/organizations/{id}/chat/role-conversations:
 *   get:
 *     summary: Get role conversations
 *     description: Get chat conversations where the current user is a role member responding to other users.
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
 *           default: 50
 *         description: Pagination limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of role conversations
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
 *                         roleConversations: { type: array, items: { type: object } }
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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
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

    // Get role conversations using the function
    const { data: roleConversations, error: conversationsError } =
      await supabase.rpc("get_role_conversations_for_role_member", {
        p_user_id: user.id,
        p_organization_id: id,
        p_limit: limit,
        p_offset: offset,
      });

    if (conversationsError) {
      console.error("Error fetching role conversations:", conversationsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener las conversaciones de rol.",
        },
        { status: 500 }
      );
    }

    // Transform and enrich the response
    const transformedConversations = await Promise.all(
      (roleConversations || []).map(async (conv) => {
        let userName = conv.user_name || null;

        // If name is missing or empty, try to fetch it
        if (!userName && conv.user_id) {
          try {
            const { data: fetchedName, error: rpcError } = await supabase.rpc(
              "get_user_name",
              {
                p_user_id: conv.user_id,
              }
            );

            if (
              !rpcError &&
              fetchedName &&
              typeof fetchedName === "string" &&
              fetchedName.trim()
            ) {
              userName = normalizeFullName(
                fetchedName.split(" ")[0] || "",
                fetchedName.split(" ").slice(1).join(" ") || ""
              );
            }
          } catch (err) {
            console.error(
              `Error fetching user name for role conversation ${conv.conversation_id}:`,
              err
            );
          }
        }

        // Get sender name for last message
        let lastMessageSenderName = null;
        if (conv.last_message_sender_id) {
          try {
            const { data: senderName, error: senderError } = await supabase.rpc(
              "get_user_name",
              {
                p_user_id: conv.last_message_sender_id,
              }
            );

            if (
              !senderError &&
              senderName &&
              typeof senderName === "string" &&
              senderName.trim()
            ) {
              lastMessageSenderName = normalizeFullName(
                senderName.split(" ")[0] || "",
                senderName.split(" ").slice(1).join(" ") || ""
              );
            }
          } catch (err) {
            // Silently fail
          }
        }

        return {
          id: conv.conversation_id,
          type: "role",
          userId: conv.user_id,
          userName: userName || "Usuario",
          roleId: conv.role_id,
          roleName: conv.role_name,
          lastMessage: conv.last_message_content || null,
          lastMessageTime: conv.last_message_at || null,
          unreadCount: conv.unread_count || 0,
          lastMessageSenderId: conv.last_message_sender_id || null,
          lastMessageSenderName: lastMessageSenderName,
          canSend: true, // Role members can always send
          canReceive: true,
        };
      })
    );

    const filteredConversations = transformedConversations;

    return NextResponse.json(
      {
        error: false,
        data: {
          roleConversations: filteredConversations,
          total: filteredConversations.length,
          hasMore: false,
        },
        message: "Conversaciones de rol obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching role conversations:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las conversaciones de rol.",
      },
      { status: 500 }
    );
  }
}
