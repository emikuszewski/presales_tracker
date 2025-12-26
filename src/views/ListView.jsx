import React, { useState } from 'react';
import { OwnersDisplay, StaleBadge, NotificationBadge, FilterPanel, IntegrationLinksIndicator } from '../components';
import { industryLabels, phaseConfig, phaseLabels, engagementStatusLabels, engagementStatusIcons } from '../constants';
import { 
  getEngagementStatusBorderClasses, 
  getEngagementStatusBadgeClasses,
  shouldShowStale 
} from '../utils';

/**
 * List view showing all engagements with minimal filter UI
 * - Single control row: Search + Filters button
 * - Collapsible filter panel
 * - Filter chips when non-default filters applied
 */
const ListView = ({
  // Data
  engagements,
  teamMembers,
  currentUser,
  staleCount,
  totalInViewMode,
  inProgressInViewMode,
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
    searchQuery 
  } = filters;
  
  const {
    setFilterPhase,
    setFilterOwner,
    setFilterStale,
    setShowArchived,
    setSearchQuery,
    clearAllFilters
  } = filterActions;

  // Local state for filter panel visibility
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Calculate which filters are non-default (for badge count and chips)
  const nonDefaultFilters = [];
  if (showArchived) nonDefaultFilters.push({ key: 'status', label: 'Archived', onRemove: () => setShowArchived(false) });
  if (filterOwner !== 'mine') {
    const ownerLabel = filterOwner === 'all' ? 'All Team' : getOwnerInfo(filterOwner).name;
    nonDefaultFilters.push({ key: 'owner', label: `View: ${ownerLabel}`, onRemove: () => setFilterOwner('mine') });
  }
  if (filterPhase !== 'all') {
    nonDefaultFilters.push({ key: 'phase', label: `Phase: ${phaseLabels[filterPhase]}`, onRemove: () => setFilterPhase('all') });
  }
  if (filterStale) nonDefaultFilters.push({ key: 'stale', label: 'Needs Attention', isAmber: true, onRemove: () => setFilterStale(false) });

  const hasActiveFilters = nonDefaultFilters.length > 0;

  /**
   * Get color for phase status dot
   * @param {string} status - Phase status
   * @returns {string} Tailwind CSS class for background color
   */
  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'BLOCKED': return 'bg-amber-500';
      case 'SKIPPED': return 'bg-gray-300';
      default: return 'bg-gray-200';
    }
  };

  /**
   * Handle click on "Last activity" link
   * Navigates to detail view and scrolls to the most recent activity
   */
  const handleLastActivityClick = (e, engagement) => {
    e.stopPropagation();
    const lastActivityId = engagement.activities?.[0]?.id;
    if (lastActivityId) {
      onNavigateToActivity(engagement.id, lastActivityId);
    }
  };

  /**
   * Render the subtitle based on filter state
   */
  const renderSubtitle = () => {
    const currentCount = engagements.length;
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

    // Active unfiltered: show rich stats
    return (
      <p className="text-gray-500 text-sm">
        {currentCount} engagement{currentCount !== 1 ? 's' : ''}
        {` · ${inProgressInViewMode} in progress`}
        {staleCount > 0 && (
          <span className="text-amber-600"> · {staleCount} need attention</span>
        )}
      </p>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {showArchived ? 'Archived Engagements' : 'Engagements'}
          </h2>
          {renderSubtitle()}
        </div>
        {!showArchived && (
          <button 
            onClick={onNewEngagement}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            + New Engagement
          </button>
        )}
      </div>

      {/* Minimal Control Row: Search + Filters Button */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {nonDefaultFilters.length}
            </span>
          )}
          {isFilterPanelOpen && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
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
        setFilterPhase={setFilterPhase}
        setFilterOwner={setFilterOwner}
        setFilterStale={setFilterStale}
        setShowArchived={setShowArchived}
        teamMembers={teamMembers}
        currentUser={currentUser}
        staleCount={staleCount}
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
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.isAmber && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {filter.label}
              <button
                onClick={filter.onRemove}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  filter.isAmber
                    ? 'hover:bg-amber-200 text-amber-500 hover:text-amber-700'
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
        {engagements.map(engagement => {
          const hasActivities = engagement.activities?.length > 0;
          const engagementStatus = engagement.engagementStatus || 'ACTIVE';
          const statusBorderClasses = getEngagementStatusBorderClasses(engagementStatus);
          const showStale = shouldShowStale(engagement);
          const statusIcon = engagementStatusIcons[engagementStatus];
          const statusLabel = engagementStatusLabels[engagementStatus];
          
          return (
            <div
              key={engagement.id}
              onClick={() => onSelectEngagement(engagement.id)}
              className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer ${statusBorderClasses}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <OwnersDisplay ownerIds={engagement.ownerIds} size="md" getOwnerInfo={getOwnerInfo} currentUserId={currentUser?.id} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{engagement.company}</h3>
                      {engagement.unreadChanges > 0 && (
                        <NotificationBadge count={engagement.unreadChanges} />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{engagement.contactName} · {industryLabels[engagement.industry] || engagement.industry}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-900">{engagement.dealSize || '—'}</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    {hasActivities ? (
                      <button
                        onClick={(e) => handleLastActivityClick(e, engagement)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Last activity: {engagement.lastActivity || engagement.startDate}
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Last activity: {engagement.lastActivity || engagement.startDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Simplified Bottom Row: Compact Phase Dots + Phase Badge + Status Badge + Stale Badge + Links Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Compact Phase Dots */}
                  <div className="flex items-center gap-1">
                    {phaseConfig.map((phase) => {
                      const phaseData = engagement.phases[phase.id];
                      const status = phaseData?.status || 'PENDING';
                      return (
                        <div
                          key={phase.id}
                          className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`}
                          title={`${phase.label}: ${status.toLowerCase().replace('_', ' ')}`}
                        />
                      );
                    })}
                  </div>

                  {/* Current Phase Badge */}
                  {(() => {
                    const currentPhaseData = engagement.phases[engagement.currentPhase];
                    const currentStatus = currentPhaseData?.status || 'PENDING';
                    const phaseLabel = phaseLabels[engagement.currentPhase] || engagement.currentPhase;
                    
                    let badgeClasses, dotClasses;
                    if (currentStatus === 'COMPLETE') {
                      badgeClasses = 'bg-emerald-50 text-emerald-700';
                      dotClasses = 'bg-emerald-500';
                    } else if (currentStatus === 'IN_PROGRESS') {
                      badgeClasses = 'bg-blue-50 text-blue-700';
                      dotClasses = 'bg-blue-500';
                    } else if (currentStatus === 'BLOCKED') {
                      badgeClasses = 'bg-amber-50 text-amber-700';
                      dotClasses = 'bg-amber-500';
                    } else if (currentStatus === 'SKIPPED') {
                      badgeClasses = 'bg-gray-50 text-gray-400';
                      dotClasses = 'bg-gray-300';
                    } else {
                      badgeClasses = 'bg-gray-100 text-gray-600';
                      dotClasses = 'bg-gray-400';
                    }

                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${badgeClasses}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>
                        {phaseLabel}
                      </span>
                    );
                  })()}

                  {/* Engagement Status Badge - hidden for ACTIVE (default state) */}
                  {engagementStatus !== 'ACTIVE' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getEngagementStatusBadgeClasses(engagementStatus)}`}>
                      {statusIcon && <span>{statusIcon}</span>}
                      {statusLabel}
                    </span>
                  )}

                  {/* Stale Badge - only for ACTIVE status engagements */}
                  {showStale && (
                    <StaleBadge daysSinceActivity={engagement.daysSinceActivity} />
                  )}
                </div>

                {/* Integration Links Indicator */}
                <IntegrationLinksIndicator engagement={engagement} />
              </div>
            </div>
          );
        })}
        
        {/* Empty State */}
        {engagements.length === 0 && (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <div>
                <p className="text-gray-400 mb-3">No engagements match your filters</p>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <p className="text-gray-400">
                {showArchived ? 'No archived engagements' : 'No engagements yet'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
