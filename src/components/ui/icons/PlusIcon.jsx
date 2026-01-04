import React from 'react';

/**
 * Plus icon for add actions
 */
const PlusIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
));

PlusIcon.displayName = 'PlusIcon';

export default PlusIcon;
