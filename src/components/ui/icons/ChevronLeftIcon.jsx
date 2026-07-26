import React from 'react';

/**
 * Chevron left icon for back navigation
 */
const ChevronLeftIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
));

ChevronLeftIcon.displayName = 'ChevronLeftIcon';

export default ChevronLeftIcon;
