import React from 'react';

/**
 * Google Docs logo icon with official brand colors
 * Blue document with text lines
 */
const DocsIcon = React.memo(({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document background */}
    <path 
      d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" 
      fill="#4285F4"
    />
    {/* Folded corner */}
    <path 
      d="M14 2v6h6l-6-6z" 
      fill="#A1C2FA"
    />
    {/* Text lines */}
    <path 
      d="M8 12h8v1.5H8V12zm0 3h8v1.5H8V15zm0-6h5v1.5H8V9z" 
      fill="white"
    />
  </svg>
));

DocsIcon.displayName = 'DocsIcon';

export default DocsIcon;
