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
 * Format relative time for display: "Just now", "5 min ago", "2 hours ago", "3 days ago", or "Jan 5"
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (datetime) => {
  if (!datetime) return '';
  
  const d = new Date(datetime);
  const now = new Date();
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Just now (less than 1 minute)
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  // Minutes (1-59)
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  
  // Hours (1-23)
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  // Days (1-6)
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  // 7+ days - fall back to date format "Jan 5"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
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
// PHASE UTILITIES
// ============================================================================

/**
 * Derive the current display phase from phase data
 * Scans phases in order (DISCOVER → ENABLE), returns first that is NOT COMPLETE and NOT SKIPPED
 * Falls back to ENABLE if all phases are COMPLETE or SKIPPED
 * 
 * This fixes the bug where stored currentPhase gets stale when phases are marked
 * COMPLETE directly without going through IN_PROGRESS first.
 * 
 * @param {Object} phases - Object mapping phase IDs to phase data
 * @returns {string} The derived current phase ID
 */
export const getDerivedCurrentPhase = (phases) => {
  if (!phases) return 'DISCOVER';
  
  // Phase order - hardcoded to avoid circular dependency with constants
  const phaseOrder = ['DISCOVER', 'DESIGN', 'DEMONSTRATE', 'VALIDATE', 'ENABLE'];
  
  for (const phaseId of phaseOrder) {
    const phaseData = phases[phaseId];
    const status = phaseData?.status || 'PENDING';
    
    // Return first phase that is NOT COMPLETE and NOT SKIPPED
    if (status !== 'COMPLETE' && status !== 'SKIPPED') {
      return phaseId;
    }
  }
  
  // All phases are COMPLETE or SKIPPED, return ENABLE
  return 'ENABLE';
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

// ============================================================================
// RECALCULATION UTILITIES (for optimistic updates)
// ============================================================================

/**
 * Recalculate lastActivity from an activities array
 * Activities are assumed to be sorted by date descending (newest first)
 * 
 * @param {Array} activities - Array of activity objects with date property
 * @param {string} fallbackDate - Date to use if no activities (e.g., engagement.startDate)
 * @returns {string} The most recent activity date, or fallback
 */
export const recalculateLastActivity = (activities, fallbackDate) => {
  if (!activities || activities.length === 0) {
    return fallbackDate || new Date().toISOString().split('T')[0];
  }
  
  // Activities should already be sorted desc, but let's be safe
  // Find the maximum date
  let maxDate = activities[0].date;
  for (let i = 1; i < activities.length; i++) {
    if (activities[i].date > maxDate) {
      maxDate = activities[i].date;
    }
  }
  
  return maxDate;
};

/**
 * Recalculate isStale for an engagement
 * Wrapper around isEngagementStale for use in optimistic updates
 * 
 * @param {Object} engagement - Engagement object (can be partially updated)
 * @returns {boolean} True if engagement should be marked stale
 */
export const recalculateIsStale = (engagement) => {
  return isEngagementStale(engagement);
};

/**
 * Recalculate daysSinceActivity from a lastActivity date
 * 
 * @param {string} lastActivity - ISO date string of last activity
 * @returns {number} Number of calendar days since last activity
 */
export const recalculateDaysSinceActivity = (lastActivity) => {
  if (!lastActivity) return 0;
  
  const lastActivityDate = new Date(lastActivity);
  const today = new Date();
  const diffTime = Math.abs(today - lastActivityDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Get phase badge classes for displaying current phase status
 * Returns both badge background/text classes and dot color classes
 * Used by ListView and DetailView for consistent phase badge rendering
 * @param {string} status - Phase status (COMPLETE, IN_PROGRESS, BLOCKED, SKIPPED, PENDING)
 * @returns {Object} { badgeClasses: string, dotClasses: string }
 */
export const getPhaseBadgeClasses = (status) => {
  switch (status) {
    case 'COMPLETE':
      return {
        badgeClasses: 'bg-emerald-50 text-emerald-700',
        dotClasses: 'bg-emerald-500'
      };
    case 'IN_PROGRESS':
      return {
        badgeClasses: 'bg-blue-50 text-blue-700',
        dotClasses: 'bg-blue-500'
      };
    case 'BLOCKED':
      return {
        badgeClasses: 'bg-amber-50 text-amber-700',
        dotClasses: 'bg-amber-500'
      };
    case 'SKIPPED':
      return {
        badgeClasses: 'bg-gray-50 text-gray-400',
        dotClasses: 'bg-gray-300'
      };
    case 'PENDING':
    default:
      return {
        badgeClasses: 'bg-gray-100 text-gray-600',
        dotClasses: 'bg-gray-400'
      };
  }
};

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

// ============================================================================
// DEAL SIZE UTILITIES
// ============================================================================

/**
 * Format deal size from number and unit (new structured input)
 * @param {string|number} amount - Numeric amount (e.g., 1.5)
 * @param {string} unit - Unit: 'K' or 'M'
 * @returns {string} Formatted deal size (e.g., "$1.5M")
 */
export const formatDealSizeFromParts = (amount, unit) => {
  if (!amount || !unit) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  
  // Format with up to 2 decimal places, removing trailing zeros
  const formatted = num.toFixed(2).replace(/\.?0+$/, '');
  return `$${formatted}${unit}`;
};

/**
 * Parse existing deal size string into parts for editing
 * @param {string} value - Deal size string (e.g., "$1.5M", "$400K", "500000")
 * @returns {Object} { amount: string, unit: string } or { amount: '', unit: '' } if unparseable
 */
export const parseDealSizeToParts = (value) => {
  if (!value) return { amount: '', unit: '' };
  
  // Handle already formatted strings like "$1.5M" or "$400K"
  const upperValue = value.toUpperCase();
  
  if (upperValue.includes('M')) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      return { amount: num.toString(), unit: 'M' };
    }
  }
  
  if (upperValue.includes('K')) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      return { amount: num.toString(), unit: 'K' };
    }
  }
  
  // Handle raw numbers - try to infer unit
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    if (num >= 1000000) {
      return { amount: (num / 1000000).toString(), unit: 'M' };
    }
    if (num >= 1000) {
      return { amount: (num / 1000).toString(), unit: 'K' };
    }
    // Small numbers - leave as-is with no unit (legacy data)
    return { amount: num.toString(), unit: '' };
  }
  
  // Unparseable - return empty (legacy data will show as-is in display)
  return { amount: '', unit: '' };
};

/**
 * Parse deal size string to number (internal use for pipeline calculations)
 * @param {string} value - Deal size string (e.g., "$50K", "$1.2M")
 * @returns {number} Numeric value
 */
const parseDealSize = (value) => {
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
 * Compute pipeline total from engagements
 * @param {Array} engagements - Array of engagement objects
 * @param {boolean} activeOnly - If true, only count non-archived engagements (default: true)
 * @returns {Object} { total: number, count: number } - Total value and count of deals with sizes
 */
export const computePipelineTotal = (engagements, activeOnly = true) => {
  if (!engagements || !Array.isArray(engagements)) {
    return { total: 0, count: 0 };
  }
  
  let total = 0;
  let count = 0;
  
  engagements.forEach(engagement => {
    // Skip archived if activeOnly is true
    if (activeOnly && engagement.isArchived === true) {
      return;
    }
    
    if (engagement.dealSize) {
      const value = parseDealSize(engagement.dealSize);
      if (value > 0) {
        total += value;
        count++;
      }
    }
  });
  
  return { total, count };
};

/**
 * Format pipeline total for display
 * @param {number} value - Total pipeline value in dollars
 * @returns {string} Formatted string (e.g., "$2.4M", "$850K")
 */
export const formatPipelineTotal = (value) => {
  if (!value || value === 0) return '$0';
  
  if (value >= 1000000) {
    const millions = value / 1000000;
    // Show 1 decimal for values like 2.4M, no decimal for round numbers
    return `$${millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  
  if (value >= 1000) {
    const thousands = value / 1000;
    return `$${thousands.toFixed(0)}K`;
  }
  
  return `$${value}`;
};
