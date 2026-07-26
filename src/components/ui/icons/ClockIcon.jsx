import React from 'react';

/**
 * Clock icon for time-related displays (history, stale indicators)
 */
const ClockIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
));

ClockIcon.displayName = 'ClockIcon';

export default ClockIcon;
