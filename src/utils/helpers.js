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

/**
 * Format deal size to always start with $ if there's a value
 * @param {string} value - Deal size value
 * @returns {string} Formatted deal size with $ prefix
 */
export const formatDealSize = (value) => {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('$')) return trimmed;
  return `$${trimmed}`;
};

/**
 * Determines avatar background/text classes based on member state
 * Priority: system user → inactive → current user → default
 * 
 * @param {Object} member - Team member object
 * @param {string} currentUserId - Current logged-in user's ID
 * @param {string} size - Optional size variant ('sm' | 'md')
 * @returns {string} Tailwind CSS classes for the avatar
 */
export const getAvatarClasses = (member, currentUserId, size = 'md') => {
  // Size classes
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  
  // Color classes based on priority
  let colorClasses;
  
  if (member?.isSystemUser) {
    // System users get distinct blue
    colorClasses = 'bg-blue-500 text-white';
  } else if (member?.isActive === false) {
    // Inactive users get muted gray
    colorClasses = 'bg-gray-300 text-gray-500';
  } else if (member?.id === currentUserId) {
    // Current user gets dark styling
    colorClasses = 'bg-gray-900 text-white';
  } else {
    // Default styling for other active users
    colorClasses = 'bg-gray-200 text-gray-600';
  }
  
  return `${sizeClasses} ${colorClasses}`;
};

/**
 * Gets just the color classes for avatar (without size)
 * Useful when size is handled separately
 * 
 * @param {Object} member - Team member object  
 * @param {string} currentUserId - Current logged-in user's ID
 * @returns {string} Tailwind CSS color classes for the avatar
 */
export const getAvatarColorClasses = (member, currentUserId) => {
  if (member?.isSystemUser) {
    return 'bg-blue-500 text-white';
  } else if (member?.isActive === false) {
    return 'bg-gray-300 text-gray-500';
  } else if (member?.id === currentUserId) {
    return 'bg-gray-900 text-white';
  } else {
    return 'bg-gray-200 text-gray-600';
  }
};
