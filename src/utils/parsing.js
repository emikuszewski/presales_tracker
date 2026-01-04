// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parse links from JSON string or return array as-is
 * @param {string|Array} links - Links JSON string or array
 * @returns {Array} Parsed links array
 */
export const parseLinks = (links) => {
  if (!links) return [];
  if (Array.isArray(links)) return links;
  try {
    return JSON.parse(links);
  } catch {
    return [];
  }
};

/**
 * Safely parse JSON with fallback
 * @param {string} json - JSON string
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed value or fallback
 */
export const safeJsonParse = (json, fallback = null) => {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
