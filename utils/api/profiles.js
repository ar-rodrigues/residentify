import { createClient } from "@/utils/supabase/server";
import { validateUUID } from "@/utils/validation/uuid";

/**
 * Server-side utility to update a user's main organization
 * Validates that the user is a member of the organization before setting it as main
 * @param {string} userId - The user ID
 * @param {string|null} organizationId - The organization ID to set as main (null to clear)
 * @returns {Promise<{error: boolean, message?: string, status?: number}>}
 */
export async function updateMainOrganization(userId, organizationId) {
  try {
    const supabase = await createClient();

    // Validate user ID
    if (!userId || typeof userId !== "string") {
      return {
        error: true,
        message: "ID de usuario inválido.",
        status: 400,
      };
    }

    // If organizationId is null, clear the main organization
    if (organizationId === null || organizationId === undefined) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ main_organization_id: null })
        .eq("id", userId);

      if (updateError) {
        console.error("Error clearing main organization:", updateError);
        return {
          error: true,
          message: "Error al actualizar la organización principal.",
          status: 500,
        };
      }

      return {
        error: false,
        message: "Organización principal actualizada exitosamente.",
      };
    }

    // Validate organization ID format
    const uuidValidation = validateUUID(organizationId, "organización");
    if (uuidValidation) {
      return uuidValidation;
    }

    // Verify that the user is a member of the organization
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (memberError || !memberData) {
      return {
        error: true,
        message: "No eres miembro de esta organización.",
        status: 403,
      };
    }

    // Update the main organization
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ main_organization_id: organizationId })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating main organization:", updateError);
      return {
        error: true,
        message: "Error al actualizar la organización principal.",
        status: 500,
      };
    }

    return {
      error: false,
      message: "Organización principal actualizada exitosamente.",
    };
  } catch (error) {
    console.error("Unexpected error updating main organization:", error);
    return {
      error: true,
      message: "Error inesperado al actualizar la organización principal.",
      status: 500,
    };
  }
}

/**
 * Server-side utility to get a user's main organization ID
 * @param {string} userId - The user ID
 * @returns {Promise<{error: boolean, data?: string|null, message?: string, status?: number}>}
 */
export async function getMainOrganization(userId) {
  try {
    const supabase = await createClient();

    // Validate user ID
    if (!userId || typeof userId !== "string") {
      return {
        error: true,
        message: "ID de usuario inválido.",
        status: 400,
      };
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("main_organization_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return {
        error: true,
        message: "Error al obtener el perfil del usuario.",
        status: 500,
      };
    }

    // Verify that the main organization still exists and user is still a member
    if (profile.main_organization_id) {
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", profile.main_organization_id)
        .single();

      // If user is no longer a member, clear the main organization
      if (memberError || !memberData) {
        await updateMainOrganization(userId, null);
        return {
          error: false,
          data: null,
          message: "Organización principal no válida, se ha limpiado.",
        };
      }
    }

    return {
      error: false,
      data: profile.main_organization_id || null,
    };
  } catch (error) {
    console.error("Unexpected error getting main organization:", error);
    return {
      error: true,
      message: "Error inesperado al obtener la organización principal.",
      status: 500,
    };
  }
}

/**
 * Server-side utility to recalculate main organization after removal
 * Sets main org to the single remaining org, or null if multiple/zero orgs
 * @param {string} userId - The user ID
 * @returns {Promise<{error: boolean, message?: string, status?: number}>}
 */
export async function recalculateMainOrganization(userId) {
  try {
    const supabase = await createClient();

    // Get all organizations the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error fetching user organizations:", memberError);
      return {
        error: true,
        message: "Error al obtener las organizaciones del usuario.",
        status: 500,
      };
    }

    const orgCount = memberData?.length || 0;

    // If user has exactly one organization, set it as main
    if (orgCount === 1) {
      return await updateMainOrganization(userId, memberData[0].organization_id);
    }

    // If user has zero or multiple organizations, set to null
    return await updateMainOrganization(userId, null);
  } catch (error) {
    console.error("Unexpected error recalculating main organization:", error);
    return {
      error: true,
      message: "Error inesperado al recalcular la organización principal.",
      status: 500,
    };
  }
}





