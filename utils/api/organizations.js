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

    // First, get the organization with organization type (RLS will check if user is a member)
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select(
        `
        id,
        name,
        created_by,
        created_at,
        updated_at,
        organization_type_id,
        organization_types(
          id,
          name,
          description
        )
      `
      )
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
        // Invalid input syntax for type uuid (shouldn't happen with our validation, but handle it anyway)
        return {
          error: true,
          message: "ID de organización inválido. El formato del ID no es válido.",
          status: 400,
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
    // First, check if user is a member at all (without type filter)
    const { data: rawUserMember, error: rawMemberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        organization_roles(
          id,
          name,
          description,
          organization_type_id
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    // If there's an error other than "not found", log it
    if (rawMemberError && rawMemberError.code !== "PGRST116") {
      console.error("Error fetching user membership:", rawMemberError);
    }

    // Check if user is a member
    if (rawMemberError?.code === "PGRST116" || !rawUserMember) {
      // User is not a member - this is fine, they might have a pending invitation
      // userRole will be null, which is handled by the frontend
    } else if (rawUserMember) {
      // User IS a member - now check if their role matches the organization type
      const memberRoleTypeId =
        rawUserMember.organization_roles?.organization_type_id;

      if (memberRoleTypeId !== organization.organization_type_id) {
        // User has a membership but with a role that doesn't match the organization type
        // This indicates a data inconsistency (e.g., from partial migrations)
        const roleName =
          rawUserMember.organization_roles?.name || "desconocido";
        const orgTypeName =
          organization.organization_types?.name || "desconocido";

        return {
          error: true,
          message: `Inconsistencia de datos detectada: Tienes un rol asignado (${roleName}) que no corresponde al tipo de organización (${orgTypeName}). Por favor, contacta al administrador del sistema.`,
          status: 400,
        };
      }
    }

    // If we get here, user is either not a member OR their role matches the org type
    // Now get the membership with the type filter to ensure we have the correct role
    const { data: userMember, error: memberError } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        organization_role_id,
        organization_roles!inner(
          id,
          name,
          description,
          organization_type_id
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq(
        "organization_roles.organization_type_id",
        organization.organization_type_id
      )
      .single();

    // If we know the user is a member but this query fails, it's a data inconsistency
    if (memberError && rawUserMember) {
      console.error(
        "Error fetching user membership with type filter:",
        memberError
      );
      // This shouldn't happen if our check above worked, but handle it gracefully
      return {
        error: true,
        message:
          "Error al obtener tu rol en esta organización. Por favor, contacta al administrador del sistema.",
        status: 500,
      };
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

    // Check invitation status for this user and organization
    // Query organization_invitations to see if user has a pending_approval invitation
    let invitationStatus = null;
    let isPendingApproval = false;

    if (user?.email) {
      const { data: invitation, error: invitationError } = await supabase
        .from("organization_invitations")
        .select("status")
        .eq("organization_id", organizationId)
        .eq("email", user.email.toLowerCase())
        .in("status", ["pending_approval", "accepted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!invitationError && invitation) {
        invitationStatus = invitation.status;
        isPendingApproval = invitation.status === "pending_approval";
      }
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
        organization_type_id: organization.organization_type_id,
        organization_type: organization.organization_types?.name || null,
        organization_type_description:
          organization.organization_types?.description || null,
        userRole,
        isAdmin,
        invitationStatus,
        isPendingApproval,
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
