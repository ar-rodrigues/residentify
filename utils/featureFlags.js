import { createClient } from "@/utils/supabase/server";

/**
 * Get all feature flags with enabled status for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of flags with enabled status
 */
export async function getUserFlags(userId) {
  try {
    if (!userId) {
      return [];
    }

    const supabase = await createClient();

    // Use RPC function to bypass RLS and get user flags
    const { data, error } = await supabase.rpc("get_user_flags", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching user flags:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching user flags:", error);
    return [];
  }
}

/**
 * Check if a specific flag is enabled for a user
 * @param {string} userId - The user ID
 * @param {string} flagName - The flag name to check
 * @returns {Promise<boolean>} - True if flag is enabled, false otherwise
 */
export async function checkUserFlag(userId, flagName) {
  try {
    if (!userId || !flagName) {
      return false;
    }

    const flags = await getUserFlags(userId);
    const flag = flags.find((f) => f.name === flagName);

    return flag?.enabled === true;
  } catch (error) {
    console.error("Unexpected error checking user flag:", error);
    return false;
  }
}

/**
 * Boolean helper to check if user has a feature flag enabled
 * @param {string} userId - The user ID
 * @param {string} flagName - The flag name to check
 * @returns {Promise<boolean>} - True if flag is enabled, false otherwise
 */
export async function hasFeatureFlag(userId, flagName) {
  return await checkUserFlag(userId, flagName);
}


