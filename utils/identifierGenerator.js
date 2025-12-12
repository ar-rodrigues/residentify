/**
 * Generate random identifiers using superpower + animal combinations
 * Format: "superpower animal" (e.g., "flying monkey", "invisible tiger")
 */

const superpowers = [
  "flying",
  "invisible",
  "super-strong",
  "telepathic",
  "telekinetic",
  "electric",
  "fire",
  "ice",
  "shadow",
  "lightning",
  "magnetic",
  "time-traveling",
  "shape-shifting",
  "mind-reading",
  "super-fast",
  "indestructible",
  "teleporting",
  "x-ray",
  "water",
  "wind",
];

const animals = [
  "monkey",
  "eagle",
  "tiger",
  "lion",
  "wolf",
  "bear",
  "shark",
  "dolphin",
  "elephant",
  "panther",
  "hawk",
  "fox",
  "jaguar",
  "cobra",
  "phoenix",
  "dragon",
  "falcon",
  "raven",
  "leopard",
  "cheetah",
];

/**
 * Generate a random identifier
 * @returns {string} A random combination of superpower + animal (e.g., "flying monkey")
 */
export function generateIdentifier() {
  const randomSuperpower =
    superpowers[Math.floor(Math.random() * superpowers.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  return `${randomSuperpower} ${randomAnimal}`;
}

/**
 * Generate multiple unique identifiers
 * @param {number} count - Number of identifiers to generate
 * @returns {string[]} Array of unique identifiers
 */
export function generateUniqueIdentifiers(count = 1) {
  const identifiers = new Set();
  let attempts = 0;
  const maxAttempts = count * 100; // Prevent infinite loops

  while (identifiers.size < count && attempts < maxAttempts) {
    const identifier = generateIdentifier();
    identifiers.add(identifier);
    attempts++;
  }

  return Array.from(identifiers);
}












