import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeFullName, normalizeName } from "@/utils/name";

/**
 * GET /api/organizations/[id]/chat/members
 * Get list of all organization members with pagination
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

    // Get total count
    const { count, error: countError } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", id);

    if (countError) {
      console.error("Error counting members:", countError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al contar los miembros.",
        },
        { status: 500 }
      );
    }

    // Get members with role info (profiles will be fetched separately)
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        joined_at,
        organization_roles(
          id,
          name,
          description
        )
      `
      )
      .eq("organization_id", id)
      .order("joined_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (membersError) {
      console.error("Error fetching members (query or RLS issue):", {
        error: membersError,
        code: membersError.code,
        message: membersError.message,
        details: membersError.details,
        hint: membersError.hint,
        organizationId: id,
        userId: user.id,
      });
      return NextResponse.json(
        {
          error: true,
          message: membersError.code === "PGRST301" 
            ? "Error de permisos al obtener los miembros. Verifica que eres miembro de la organización."
            : "Error al obtener los miembros.",
        },
        { status: 500 }
      );
    }

    // Get user IDs to fetch profiles separately
    const userIds = (members || []).map((m) => m.user_id).filter(Boolean);
    let profilesMap = {};
    
    if (userIds.length > 0) {
      // Only select first_name and last_name for privacy - no other profile data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles (RLS or query issue):", {
          error: profilesError,
          code: profilesError.code,
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          userIds: userIds.length,
        });
        // Continue without profiles - we'll use RPC fallback
      } else if (profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format members data with fallback to get_user_name RPC (same as regular members API)
    const formattedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const profile = profilesMap[member.user_id] || {};
        
        // Try to get name from RPC function first (same priority as regular members API)
        let fullName = null;
        try {
          const { data: userName, error: rpcError } = await supabase.rpc("get_user_name", {
            p_user_id: member.user_id,
          });
          
          if (rpcError) {
            console.error(`Error calling get_user_name RPC for user ${member.user_id}:`, {
              error: rpcError,
              code: rpcError.code,
              message: rpcError.message,
              details: rpcError.details,
              hint: rpcError.hint,
            });
          } else if (userName && typeof userName === "string") {
            // RPC returns a string, normalize it
            fullName = normalizeFullName(
              userName.split(" ")[0] || "",
              userName.split(" ").slice(1).join(" ") || ""
            );
          }
        } catch (err) {
          console.error(`Exception calling get_user_name RPC for user ${member.user_id}:`, {
            error: err,
            message: err.message,
            stack: err.stack,
          });
        }
        
        // Fallback to profile first_name + last_name if RPC didn't return a name
        if (!fullName) {
          fullName = normalizeFullName(profile.first_name, profile.last_name) || null;
        }
        
        // Normalize individual name parts for consistency
        const normalizedFirstName = profile.first_name ? normalizeName(profile.first_name) : "";
        const normalizedLastName = profile.last_name ? normalizeName(profile.last_name) : "";
        
        return {
          id: member.id,
          userId: member.user_id,
          roleId: member.organization_role_id,
          roleName: member.organization_roles?.name,
          roleDescription: member.organization_roles?.description,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          fullName: fullName || "Usuario",
          joinedAt: member.joined_at,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: {
          members: formattedMembers,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
        message: "Miembros obtenidos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching members:", {
      error,
      message: error.message,
      stack: error.stack,
      name: error.name,
      organizationId: id,
    });
    return NextResponse.json(
      {
        error: true,
        message: error.message || "Error inesperado al obtener los miembros.",
      },
      { status: 500 }
    );
  }
}


