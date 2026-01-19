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
    // Check if user has membership and seat assignment
    const {data:memberCheck,error:memberCheckError}=await supabase.from('organization_members').select('id,seat_id,organization_role_id').eq('organization_id',organizationId).eq('user_id',user.id).single();
    
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
      // User is a member, but view returned no data - this shouldn't happen after backfill
      // But let's check if they're actually a member
      if (memberCheck && !memberCheck.seat_id) {
        // Return a helpful error message
        return {
          error: true,
          message: "Tu cuenta necesita ser actualizada. Por favor, contacta al administrador.",
          status: 500,
        };
      }
      
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
        userRole: orgData.seat_type || null,
        isAdmin: orgData.is_admin || false,
        is_frozen: orgData.is_frozen || false,
        // Permissions come as JSONB array from the view - ensure it's always an array
        permissions: Array.isArray(orgData.permissions) 
          ? orgData.permissions 
          : (orgData.permissions ? JSON.parse(JSON.stringify(orgData.permissions)) : []),
        seat_id: orgData.seat_id || null,
        seat_name: orgData.seat_name || null,
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
