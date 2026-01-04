import React from 'react';

/**
 * Restore icon - box with up arrow for restoring from archive
 */
const RestoreIcon = React.memo(({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4l3-3m0 0l3 3m-3-3v7" />
  </svg>
));

RestoreIcon.displayName = 'RestoreIcon';

export default RestoreIcon;
