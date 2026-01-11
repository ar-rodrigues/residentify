/// <reference path="../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * 
 * @auth {Session} User must be authenticated
 * @param {import('next/server').NextRequest} request
 * @param {string} [organization_id] - Filter by organization (query param)
 * @param {boolean} [is_read] - Filter by read status (query param)
 * @param {number} [limit=50] - Pagination limit (query param)
 * @param {number} [offset=0] - Pagination offset (query param)
 * @response 200 {Array<Notifications & { from_user_name: string }>} List of notifications and unread count
 * @response 401 {Error} Not authenticated
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function GET(request) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const isRead = searchParams.get("is_read");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        qr_code:qr_codes(
          id,
          visitor_name,
          visitor_email
        )
      `
      )
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    // Filter by read status if provided
    if (isRead !== null && isRead !== undefined) {
      query = query.eq("is_read", isRead === "true");
    }

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener las notificaciones.",
        },
        { status: 500 }
      );
    }

    // Get unique user IDs from from_user_id
    const userIds = [
      ...new Set(
        (notifications || [])
          .map((notification) => notification.from_user_id)
          .filter((id) => id !== null)
      ),
    ];

    // Fetch profiles for from_user_id users
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format response
    const formattedNotifications = (notifications || []).map((notification) => {
      const fromUserProfile = profilesMap[notification.from_user_id];
      return {
        ...notification,
        from_user_name: fromUserProfile
          ? `${fromUserProfile.first_name} ${fromUserProfile.last_name}`.trim()
          : null,
      };
    });

    // Get unread count
    let unreadCount = 0;
    if (organizationId) {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .eq("organization_id", organizationId)
        .eq("is_read", false);
      unreadCount = count || 0;
    } else {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .eq("is_read", false);
      unreadCount = count || 0;
    }

    return NextResponse.json(
      {
        error: false,
        data: formattedNotifications,
        unread_count: unreadCount,
        message: "Notificaciones obtenidas exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener las notificaciones.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a notification (security personnel only)
 * 
 * @auth {Session} User must be authenticated and have security role in the organization
 * @param {import('next/server').NextRequest} request
 * @body {Object} { organization_id: string, to_user_id: string, type: string, message: string, qr_code_id?: string, access_log_id?: string } Notification details
 * @response 201 {Notifications} Created notification
 * @response 400 {Error} Validation error or invalid type
 * @response 401 {Error} Not authenticated
 * @response 403 {Error} Not authorized (security only)
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function POST(request) {
  try {
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

    // Parse request body
    const body = await request.json();
    const {
      organization_id,
      to_user_id,
      type,
      message,
      qr_code_id = null,
      access_log_id = null,
    } = body;

    // Validate required fields
    if (!organization_id || typeof organization_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de organización es requerido.",
        },
        { status: 400 }
      );
    }

    if (!to_user_id || typeof to_user_id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "ID de usuario destinatario es requerido.",
        },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Tipo de notificación es requerido.",
        },
        { status: 400 }
      );
    }

    const validTypes = ["visitor_arrived", "visitor_left", "qr_invalid", "custom"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: true,
          message: "Tipo de notificación inválido.",
        },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "El mensaje es requerido.",
        },
        { status: 400 }
      );
    }

    // Check if user is security personnel
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        organization_roles!inner(
          name
        )
      `
      )
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .eq("organization_roles.name", "security")
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No tienes permisos para crear notificaciones. Debes ser personal de seguridad.",
        },
        { status: 403 }
      );
    }

    // Create notification
    const { data: notification, error: createError } = await supabase
      .from("notifications")
      .insert({
        organization_id,
        qr_code_id,
        access_log_id,
        from_user_id: user.id,
        to_user_id,
        type,
        message: message.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating notification:", createError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al crear la notificación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: notification,
        message: "Notificación creada exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating notification:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al crear la notificación.",
      },
      { status: 500 }
    );
  }
}

