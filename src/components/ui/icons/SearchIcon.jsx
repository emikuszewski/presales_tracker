import React from 'react';

/**
 * Search/magnifying glass icon for search inputs
 */
const SearchIcon = React.memo(({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
));

SearchIcon.displayName = 'SearchIcon';

export default SearchIcon;
