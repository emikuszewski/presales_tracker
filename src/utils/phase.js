// ============================================================================
// PHASE UTILITIES
// ============================================================================

import { STALE_THRESHOLD_BUSINESS_DAYS } from '../constants';
import { getBusinessDaysBetween } from './date';

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
