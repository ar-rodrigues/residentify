import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

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

    // Validate organization ID (UUID format)
    const uuidValidation = validateUUID(organizationId, "organización");
    if (uuidValidation) {
      return uuidValidation;
    }

    // OPTIMIZED: Single query using the view
    // Note: The view's WHERE clause already ensures only authorized users' data is returned
    // (users with membership OR pending invitations). The user_id field can be NULL for
    // pending invitations, so we don't filter by it here.
    const { data: orgData, error: orgError } = await supabase
      .from("organization_details_view")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      // Log error with better serialization
      console.error("Error fetching organization:", {
        code: orgError.code,
        message: orgError.message,
        details: orgError.details,
        hint: orgError.hint,
      });

      if (orgError.code === "PGRST116") {
        // Not found
        return {
          error: true,
          message: "Organización no encontrada o no tienes acceso a ella.",
          status: 404,
        };
      }

      if (orgError.code === "22P02") {
        // Invalid input syntax for type uuid
        return {
          error: true,
          message:
            "ID de organización inválido. El formato del ID no es válido.",
          status: 400,
        };
      }

      return {
        error: true,
        message: "Error al obtener la organización.",
        status: 500,
      };
    }

    if (!orgData) {
      return {
        error: true,
        message: "Organización no encontrada.",
        status: 404,
      };
    }

    // Get creator's name (optional, can be done in parallel or cached)
    const { data: creatorName, error: creatorError } = await supabase.rpc(
      "get_user_name",
      { p_user_id: orgData.created_by }
    );

    if (creatorError) {
      console.error("Error fetching creator name:", creatorError);
      // Continue without creator name if there's an error
    }

    return {
      error: false,
      data: {
        id: orgData.id,
        name: orgData.name,
        created_by: orgData.created_by,
        created_by_name: creatorName || null,
        created_at: orgData.created_at,
        updated_at: orgData.updated_at,
        organization_type_id: orgData.organization_type_id,
        organization_type: orgData.organization_type || null,
        organization_type_description:
          orgData.organization_type_description || null,
        userRole: orgData.normalized_user_role || null,
        isAdmin: orgData.is_admin || false,
        invitationStatus: orgData.invitation_status || null,
        isPendingApproval: orgData.is_pending_approval || false,
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
