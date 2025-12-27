import React, { useState, useEffect, useRef } from 'react';

/**
 * Avatar dropdown menu for user actions
 * Handles its own open/close state, click-outside, and ESC key
 */
const AvatarMenu = ({ currentUser, onTeamClick, onEngagementsClick, onSalesRepsClick, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape to close
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
          {currentUser?.initials}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
          style={{ animation: 'avatarMenuFadeIn 0.15s ease-out' }}
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                {currentUser?.initials}
              </div>
              <p className="font-medium text-gray-900">{currentUser?.name}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Team Management - Only for Admins */}
            {currentUser?.isAdmin && (
              <>
                <button
                  onClick={() => {
                    onTeamClick();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Team Management</p>
                    <p className="text-xs text-gray-500">Manage users & permissions</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onEngagementsClick();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Engagement Management</p>
                    <p className="text-xs text-gray-500">Delete engagements</p>
                  </div>
                </button>
              </>
            )}

            {/* Sales Reps - visible to everyone */}
            <button
              onClick={() => {
                onSalesRepsClick();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sales Reps</p>
                <p className="text-xs text-gray-500">Manage AE assignments</p>
              </div>
            </button>

            {/* Divider before Sign Out */}
            <div className="my-1 border-t border-gray-100" />

            {/* Sign Out */}
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Sign Out</p>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes avatarMenuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AvatarMenu;
