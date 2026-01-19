/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * @swagger
 * /api/organizations/{id}/seats:
 *   get:
 *     summary: List organization seats
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of seats
 */
export async function GET(request, { params }) {
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
        { error: true, message: "No estás autenticado." },
        { status: 401 }
      );
    }

    // Check permission
    const { data: hasPermission } = await supabase.rpc("has_permission", {
      p_user_id: user.id,
      p_org_id: id,
      p_permission_code: "members:view",
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: true, message: "No tienes permiso para ver los asientos." },
        { status: 403 }
      );
    }

    const { data: seats, error } = await supabase
      .from("seats")
      .select("*, seat_types(*)")
      .eq("organization_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: true, message: "Error al obtener asientos." },
        { status: 500 }
      );
    }

    // Add is_frozen info
    const seatsWithStatus = await Promise.all(
      seats.map(async (seat) => {
        const { data: isFrozen } = await supabase.rpc("is_seat_frozen", {
          p_seat_id: seat.id,
        });
        
        // Get currently assigned members
        const { count: memberCount } = await supabase
          .from("organization_members")
          .select("*", { count: 'exact', head: true })
          .eq("seat_id", seat.id);

        return { ...seat, is_frozen: isFrozen, member_count: memberCount };
      })
    );

    return NextResponse.json({
      error: false,
      data: seatsWithStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: true, message: "Error inesperado." },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/organizations/{id}/seats:
 *   post:
 *     summary: Create a new seat
 *     tags: [Organizations]
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { name, seat_type_id, capacity } = body;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: true, message: "No estás autenticado." },
        { status: 401 }
      );
    }

    const { data: hasPermission } = await supabase.rpc("has_permission", {
      p_user_id: user.id,
      p_org_id: id,
      p_permission_code: "members:manage",
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: true, message: "No tienes permiso para crear asientos." },
        { status: 403 }
      );
    }

    // Check organization limit
    const { data: limit } = await supabase.rpc("get_org_seat_limit", {
      p_org_id: id,
    });
    
    const { count: currentSeats } = await supabase
      .from("seats")
      .select("*", { count: 'exact', head: true })
      .eq("organization_id", id)
      .eq("is_chargeable", true);

    // We allow creation even beyond limit, but it will be frozen automatically by the system logic
    // However, for UX we might want to warn or prevent if it's not desirable.
    // The instructions say: "Frozen seats block new user assignments... block seat modifications"
    
    const { data: seat, error } = await supabase
      .from("seats")
      .insert({
        organization_id: id,
        name,
        seat_type_id,
        capacity: capacity || 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: true, message: "Error al crear asiento." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      error: false,
      data: seat,
      message: "Asiento creado exitosamente.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: true, message: "Error inesperado." },
      { status: 500 }
    );
  }
}
