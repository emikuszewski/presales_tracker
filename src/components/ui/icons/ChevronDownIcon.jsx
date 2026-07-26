import React from 'react';

/**
 * Chevron down icon for dropdowns and expandable sections
 */
const ChevronDownIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
));

ChevronDownIcon.displayName = 'ChevronDownIcon';

export default ChevronDownIcon;
