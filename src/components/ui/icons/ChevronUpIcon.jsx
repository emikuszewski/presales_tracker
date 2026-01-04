import React from 'react';

/**
 * Chevron up icon for collapsible sections
 */
const ChevronUpIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
));

ChevronUpIcon.displayName = 'ChevronUpIcon';

export default ChevronUpIcon;
