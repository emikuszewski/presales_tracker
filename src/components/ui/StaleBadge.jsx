import React from 'react';

/**
 * Displays a badge indicating how many days an engagement has been stale
 */
const StaleBadge = React.memo(({ daysSinceActivity }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {daysSinceActivity}d stale
  </span>
));

StaleBadge.displayName = 'StaleBadge';

export default StaleBadge;
