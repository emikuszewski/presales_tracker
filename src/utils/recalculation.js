// ============================================================================
// RECALCULATION UTILITIES (for optimistic updates)
// ============================================================================

import { isEngagementStale } from './phase';

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
