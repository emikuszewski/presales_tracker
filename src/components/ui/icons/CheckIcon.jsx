import React from 'react';

/**
 * Checkmark icon for success states
 */
const CheckIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
));

CheckIcon.displayName = 'CheckIcon';

export default CheckIcon;
