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
