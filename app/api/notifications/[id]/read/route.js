import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notifications'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Validate notification ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de notificación inválido.",
        },
        { status: 400 }
      );
    }

    // Verify user owns this notification
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("to_user_id", user.id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        {
          error: true,
          message: "Notificación no encontrada o no tienes permisos para marcarla como leída.",
        },
        { status: 404 }
      );
    }

    // Update notification
    const { data: updatedNotification, error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating notification:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al actualizar la notificación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: updatedNotification,
        message: "Notificación marcada como leída.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error updating notification:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al actualizar la notificación.",
      },
      { status: 500 }
    );
  }
}



