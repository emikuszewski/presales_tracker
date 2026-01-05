import React, { useEffect, useRef } from 'react';
import { phaseConfig } from '../../constants';
import { getAvatarColorClasses } from '../../utils';
import { GlobeIcon, ClockIcon } from '../ui';

/**
 * Collapsible filter panel component
 * Contains: Status, View, Phase, Quick Filters (Needs Attention, Everything)
 */
const FilterPanel = ({
  isOpen,
  onClose,
  // Filter state
  filterPhase,
  filterOwner,
  filterStale,
  showArchived,
  showEverything,
  // Filter actions
  setFilterPhase,
  setFilterOwner,
  setFilterStale,
  setShowArchived,
  setShowEverything,
  onEverythingManualEnable,
  // Data
  teamMembers,
  currentUser,
  staleCount,
  totalEverythingCount
}) => {
  const panelRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Check if click was on the filter button itself (handled by parent)
        const filterButton = document.getElementById('filter-panel-toggle');
        if (filterButton && filterButton.contains(event.target)) {
          return;
        }
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close on open click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handler for Status buttons - auto-exits Everything mode
  const handleStatusClick = (isArchived) => {
    setShowArchived(isArchived);
    setShowEverything(false); // Auto-exit Everything mode
  };

  // Handler for View buttons - auto-exits Everything mode
  const handleViewClick = (owner) => {
    setFilterOwner(owner);
    setShowEverything(false); // Auto-exit Everything mode
  };

  // Handler for Everything toggle
  const handleEverythingClick = () => {
    if (showEverything) {
      // Turning off - just use setShowEverything
      setShowEverything(false);
    } else {
      // Turning on - use manual enable handler to clear override flag
      if (onEverythingManualEnable) {
        onEverythingManualEnable();
      } else {
        setShowEverything(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-100 dark:border-gray-700"
      style={{
        animation: 'filterPanelSlideDown 0.15s ease-out'
      }}
    >
      {/* Row 1: Status + View */}
      <div className="flex items-start gap-8 mb-5">
        {/* Status (Active/Archived) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusClick(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                !showArchived && !showEverything
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusClick(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showArchived && !showEverything
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* View (Owner selector) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">View</p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handleViewClick('mine')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterOwner === 'mine' && !showEverything
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Mine
            </button>
            <button
              onClick={() => handleViewClick('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterOwner === 'all' && !showEverything
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              All Team
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1"></div>
            {/* Team member avatars */}
            {teamMembers.map(member => {
              const isSelected = filterOwner === member.id && !showEverything;
              const isSystemUser = member.isSystemUser === true;
              
              return (
                <button
                  key={member.id}
                  onClick={() => handleViewClick(member.id)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? isSystemUser
                        ? 'bg-blue-500 text-white ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-blue-500'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-gray-900 dark:ring-gray-100'
                      : isSystemUser
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  title={`${member.name}${isSystemUser ? ' (Shared Pool)' : ''}`}
                >
                  {member.initials}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Phase */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Phase</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterPhase('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterPhase === 'all' 
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {phaseConfig.map(phase => (
            <button
              key={phase.id}
              onClick={() => setFilterPhase(phase.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterPhase === phase.id 
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Quick Filters */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quick Filters</p>
        <div className="flex gap-2">
          {/* Needs Attention */}
          <button
            onClick={() => setFilterStale(!filterStale)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              filterStale 
                ? 'bg-amber-500 text-white' 
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <ClockIcon className={`w-4 h-4 ${filterStale ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`} />
            Needs Attention
            <span className={filterStale ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400 font-semibold'}>{staleCount}</span>
          </button>

          {/* Everything */}
          <button
            onClick={handleEverythingClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              showEverything 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <GlobeIcon className={`w-4 h-4 ${showEverything ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
            Everything
            <span className={showEverything ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400 font-semibold'}>{totalEverythingCount}</span>
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes filterPanelSlideDown {
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

export default FilterPanel;
