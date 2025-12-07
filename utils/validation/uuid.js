/**
 * UUID validation utility
 * Validates UUID v4 format
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * @param {string} uuid - The string to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }
  return UUID_V4_REGEX.test(uuid.trim());
}

/**
 * Validates UUID and returns an error response object if invalid
 * @param {string} uuid - The UUID to validate
 * @param {string} fieldName - The name of the field for error messages (e.g., "organización", "código QR")
 * @returns {Object|null} - Error response object if invalid, null if valid
 */
export function validateUUID(uuid, fieldName = "recurso") {
  if (!uuid || typeof uuid !== "string") {
    return {
      error: true,
      message: `ID de ${fieldName} inválido. El ID no puede estar vacío.`,
      status: 400,
    };
  }

  if (!isValidUUID(uuid)) {
    return {
      error: true,
      message: `ID de ${fieldName} inválido. El formato del ID no es válido. Por favor, verifica que el ID tenga el formato correcto (ejemplo: 123e4567-e89b-12d3-a456-426614174000).`,
      status: 400,
    };
  }

  return null;
}

