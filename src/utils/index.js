// ============================================================================
// UTILS BARREL EXPORT
// Re-exports all utilities for backward compatibility
// ============================================================================

// Array utilities
export { groupBy } from './array';

// Date utilities
export { 
  formatDate, 
  formatDateTime, 
  formatRelativeTime, 
  getBusinessDaysBetween 
} from './date';

// Parsing utilities
export { parseLinks, safeJsonParse } from './parsing';

// Engagement status utilities
export { 
  CLOSED_STATUSES, 
  isClosedStatus, 
  shouldShowStale, 
  getEngagementStatusBorderClasses, 
  getEngagementStatusBadgeClasses, 
  getClosedBannerClasses 
} from './engagementStatus';

// Phase utilities
export { 
  getDerivedCurrentPhase, 
  isEngagementStale, 
  getDaysSinceActivity 
} from './phase';

// Recalculation utilities
export { 
  recalculateLastActivity, 
  recalculateIsStale, 
  recalculateDaysSinceActivity 
} from './recalculation';

// UI utilities
export { getPhaseBadgeClasses, getAvatarColorClasses } from './ui';

// Deal size utilities
export { 
  formatDealSizeFromParts, 
  parseDealSizeToParts, 
  computePipelineTotal, 
  formatPipelineTotal 
} from './dealSize';
