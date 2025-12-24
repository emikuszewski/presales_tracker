import React from 'react';
import { OwnersDisplay, StaleBadge, NotificationBadge } from '../components';
import { industryLabels, phaseConfig } from '../constants';

/**
 * List view showing all engagements with filters
 */
const ListView = ({
  // Data
  engagements,
  teamMembers,
  currentUser,
  staleCount,
  getOwnerInfo,
  // Filter state
  filters,
  filterActions,
  // Navigation
  onSelectEngagement,
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
    setSearchQuery
  } = filterActions;

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {showArchived ? 'Archived Engagements' : 
              filterOwner === 'mine' ? 'My Engagements' : 
              filterOwner === 'all' ? 'All Team Engagements' : 
              `${getOwnerInfo(filterOwner).name}'s Engagements`}
          </h2>
          <p className="text-gray-500 mt-1">
            {engagements.length} engagement{engagements.length !== 1 ? 's' : ''}
            {!showArchived && ` · ${engagements.filter(e => e.phases[e.currentPhase]?.status === 'IN_PROGRESS').length} in progress`}
            {!showArchived && staleCount > 0 && (
              <span className="text-amber-600"> · {staleCount} need attention</span>
            )}
          </p>
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

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by company, contact, or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !showArchived ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showArchived ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {!showArchived && (
        <>
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">View</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterOwner('mine')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterOwner === 'mine' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                My Engagements
              </button>
              <button
                onClick={() => setFilterOwner('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterOwner === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Team
              </button>
              <div className="w-px bg-gray-200 mx-2" />
              {teamMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => setFilterOwner(member.id)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    filterOwner === member.id 
                      ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={member.name}
                >
                  {member.initials}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterPhase('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterPhase === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Phases
            </button>
            {phaseConfig.map(phase => (
              <button
                key={phase.id}
                onClick={() => setFilterPhase(phase.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterPhase === phase.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <button
              onClick={() => setFilterStale(!filterStale)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                filterStale ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Needs Attention ({staleCount})
            </button>
          </div>
        </>
      )}

      <div className="space-y-3">
        {engagements.map(engagement => (
          <div
            key={engagement.id}
            onClick={() => onSelectEngagement(engagement.id)}
            className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer ${
              engagement.isStale ? 'border-amber-200' : 'border-gray-200 hover:border-gray-300'
            }`}
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
                  {engagement.isStale && (
                    <StaleBadge daysSinceActivity={engagement.daysSinceActivity} />
                  )}
                  {!engagement.isStale && (
                    <p className="text-xs text-gray-400">Last activity: {engagement.lastActivity || engagement.startDate}</p>
                  )}
                </div>
              </div>
            </div>
            
            {(engagement.salesforceId || engagement.jiraTicket) && (
              <div className="flex gap-2 mb-3">
                {engagement.salesforceId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">SF</span>
                )}
                {engagement.jiraTicket && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">{engagement.jiraTicket}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {phaseConfig.map((phase, index) => {
                const phaseData = engagement.phases[phase.id];
                const status = phaseData?.status || 'PENDING';
                return (
                  <React.Fragment key={phase.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <span className={`text-xs font-medium ${
                        status === 'COMPLETE' ? 'text-emerald-700' : 
                        status === 'IN_PROGRESS' ? 'text-blue-700' : 'text-gray-400'
                      }`}>
                        {phase.label}
                      </span>
                    </div>
                    {index < phaseConfig.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${
                        status === 'COMPLETE' ? 'bg-emerald-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
        
        {engagements.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {showArchived ? 'No archived engagements' : 
              filterStale ? 'No stale engagements - great job!' :
              'No engagements found with current filters'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
