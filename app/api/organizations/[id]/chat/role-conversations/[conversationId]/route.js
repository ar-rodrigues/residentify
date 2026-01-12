import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeFullName } from "@/utils/name";

/**
 * @swagger
 * /api/organizations/{id}/chat/role-conversations/{conversationId}:
 *   get:
 *     summary: Get role conversation details
 *     description: Get details of a specific role conversation.
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
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation details
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
 *                         conversation: { type: object }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request, { params }) {
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
      .select("id, organization_role_id")
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

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("organization_id", id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        {
          error: true,
          message: "Conversación no encontrada.",
        },
        { status: 404 }
      );
    }

    // Verify it's a role conversation
    if (!conversation.role_id) {
      return NextResponse.json(
        {
          error: true,
          message: "Esta no es una conversación de rol.",
        },
        { status: 400 }
      );
    }

    // Verify user has access (either as the user who started it or as a role member)
    const isInitiator = conversation.user1_id === user.id;
    const isRoleMember =
      memberCheck.organization_role_id === conversation.role_id;

    if (!isInitiator && !isRoleMember) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes acceso a esta conversación.",
        },
        { status: 403 }
      );
    }

    // Get user name
    let userName = null;
    if (conversation.user1_id) {
      try {
        const { data: fetchedName, error: rpcError } = await supabase.rpc(
          "get_user_name",
          {
            p_user_id: conversation.user1_id,
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
        // Silently fail
      }
    }

    // Get role name
    const { data: role, error: roleError } = await supabase
      .from("organization_roles")
      .select("name")
      .eq("id", conversation.role_id)
      .single();

    return NextResponse.json(
      {
        error: false,
        data: {
          conversation: {
            id: conversation.id,
            type: "role",
            userId: conversation.user1_id,
            userName: userName || "Usuario",
            roleId: conversation.role_id,
            roleName: role?.name || null,
            status: conversation.status || "active",
            archivedAt: conversation.archived_at,
            archivedBy: conversation.archived_by,
            canSend: isRoleMember || isInitiator,
            canReceive: true,
          },
        },
        message: "Conversación obtenida exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching role conversation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener la conversación.",
      },
      { status: 500 }
    );
  }
}
