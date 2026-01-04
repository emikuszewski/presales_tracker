import React from 'react';

/**
 * Google Slides logo icon with official brand colors
 * Yellow/gold presentation icon
 */
const SlidesIcon = React.memo(({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document background */}
    <path 
      d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" 
      fill="#FBBC04"
    />
    {/* Folded corner */}
    <path 
      d="M14 2v6h6l-6-6z" 
      fill="#E8A400"
    />
    {/* Presentation slide rectangle */}
    <rect 
      x="8" 
      y="12" 
      width="8" 
      height="6" 
      rx="0.5"
      fill="white"
    />
  </svg>
));

SlidesIcon.displayName = 'SlidesIcon';

export default SlidesIcon;
