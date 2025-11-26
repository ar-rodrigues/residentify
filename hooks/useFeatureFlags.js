"use client";

import { useFeatureFlags as useFeatureFlagsContext } from "@/components/providers/FeatureFlagsProvider";

/**
 * Custom hook to access feature flags from context
 * This is a re-export for convenience
 * @returns {{ flags: Array, loading: boolean, error: Error | null, hasFlag: (flagName: string) => boolean, refetch: () => Promise<void> }}
 */
export function useFeatureFlags() {
  return useFeatureFlagsContext();
}


