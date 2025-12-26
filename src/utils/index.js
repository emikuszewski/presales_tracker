import { STALE_THRESHOLD_BUSINESS_DAYS } from '../constants';

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group an array of objects by a key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort array by date field (newest first by default)
 * @param {Array} array - Array to sort
 * @param {string} dateField - Field name containing date
 * @param {boolean} ascending - Sort ascending if true
 * @returns {Array} Sorted array
 */
export const sortByDate = (array, dateField = 'createdAt', ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string to specified length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncate = (str, maxLength = 50) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date for display: "Jan 8, 2025"
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format short date: "Jan 8" or "Jan 8, 2024" if not current year
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  
  if (sameYear) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format datetime for display: "Jan 8, 2025 at 3:45 PM"
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Format relative date: "2 days ago", "in 3 hours", etc.
 * @param {string|Date} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  return formatShortDate(date);
};

/**
 * Calculate business days between two dates (excludes weekends)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of business days
 */
export const getBusinessDaysBetween = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get today's date in YYYY-MM-DD format (alias for getTodayString)
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

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

// ============================================================================
// ENGAGEMENT STATUS UTILITIES
// ============================================================================

/**
 * List of "closed" engagement statuses that trigger auto-archive
 */
export const CLOSED_STATUSES = ['WON', 'LOST', 'DISQUALIFIED', 'NO_DECISION'];

/**
 * Check if an engagement status is a "closed" status
 * @param {string} status - Engagement status
 * @returns {boolean} True if closed status
 */
export const isClosedStatus = (status) => {
  return CLOSED_STATUSES.includes(status);
};

/**
 * Check if an engagement should show stale badge based on its status
 * Stale is only relevant for ACTIVE status engagements
 * @param {Object} engagement - Engagement object
 * @returns {boolean} True if stale badge should be shown
 */
export const shouldShowStale = (engagement) => {
  if (!engagement) return false;
  const status = engagement.engagementStatus || 'ACTIVE';
  // Only show stale for ACTIVE status
  return status === 'ACTIVE' && engagement.isStale === true;
};

/**
 * Get engagement status border color classes
 * @param {string} status - Engagement status
 * @returns {string} Tailwind CSS border classes
 */
export const getEngagementStatusBorderClasses = (status) => {
  const borderStyles = {
    ACTIVE: 'border-gray-200 hover:border-gray-300',
    ON_HOLD: 'border-purple-300',
    UNRESPONSIVE: 'border-amber-300',
    WON: 'border-green-300',
    LOST: 'border-red-300',
    DISQUALIFIED: 'border-red-300',
    NO_DECISION: 'border-gray-300'
  };
  return borderStyles[status] || borderStyles.ACTIVE;
};

/**
 * Get engagement status badge classes
 * @param {string} status - Engagement status
 * @returns {string} Tailwind CSS badge classes
 */
export const getEngagementStatusBadgeClasses = (status) => {
  const badgeStyles = {
    ACTIVE: 'bg-gray-100 text-gray-600',
    ON_HOLD: 'bg-purple-100 text-purple-700',
    UNRESPONSIVE: 'bg-amber-100 text-amber-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-red-100 text-red-700',
    DISQUALIFIED: 'bg-red-100 text-red-700',
    NO_DECISION: 'bg-gray-100 text-gray-600'
  };
  return badgeStyles[status] || badgeStyles.ACTIVE;
};

/**
 * Get engagement status icon
 * @param {string} status - Engagement status
 * @returns {string|null} Icon emoji or null
 */
export const getEngagementStatusIcon = (status) => {
  const icons = {
    ACTIVE: null,
    ON_HOLD: '⏸️',
    UNRESPONSIVE: '⚠️',
    WON: '🎉',
    LOST: '❌',
    DISQUALIFIED: '🚫',
    NO_DECISION: '➖'
  };
  return icons[status] || null;
};

/**
 * Get closed banner style classes
 * @param {string} status - Engagement status
 * @returns {Object} Classes for banner background, border, and text
 */
export const getClosedBannerClasses = (status) => {
  const styles = {
    WON: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '🎉'
    },
    LOST: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌'
    },
    DISQUALIFIED: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: '🚫'
    },
    NO_DECISION: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: '➖'
    }
  };
  return styles[status] || styles.NO_DECISION;
};

// ============================================================================
// ENGAGEMENT UTILITIES
// ============================================================================

/**
 * Check if an engagement is stale (no activity in STALE_THRESHOLD_BUSINESS_DAYS)
 * Updated: Only considers ACTIVE status engagements as potentially stale
 * @param {Object} engagement - Engagement object with lastActivity
 * @returns {boolean} True if stale
 */
export const isEngagementStale = (engagement) => {
  if (!engagement?.lastActivity) return false;
  
  // Don't mark archived engagements as stale
  if (engagement.isArchived) return false;
  
  // Don't mark completed engagements as stale
  if (engagement.currentPhase === 'ENABLE' && 
      engagement.phases?.ENABLE?.status === 'COMPLETE') {
    return false;
  }
  
  // Only ACTIVE status engagements can be stale
  // ON_HOLD, UNRESPONSIVE, and closed statuses are never stale
  const status = engagement.engagementStatus || 'ACTIVE';
  if (status !== 'ACTIVE') {
    return false;
  }
  
  const lastActivity = new Date(engagement.lastActivity);
  const today = new Date();
  const businessDays = getBusinessDaysBetween(lastActivity, today);
  
  return businessDays > STALE_THRESHOLD_BUSINESS_DAYS;
};

/**
 * Get days since last activity (calendar days)
 * @param {Object} engagement - Engagement object with lastActivity
 * @returns {number} Days since last activity
 */
export const getDaysSinceActivity = (engagement) => {
  if (!engagement?.lastActivity) return 0;
  
  const lastActivity = new Date(engagement.lastActivity);
  const today = new Date();
  const diffTime = Math.abs(today - lastActivity);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get phase index for ordering
 * @param {string} phase - Phase enum value
 * @returns {number} Phase index (0-4)
 */
export const getPhaseIndex = (phase) => {
  const phases = ['DISCOVER', 'DESIGN', 'DEMONSTRATE', 'VALIDATE', 'ENABLE'];
  return phases.indexOf(phase);
};

/**
 * Check if a phase is completed
 * @param {Object} engagement - Engagement object
 * @param {string} phaseType - Phase type to check
 * @returns {boolean} True if phase is complete
 */
export const isPhaseComplete = (engagement, phaseType) => {
  return engagement?.phases?.[phaseType]?.status === 'COMPLETE';
};

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Get avatar color classes based on team member properties
 * @param {Object} member - Team member object
 * @param {boolean} member.isSystemUser - Whether this is a system user
 * @returns {string} Tailwind CSS classes for avatar styling
 */
export const getAvatarColorClasses = (member) => {
  if (member?.isSystemUser) {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-200 text-gray-700';
};

/**
 * Get status badge classes
 * @param {string} status - Status enum value
 * @returns {string} Tailwind CSS classes
 */
export const getStatusClasses = (status) => {
  const statusStyles = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETE: 'bg-green-100 text-green-700',
    BLOCKED: 'bg-amber-100 text-amber-700',
    SKIPPED: 'bg-gray-100 text-gray-400'
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-600';
};

/**
 * Get phase badge classes
 * @param {string} phase - Phase enum value
 * @returns {string} Tailwind CSS classes
 */
export const getPhaseClasses = (phase) => {
  const phaseStyles = {
    DISCOVER: 'bg-purple-100 text-purple-700',
    DESIGN: 'bg-blue-100 text-blue-700',
    DEMONSTRATE: 'bg-cyan-100 text-cyan-700',
    VALIDATE: 'bg-orange-100 text-orange-700',
    ENABLE: 'bg-green-100 text-green-700'
  };
  return phaseStyles[phase] || 'bg-gray-100 text-gray-600';
};

// ============================================================================
// FUNCTION UTILITIES
// ============================================================================

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Sleep/delay for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a string is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format deal size for display (e.g., "$50K", "$1.2M")
 * @param {string|number} value - Deal size value
 * @returns {string} Formatted deal size
 */
export const formatDealSize = (value) => {
  if (!value) return '';
  
  // If it's already a formatted string like "$50K", return as-is
  if (typeof value === 'string' && value.includes('$')) {
    return value;
  }
  
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  if (isNaN(num)) return value.toString();
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num}`;
};

/**
 * Parse deal size string to number
 * @param {string} value - Deal size string (e.g., "$50K", "$1.2M")
 * @returns {number} Numeric value
 */
export const parseDealSize = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  
  const cleaned = value.replace(/[^0-9.KMkm]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) return 0;
  
  if (value.toUpperCase().includes('M')) {
    return num * 1000000;
  }
  if (value.toUpperCase().includes('K')) {
    return num * 1000;
  }
  return num;
};

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format number with commas
 * @param {number} value - Numeric value
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format percentage
 * @param {number} value - Decimal value (0.5 = 50%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '';
  return `${(value * 100).toFixed(decimals)}%`;
};
