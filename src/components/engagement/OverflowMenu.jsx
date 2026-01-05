import React, { useState, useEffect, useRef } from 'react';
import { EllipsisIcon, PencilIcon, UsersIcon, GearIcon, ArchiveIcon, RestoreIcon } from '../ui';

/**
 * Three-dot overflow menu component
 * Contains: Edit Details, Manage Owners, Edit Integrations, divider, Archive/Restore
 */
const OverflowMenu = ({ 
  isArchived, 
  onEditDetails, 
  onManageOwners, 
  onEditIntegrations, 
  onArchive 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleMenuItemClick = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="More options"
      >
        <EllipsisIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
          style={{ animation: 'menuFadeIn 0.1s ease-out' }}
        >
          {/* Edit Details */}
          <button
            onClick={() => handleMenuItemClick(onEditDetails)}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5"
          >
            <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Edit Details
          </button>

          {/* Manage Owners */}
          <button
            onClick={() => handleMenuItemClick(onManageOwners)}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5"
          >
            <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Manage Owners
          </button>

          {/* Edit Integrations */}
          <button
            onClick={() => handleMenuItemClick(onEditIntegrations)}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5"
          >
            <GearIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Edit Integrations
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

          {/* Archive / Restore */}
          {isArchived ? (
            <button
              onClick={() => handleMenuItemClick(onArchive)}
              className="w-full px-3 py-2 text-left text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center gap-2.5"
            >
              <RestoreIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              Restore
            </button>
          ) : (
            <button
              onClick={() => handleMenuItemClick(onArchive)}
              className="w-full px-3 py-2 text-left text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-2.5"
            >
              <ArchiveIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Archive
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
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

export default OverflowMenu;
