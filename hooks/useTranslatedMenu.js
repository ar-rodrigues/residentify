"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { getPrivateMenu } from "@/utils/config/app";

/**
 * Hook that returns the private menu items with translated labels
 * @returns {Array} Array of menu items with translated labels
 */
export function useTranslatedMenu() {
  const t = useTranslations();
  
  return useMemo(() => {
    const privateMenu = getPrivateMenu();
    return privateMenu.map((item) => {
      // Map menu keys to translation keys
      const translationKeyMap = {
        "/organizations": "navigation.organizations",
        "/profile": "navigation.profile",
      };
      
      const translationKey = translationKeyMap[item.key];
      const translatedLabel = translationKey ? t(translationKey) : item.label;
      
      return {
        ...item,
        label: translatedLabel,
      };
    });
  }, [t]);
}
















