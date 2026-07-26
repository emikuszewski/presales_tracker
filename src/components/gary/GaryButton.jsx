/**
 * GaryButton - Floating Action Button for Gary
 * 
 * Coffee cup icon fixed to bottom-right corner.
 * Shows notification badge when Gary has proactive insights.
 * Hidden on mobile (<1024px) and when panel is open.
 */

import React from 'react';

const GaryButton = ({ onClick, isVisible, hasNotification = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-30
        w-12 h-12 
        bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white 
        rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-offset-2 dark:focus:ring-offset-gray-950
        hidden lg:flex
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
      `}
      aria-label="Ask Gary"
      title="Ask Gary"
    >
      {/* Coffee cup emoji */}
      <span className="text-lg" role="img" aria-label="coffee">☕</span>
      
      {/* Notification badge */}
      {hasNotification && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 dark:bg-amber-400 rounded-full flex items-center justify-center">
          <span className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></span>
        </span>
      )}
    </button>
  );
};

export default GaryButton;
