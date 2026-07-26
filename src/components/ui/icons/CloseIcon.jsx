import React from 'react';

/**
 * Close/X icon for dismissing modals, panels, tags
 */
const CloseIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
));

CloseIcon.displayName = 'CloseIcon';

export default CloseIcon;
