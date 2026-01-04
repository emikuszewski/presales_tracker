import React, { useState } from 'react';
import { FilterPanel, EngagementCard, SearchIcon, FilterIcon, ChevronUpIcon, ClockIcon, GlobeIcon } from '../components';
import { phaseConfig, phaseLabels } from '../constants';

/**
 * Extract first name from full name for display
 * For system users (like "SE Team"), returns the full name unchanged
 * @param {string} fullName - Full name string
 * @param {boolean} isSystemUser - Whether this is a system user
 * @returns {string} First name or full name for system users
 */
const getFirstName = (fullName, isSystemUser) => {
  if (!fullName) return 'Unknown';
  if (isSystemUser) return fullName;
  
  const parts = fullName.trim().split(' ');
  return parts[0] || fullName;
};

/**
 * Format possessive form of a name
 * Handles names ending in 's' correctly (e.g., "James's")
 * @param {string} name - The name to make possessive
 * @returns {string} Possessive form of the name
 */
const formatPossessive = (name) => {
  if (!name) return "Unknown's";
  return `${name}'s`;
};

/**
 * List view showing all engagements with minimal filter UI
 * - Single control row: Search + Filters button
 * - Collapsible filter panel
 * - Filter chips when non-default filters applied
 * - Pipeline total in subtitle (for active non-archived engagements)
 */
const ListView = ({
  // Data
  engagements,
  teamMembers,
  currentUser,
  staleCount,
  totalInViewMode,
  inProgressInViewMode,
  totalEverythingCount,
  // Pipeline stats
  pipelineTotalFormatted,
  pipelineDealsCount,
  getOwnerInfo,
  // Filter state
  filters,
  filterActions,
  // Navigation
  onSelectEngagement,
  onNavigateToActivity,
  onNewEngagement
}) => {
  const { 
    filterPhase, 
    filterOwner, 
    filterStale, 
    showArchived, 
    showEverything,
    searchQuery 
  } = filters;
  
  const {
    setFilterPhase,
    setFilterOwner,
    setFilterStale,
    setShowArchived,
    setShowEverything,
    setSearchQuery,
    clearAllFilters,
    handleEverythingManualDisable,
    handleEverythingManualEnable
  } = filterActions;

  // Local state for filter panel visibility
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  /**
   * Determine if currently viewing own engagements
   * True if filterOwner is 'mine' OR if viewing self via avatar click
   */
  const isViewingOwnEngagements = filterOwner === 'mine' || filterOwner === currentUser?.id;

  /**
   * Get the first name of the currently filtered owner (for specific team member view)
   * Returns null if viewing 'mine', 'all', or own engagements via avatar
   */
  const getFilteredOwnerFirstName = () => {
    if (filterOwner === 'mine' || filterOwner === 'all' || filterOwner === currentUser?.id) {
      return null;
    }
    const ownerInfo = getOwnerInfo(filterOwner);
    return getFirstName(ownerInfo.name, ownerInfo.isSystemUser);
  };

  // Calculate which filters are non-default (for badge count and chips)
  const nonDefaultFilters = [];
  
  // Everything filter takes precedence over Status/View for display
  if (showEverything) {
    nonDefaultFilters.push({ 
      key: 'everything', 
      label: 'Everything', 
      isBlue: true, 
      onRemove: () => handleEverythingManualDisable() 
    });
  } else {
    if (showArchived) nonDefaultFilters.push({ key: 'status', label: 'Archived', onRemove: () => setShowArchived(false) });
    if (filterOwner !== 'mine') {
      // Use first name for specific team members, "All Team" for all
      const ownerInfo = getOwnerInfo(filterOwner);
      const ownerLabel = filterOwner === 'all' 
        ? 'All Team' 
        : getFirstName(ownerInfo.name, ownerInfo.isSystemUser);
      nonDefaultFilters.push({ key: 'owner', label: `View: ${ownerLabel}`, onRemove: () => setFilterOwner('mine') });
    }
  }
  
  if (filterPhase !== 'all') {
    nonDefaultFilters.push({ key: 'phase', label: `Phase: ${phaseLabels[filterPhase]}`, onRemove: () => setFilterPhase('all') });
  }
  if (filterStale) nonDefaultFilters.push({ key: 'stale', label: 'Needs Attention', isAmber: true, onRemove: () => setFilterStale(false) });

  const hasActiveFilters = nonDefaultFilters.length > 0;

  /**
   * Render the subtitle based on filter state
   * Format: "12 engagements · $2.4M (8 deals) · 5 in progress"
   * Pipeline portion only shown for active (non-archived) view when deals exist
   */
  const renderSubtitle = () => {
    const currentCount = engagements.length;

    // Everything mode
    if (showEverything) {
      return (
        <p className="text-gray-500 text-sm">
          Showing {currentCount} of {totalEverythingCount} total engagements
        </p>
      );
    }

    const modeLabel = showArchived ? 'archived' : 'active';

    if (hasActiveFilters) {
      return (
        <p className="text-gray-500 text-sm">
          Showing {currentCount} of {totalInViewMode} {modeLabel}
        </p>
      );
    }

    // Unfiltered state
    if (showArchived) {
      return (
        <p className="text-gray-500 text-sm">
          {currentCount} engagement{currentCount !== 1 ? 's' : ''}
        </p>
      );
    }

    // Active unfiltered: show rich stats including pipeline total
    // Format: "12 engagements · $2.4M (8 deals) · 5 in progress"
    const parts = [];
    
    // Engagement count
    parts.push(`${currentCount} engagement${currentCount !== 1 ? 's' : ''}`);
    
    // Pipeline total - only if there are deals with sizes
    if (pipelineDealsCount > 0) {
      parts.push(
        <span key="pipeline" className="text-gray-700 font-medium">
          {pipelineTotalFormatted}
        </span>
      );
      parts.push(`(${pipelineDealsCount} deal${pipelineDealsCount !== 1 ? 's' : ''})`);
    }
    
    // In progress count
    parts.push(`${inProgressInViewMode} in progress`);
    
    // Stale count if any
    if (staleCount > 0) {
      parts.push(
        <span key="stale" className="text-amber-600">
          {staleCount} need attention
        </span>
      );
    }

    return (
      <p className="text-gray-500 text-sm">
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && ' · '}
            {part}
          </React.Fragment>
        ))}
      </p>
    );
  };

  /**
   * Render header title based on filter state
   * Reflects ownership: My, All, or [Name]'s
   * Reflects status: Active (default, no label) or Archived
   */
  const renderTitle = () => {
    // Everything mode - special case, shows all engagements across all filters
    if (showEverything) {
      return 'All Engagements';
    }

    // Determine the ownership prefix
    let ownerPrefix;
    if (isViewingOwnEngagements) {
      ownerPrefix = 'My';
    } else if (filterOwner === 'all') {
      ownerPrefix = 'All';
    } else {
      // Specific team member - use possessive first name
      const firstName = getFilteredOwnerFirstName();
      ownerPrefix = formatPossessive(firstName);
    }

    // Combine with archived status
    if (showArchived) {
      return `${ownerPrefix} Archived Engagements`;
    }
    
    return `${ownerPrefix} Engagements`;
  };

  /**
   * Render empty state message based on filter state
   * Personalized by ownership context
   */
  const renderEmptyState = () => {
    // If filters are active (beyond just owner/status), show filter message
    if (hasActiveFilters) {
      return (
        <div>
          <p className="text-gray-400 mb-3">No engagements match your filters</p>
          <button
            onClick={clearAllFilters}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Clear all filters
          </button>
        </div>
      );
    }

    // Everything mode
    if (showEverything) {
      return <p className="text-gray-400">No engagements yet</p>;
    }

    // Personalized empty states based on ownership
    if (isViewingOwnEngagements) {
      // Viewing own engagements
      if (showArchived) {
        return <p className="text-gray-400">You don't have any archived engagements</p>;
      }
      return <p className="text-gray-400">You don't have any engagements yet</p>;
    } else if (filterOwner === 'all') {
      // Viewing all team engagements
      if (showArchived) {
        return <p className="text-gray-400">No archived team engagements</p>;
      }
      return <p className="text-gray-400">No team engagements yet</p>;
    } else {
      // Viewing specific team member's engagements
      const firstName = getFilteredOwnerFirstName();
      if (showArchived) {
        return <p className="text-gray-400">{firstName} doesn't have any archived engagements</p>;
      }
      return <p className="text-gray-400">{firstName} doesn't have any engagements yet</p>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {renderTitle()}
          </h2>
          {renderSubtitle()}
        </div>
        <button 
          onClick={onNewEngagement}
          className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New Engagement
        </button>
      </div>

      {/* Minimal Control Row: Search + Filters Button */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search engagements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        
        {/* Filters Button */}
        <button
          id="filter-panel-toggle"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`px-4 py-2.5 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            isFilterPanelOpen
              ? 'border-gray-900 bg-gray-50 text-gray-900'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FilterIcon className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {nonDefaultFilters.length}
            </span>
          )}
          {isFilterPanelOpen && (
            <ChevronUpIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Filter Panel (collapsible) */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filterPhase={filterPhase}
        filterOwner={filterOwner}
        filterStale={filterStale}
        showArchived={showArchived}
        showEverything={showEverything}
        setFilterPhase={setFilterPhase}
        setFilterOwner={setFilterOwner}
        setFilterStale={setFilterStale}
        setShowArchived={setShowArchived}
        setShowEverything={setShowEverything}
        onEverythingManualEnable={handleEverythingManualEnable}
        teamMembers={teamMembers}
        currentUser={currentUser}
        staleCount={staleCount}
        totalEverythingCount={totalEverythingCount}
      />

      {/* Filter Chips (only when non-default filters active) */}
      {hasActiveFilters && !isFilterPanelOpen && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-400">Filtered by:</span>
          
          {nonDefaultFilters.map((filter) => (
            <span
              key={filter.key}
              className={`inline-flex items-center gap-1 pl-3 pr-1 py-1 text-sm rounded-full ${
                filter.isAmber
                  ? 'bg-amber-100 text-amber-700'
                  : filter.isBlue
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.isAmber && (
                <ClockIcon className="w-3.5 h-3.5" />
              )}
              {filter.isBlue && (
                <GlobeIcon className="w-3.5 h-3.5" />
              )}
              {filter.label}
              <button
                onClick={filter.onRemove}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  filter.isAmber
                    ? 'hover:bg-amber-200 text-amber-500 hover:text-amber-700'
                    : filter.isBlue
                    ? 'hover:bg-blue-200 text-blue-500 hover:text-blue-700'
                    : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                ×
              </button>
            </span>
          ))}

          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-800 ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Engagement Cards */}
      <div className="space-y-3">
        {engagements.map(engagement => (
          <EngagementCard
            key={engagement.id}
            engagement={engagement}
            currentUser={currentUser}
            getOwnerInfo={getOwnerInfo}
            showEverything={showEverything}
            onSelect={onSelectEngagement}
            onActivityClick={onNavigateToActivity}
          />
        ))}
        
        {/* Empty State */}
        {engagements.length === 0 && (
          <div className="text-center py-12">
            {renderEmptyState()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
