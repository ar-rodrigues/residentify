/**
 * Date utility functions for handling timezone conversions
 * between client (local time) and server (UTC)
 */

/**
 * Converts a local date to date string for storage (YYYY-MM-DD)
 * Takes the calendar date (year, month, day) from local timezone
 * and stores it as a date-only string (no time component)
 * @param {dayjs.Dayjs|Date|string} localDate - The date in user's local timezone
 * @returns {string} - Date string (YYYY-MM-DD format)
 */
export function localDateToUTC(localDate) {
  if (!localDate) return null;

  // Handle dayjs objects
  if (localDate && typeof localDate === "object" && "format" in localDate) {
    // It's a dayjs object - get the date components directly
    const year = localDate.year();
    const month = localDate.month() + 1; // dayjs months are 0-indexed
    const day = localDate.date();
    // Return as YYYY-MM-DD string using the same calendar date
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  // Handle Date objects
  if (localDate instanceof Date) {
    // Get the local date components (year, month, day)
    const year = localDate.getFullYear();
    const month = localDate.getMonth() + 1; // getMonth() is 0-indexed
    const day = localDate.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  // Handle date strings
  if (typeof localDate === "string") {
    // Check if it's already in YYYY-MM-DD format
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyPattern.test(localDate)) {
      return localDate; // Already in correct format
    }
    // Parse as local date to extract components
    const date = new Date(localDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  return null;
}

/**
 * Converts a UTC date string to a local date for display
 * @param {string} utcDateString - UTC date string (YYYY-MM-DD)
 * @returns {Date} - Date object in local timezone
 */
export function utcDateToLocal(utcDateString) {
  if (!utcDateString) return null;

  // Parse the UTC date string
  const [year, month, day] = utcDateString.split("-").map(Number);

  // Create date in local timezone using UTC components
  return new Date(year, month - 1, day);
}

/**
 * Formats a date to dd/mm/yyyy format for display
 * Handles both date-only strings (YYYY-MM-DD) and full datetime strings
 * For date-only strings, parses as local date to avoid timezone shifts
 * @param {string|Date} dateInput - Date string (YYYY-MM-DD or ISO) or Date object
 * @returns {string} - Formatted date string (dd/mm/yyyy) or "N/A" if invalid
 */
export function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return "N/A";

  try {
    let date;

    if (typeof dateInput === "string") {
      // Check if it's a date-only string (YYYY-MM-DD format)
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyPattern.test(dateInput)) {
        // Parse as local date to avoid timezone conversion issues
        const [year, month, day] = dateInput.split("-").map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Full datetime string - parse normally
        date = new Date(dateInput);
      }
    } else {
      // Already a Date object
      date = dateInput;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }

    // Get date components using local timezone methods
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-indexed
    const year = date.getFullYear();

    // Return in dd/mm/yyyy format
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
}

/**
 * Validates that a UTC date string is not in the future
 * @param {string} utcDateString - UTC date string (YYYY-MM-DD)
 * @returns {boolean} - True if date is valid (not in future)
 */
export function isValidPastDate(utcDateString) {
  if (!utcDateString) return false;

  // Parse the UTC date string
  const [year, month, day] = utcDateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Get today's date in UTC (midnight UTC)
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  return date <= todayUTC;
}
