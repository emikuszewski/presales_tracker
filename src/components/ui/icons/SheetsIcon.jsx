import React from 'react';

/**
 * Google Sheets logo icon with official brand colors
 * Green spreadsheet icon with grid cells
 */
const SheetsIcon = React.memo(({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document background */}
    <path 
      d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" 
      fill="#34A853"
    />
    {/* Folded corner */}
    <path 
      d="M14 2v6h6l-6-6z" 
      fill="#8ED1A0"
    />
    {/* Spreadsheet grid */}
    <rect x="7" y="11" width="10" height="7" rx="0.5" fill="white" />
    <line x1="11" y1="11" x2="11" y2="18" stroke="#34A853" strokeWidth="0.75" />
    <line x1="7" y1="14" x2="17" y2="14" stroke="#34A853" strokeWidth="0.75" />
  </svg>
));

SheetsIcon.displayName = 'SheetsIcon';

export default SheetsIcon;
