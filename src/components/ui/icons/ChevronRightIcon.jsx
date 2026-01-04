import React from 'react';

/**
 * Chevron right icon for expandable items and navigation
 */
const ChevronRightIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
));

ChevronRightIcon.displayName = 'ChevronRightIcon';

export default ChevronRightIcon;
