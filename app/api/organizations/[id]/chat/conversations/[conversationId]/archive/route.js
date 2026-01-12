import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organizations/{id}/chat/conversations/{conversationId}/archive:
 *   post:
 *     summary: Archive a conversation
 *     description: Archive a specific chat conversation.
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
 *         description: Conversation archived
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
 *                         success: { type: boolean }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
