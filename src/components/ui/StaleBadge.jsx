import React from 'react';
import ClockIcon from './icons/ClockIcon';

/**
 * Displays a badge indicating how many days an engagement has been stale
 */
const StaleBadge = React.memo(({ daysSinceActivity }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
    <ClockIcon className="w-3 h-3" />
    {daysSinceActivity}d stale
  </span>
));

StaleBadge.displayName = 'StaleBadge';

export default StaleBadge;
