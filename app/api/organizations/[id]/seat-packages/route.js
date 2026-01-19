/// <reference path="../../../../../types/database.types.js" />

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @swagger
 * /api/organizations/{id}/seat-packages:
 *   get:
 *     summary: List organization seat packages and limits
 *     tags: [Organizations]
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Admins only
    const { data: isAdmin } = await supabase.rpc("has_permission", {
      p_user_id: user.id,
      p_org_id: id,
      p_permission_code: "org:update",
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: true, message: "No tienes permiso para ver esta información." },
        { status: 403 }
      );
    }

    const [packagesResult, limitResult, currentResult] = await Promise.all([
      supabase
        .from("seat_packages")
        .select("*")
        .eq("organization_id", id)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_org_seat_limit", { p_org_id: id }),
      supabase
        .from("seats")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", id)
        .eq("is_chargeable", true)
    ]);

    return NextResponse.json({
      error: false,
      data: {
        packages: packagesResult.data || [],
        total_limit: limitResult.data || 0,
        current_usage: currentResult.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: true, message: "Error inesperado." },
      { status: 500 }
    );
  }
}
