import React, { useEffect, useRef } from 'react';
import { phaseConfig } from '../../constants';
import { getAvatarColorClasses } from '../../utils';

/**
 * Collapsible filter panel component
 * Contains: Status, View, Phase, Quick Filters (Needs Attention)
 */
const FilterPanel = ({
  isOpen,
  onClose,
  // Filter state
  filterPhase,
  filterOwner,
  filterStale,
  showArchived,
  // Filter actions
  setFilterPhase,
  setFilterOwner,
  setFilterStale,
  setShowArchived,
  // Data
  teamMembers,
  currentUser,
  staleCount
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

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-100"
      style={{
        animation: 'filterPanelSlideDown 0.15s ease-out'
      }}
    >
      {/* Row 1: Status + View */}
      <div className="flex items-start gap-8 mb-5">
        {/* Status (Active/Archived) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                !showArchived 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showArchived 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* View (Owner selector) */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">View</p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setFilterOwner('mine')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterOwner === 'mine' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mine
            </button>
            <button
              onClick={() => setFilterOwner('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterOwner === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Team
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            {/* Team member avatars */}
            {teamMembers.map(member => {
              const isSelected = filterOwner === member.id;
              const isSystemUser = member.isSystemUser === true;
              
              return (
                <button
                  key={member.id}
                  onClick={() => setFilterOwner(member.id)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? isSystemUser
                        ? 'bg-blue-500 text-white ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-900 text-white ring-2 ring-offset-2 ring-gray-900'
                      : isSystemUser
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phase</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterPhase('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterPhase === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Quick Filters */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Filters</p>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStale(!filterStale)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              filterStale 
                ? 'bg-amber-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className={`w-4 h-4 ${filterStale ? 'text-white' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Needs Attention
            <span className={filterStale ? 'text-amber-100' : 'text-amber-600 font-semibold'}>{staleCount}</span>
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
