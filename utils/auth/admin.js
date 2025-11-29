import { createClient } from "@/utils/supabase/server";

/**
 * Check if a user has app-level admin role
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} - True if user is admin, false otherwise
 */
export async function isAppAdmin(userId) {
  try {
    if (!userId) {
      return false;
    }

    const supabase = await createClient();

    // Check if user has admin role via profiles -> roles
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        roles!inner(
          id,
          name
        )
      `
      )
      .eq("id", userId)
      .eq("roles.name", "admin")
      .single();

    if (error) {
      // If error is "not found" (PGRST116), user is not admin
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("Error checking admin status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Unexpected error checking admin status:", error);
    return false;
  }
}

/**
 * Verify user is admin and throw error if not
 * @param {string} userId - The user ID to check
 * @throws {Error} - If user is not admin
 */
export async function checkIsAdmin(userId) {
  const isAdmin = await isAppAdmin(userId);
  if (!isAdmin) {
    throw new Error("No tienes permisos de administrador.");
  }
  return true;
}




