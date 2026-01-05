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
        badgeClasses: 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
        dotClasses: 'bg-emerald-500'
      };
    case 'IN_PROGRESS':
      return {
        badgeClasses: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
        dotClasses: 'bg-blue-500'
      };
    case 'BLOCKED':
      return {
        badgeClasses: 'bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
        dotClasses: 'bg-amber-500 dark:bg-amber-400'
      };
    case 'SKIPPED':
      return {
        badgeClasses: 'bg-gray-50 dark:bg-gray-800 text-gray-400',
        dotClasses: 'bg-gray-300 dark:bg-gray-600'
      };
    case 'PENDING':
    default:
      return {
        badgeClasses: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        dotClasses: 'bg-gray-400 dark:bg-gray-500'
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
    return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
  }
  return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
};
