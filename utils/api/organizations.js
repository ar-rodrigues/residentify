import { createClient } from "@/utils/supabase/server";

/**
 * Server-side utility to get organization details by ID
 * This function handles authentication, authorization, and data fetching
 * @param {string} organizationId - The organization ID
 * @returns {Promise<{error: boolean, message?: string, data?: Object}>}
 */
export async function getOrganizationById(organizationId) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: true,
        message: "No estás autenticado. Por favor, inicia sesión.",
        status: 401,
      };
    }

    // Validate organization ID
    if (!organizationId || typeof organizationId !== "string") {
      return {
        error: true,
        message: "ID de organización inválido.",
        status: 400,
      };
    }

    // First, get the organization (RLS will check if user is a member)
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, created_by, created_at, updated_at")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);

      if (orgError.code === "PGRST116") {
        // Not found
        return {
          error: true,
          message: "Organización no encontrada o no tienes acceso a ella.",
          status: 404,
        };
      }

      return {
        error: true,
        message: "Error al obtener la organización.",
        status: 500,
      };
    }

    if (!organization) {
      return {
        error: true,
        message: "Organización no encontrada.",
        status: 404,
      };
    }

    // Get user's membership separately (using the "own memberships" policy to avoid recursion)
    const { data: userMember, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        organization_roles(
          id,
          name,
          description
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine - user might not be a member
      console.error("Error fetching user membership:", memberError);
    }

    // Check if user is admin
    const isAdmin = userMember?.organization_roles?.name === "admin" || false;
    // Normalize role name: security_personnel -> security for frontend consistency
    let userRole = userMember?.organization_roles?.name || null;
    if (userRole === "security_personnel") {
      userRole = "security";
    }

    // Get creator's name using RPC function (bypasses RLS)
    const { data: creatorName, error: creatorError } = await supabase.rpc(
      "get_user_name",
      { p_user_id: organization.created_by }
    );

    if (creatorError) {
      console.error("Error fetching creator name:", creatorError);
      // Continue without creator name if there's an error
    }

    return {
      error: false,
      data: {
        id: organization.id,
        name: organization.name,
        created_by: organization.created_by,
        created_by_name: creatorName,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
        userRole,
        isAdmin,
      },
      status: 200,
    };
  } catch (error) {
    console.error("Unexpected error fetching organization:", error);
    return {
      error: true,
      message: "Error inesperado al obtener la organización.",
      status: 500,
    };
  }
}
