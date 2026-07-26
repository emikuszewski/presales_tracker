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
    ACTIVE: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    ON_HOLD: 'border-purple-300 dark:border-purple-700',
    UNRESPONSIVE: 'border-amber-300 dark:border-amber-700',
    WON: 'border-green-300 dark:border-green-700',
    LOST: 'border-red-300 dark:border-red-700',
    DISQUALIFIED: 'border-red-300 dark:border-red-700',
    NO_DECISION: 'border-gray-300 dark:border-gray-600'
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
    ACTIVE: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    ON_HOLD: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    UNRESPONSIVE: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    WON: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    LOST: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    DISQUALIFIED: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    NO_DECISION: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-300',
      icon: '🎉'
    },
    LOST: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-800 dark:text-red-300',
      icon: '❌'
    },
    DISQUALIFIED: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-700 dark:text-red-300',
      icon: '🚫'
    },
    NO_DECISION: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: '➖'
    }
  };
  return styles[status] || styles.NO_DECISION;
};
