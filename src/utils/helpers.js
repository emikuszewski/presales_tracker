// General utility functions

/**
 * Group array items by a key (for batch processing)
 * @param {Array} arr - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const keyValue = item[key];
  if (keyValue) {
    (acc[keyValue] = acc[keyValue] || []).push(item);
  }
  return acc;
}, {});

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} Two-character initials
 */
export const generateInitials = (name) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Generate a temporary ID for optimistic updates
 * @returns {string} Temporary ID
 */
export const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
