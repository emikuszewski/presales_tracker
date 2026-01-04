// ============================================================================
// RECALCULATION UTILITIES (for optimistic updates)
// ============================================================================

import { isEngagementStale } from './phase';

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
