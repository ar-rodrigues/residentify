"use client";

import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";
import { formatDateDDMMYYYY } from "@/utils/date";

dayjs.extend(relativeTime);

/**
 * Client-side hook for locale-aware date formatting
 * Uses translations and dayjs locale configuration
 */
export function useFormattedDate() {
  const t = useTranslations();
  const locale = useLocale();
  
  // Set dayjs locale
  dayjs.locale(locale === "pt" ? "pt-br" : "es");

  /**
   * Formats a datetime for display with relative time
   * Shows relative time (e.g., "Hace 5 minutos" / "Há 5 minutos") for recent times,
   * or formatted datetime for older times
   * @param {string|Date} dateInput - ISO datetime string or Date object
   * @returns {string} - Formatted time string
   */
  const formatRelativeTime = (dateInput) => {
    if (!dateInput) return "N/A";

    try {
      const date = typeof dateInput === "string" ? dayjs(dateInput) : dayjs(dateInput);

      if (!date.isValid()) {
        return "N/A";
      }

      const now = dayjs();
      const diffSeconds = now.diff(date, "second");
      const diffMinutes = now.diff(date, "minute");
      const diffHours = now.diff(date, "hour");
      const diffDays = now.diff(date, "day");

      // Less than 1 minute ago
      if (diffSeconds < 60) {
        return t("dates.justNow") || "Hace un momento";
      }

      // Less than 1 hour ago
      if (diffMinutes < 60) {
        if (diffMinutes === 1) {
          return t("dates.minuteAgo") || "Hace 1 minuto";
        }
        return t("dates.minutesAgo", { count: diffMinutes }) || `Hace ${diffMinutes} minutos`;
      }

      // Less than 24 hours ago
      if (diffHours < 24) {
        if (diffHours === 1) {
          return t("dates.hourAgo") || "Hace 1 hora";
        }
        return t("dates.hoursAgo", { count: diffHours }) || `Hace ${diffHours} horas`;
      }

      // Less than 7 days ago
      if (diffDays < 7) {
        if (diffDays === 1) {
          return t("dates.yesterday") || "Ayer";
        }
        return t("dates.daysAgo", { count: diffDays }) || `Hace ${diffDays} días`;
      }

      // Older than 7 days - show formatted date and time
      return formatDateDDMMYYYY(dateInput) + " " + date.format("HH:mm");
    } catch (error) {
      console.error("Error formatting relative time:", error);
      return "N/A";
    }
  };

  /**
   * Formats a date to dd/mm/yyyy format for display
   * @param {string|Date} dateInput - Date string or Date object
   * @returns {string} - Formatted date string (dd/mm/yyyy) or "N/A" if invalid
   */
  const formatDate = (dateInput) => {
    return formatDateDDMMYYYY(dateInput);
  };

  return {
    formatRelativeTime,
    formatDate,
    formatDateDDMMYYYY: formatDate,
  };
}












