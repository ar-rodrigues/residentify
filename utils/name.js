/**
 * Name normalization utilities
 */

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - The string to normalize
 * @returns {string} Normalized string with first letter of each word capitalized
 * @example
 * normalizeName("john doe") // "John Doe"
 * normalizeName("MARIA SILVA") // "Maria Silva"
 * normalizeName("josé pérez") // "José Pérez"
 */
export function normalizeName(str) {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Normalizes a full name from first and last name parts
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string|null} Normalized full name or null if empty
 * @example
 * normalizeFullName("john", "doe") // "John Doe"
 * normalizeFullName("MARIA", "SILVA") // "Maria Silva"
 * normalizeFullName("john doe", "") // "John Doe" (handles full name in first param)
 */
export function normalizeFullName(firstName, lastName) {
  // If firstName contains spaces and lastName is empty, treat firstName as full name
  if (firstName && !lastName && firstName.includes(" ")) {
    const normalized = normalizeName(firstName);
    return normalized || null;
  }

  const first = normalizeName(firstName || "");
  const last = normalizeName(lastName || "");
  const result = `${first} ${last}`.trim();

  // Return null if empty instead of empty string for consistency
  return result || null;
}
