// Engagement-specific utility functions

import { STALE_THRESHOLD_BUSINESS_DAYS } from '../constants';

/**
 * Safely parse links from Amplify JSON field
 * @param {*} links - Links data (could be array, string, or null)
 * @returns {Array} Parsed links array
 */
export const parseLinks = (links) => {
  if (!links) return [];
  if (Array.isArray(links)) return links;
  if (typeof links === 'string') {
    try {
      const parsed = JSON.parse(links);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing links:', e);
      return [];
    }
  }
  return [];
};

/**
 * Calculate business days between two dates
 * @param {string|Date} fromDate - Start date
 * @param {string|Date} toDate - End date
 * @returns {number} Number of business days
 */
export const getBusinessDaysDiff = (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  let count = 0;
  const current = new Date(from);
  
  while (current < to) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
};

/**
 * Check if engagement is stale (no activity for threshold days)
 * @param {Object} engagement - Engagement object
 * @returns {boolean} True if stale
 */
export const isEngagementStale = (engagement) => {
  if (engagement.isArchived) return false;
  const lastDate = engagement.lastActivity || engagement.startDate;
  if (!lastDate) return false;
  const businessDays = getBusinessDaysDiff(lastDate, new Date());
  return businessDays >= STALE_THRESHOLD_BUSINESS_DAYS;
};

/**
 * Get number of business days since last activity
 * @param {Object} engagement - Engagement object
 * @returns {number} Days since last activity
 */
export const getDaysSinceActivity = (engagement) => {
  const lastDate = engagement.lastActivity || engagement.startDate;
  if (!lastDate) return 0;
  return getBusinessDaysDiff(lastDate, new Date());
};
