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
