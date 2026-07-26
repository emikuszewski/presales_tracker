import React from 'react';

/**
 * Google Drive logo icon with official brand colors
 * The triangular drive logo design
 */
const DriveIcon = React.memo(({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Green - left side */}
    <path 
      d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" 
      fill="#0DA960"
    />
    {/* Yellow - top right */}
    <path 
      d="M7.71 3.5H16.29L22.85 15H14.27L7.71 3.5Z" 
      fill="#FFBA00"
    />
    {/* Blue - bottom */}
    <path 
      d="M1.15 15H22.85L19.42 21H4.58L1.15 15Z" 
      fill="#4285F4"
    />
  </svg>
));

DriveIcon.displayName = 'DriveIcon';

export default DriveIcon;
