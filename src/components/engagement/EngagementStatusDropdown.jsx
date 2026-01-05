import React, { useState } from 'react';
import { EngagementStatusIcon, ChevronDownIcon } from '../ui';
import { engagementStatusLabels } from '../../constants';
import { getEngagementStatusBadgeClasses } from '../../utils';

/**
 * All engagement status options (derived from constants)
 */
const ALL_STATUSES = Object.keys(engagementStatusLabels);

/**
 * Engagement Status Dropdown component
 * Click to change status, similar to phase status dropdown
 * Uses SVG icons instead of emojis for consistent styling
 */
const EngagementStatusDropdown = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusLabel = engagementStatusLabels[currentStatus];

  const handleSelect = (newStatus) => {
    if (newStatus !== currentStatus) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80 ${getEngagementStatusBadgeClasses(currentStatus)}`}
      >
        <EngagementStatusIcon status={currentStatus} className="w-3.5 h-3.5" />
        {statusLabel}
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {ALL_STATUSES.map(status => {
              const label = engagementStatusLabels[status];
              const isSelected = status === currentStatus;
              
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 ${isSelected ? 'bg-gray-50 dark:bg-gray-800 font-medium' : ''}`}
                >
                  <span className={getEngagementStatusBadgeClasses(status).replace('bg-', 'text-').split(' ')[1] || 'text-gray-600 dark:text-gray-400'}>
                    <EngagementStatusIcon status={status} className="w-4 h-4" />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default EngagementStatusDropdown;
