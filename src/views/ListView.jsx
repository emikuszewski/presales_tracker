import React from 'react';
import { OwnersDisplay, StaleBadge, NotificationBadge, SlackIcon, DriveIcon, DocsIcon, SlidesIcon, SheetsIcon } from '../components';
import { industryLabels, phaseConfig } from '../constants';
import { getAvatarColorClasses } from '../utils';

/**
 * List view showing all engagements with filters
 * SE Team appears in the owner filter row alongside regular team members
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
    setSearchQuery
  } = filterActions;

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  /**
   * Handle click on "Last activity" link
   * Navigates to detail view and scrolls to the most recent activity
   */
  const handleLastActivityClick = (e, engagement) => {
    e.stopPropagation(); // Prevent card click
    
    const lastActivityId = engagement.activities?.[0]?.id;
    if (lastActivityId) {
      onNavigateToActivity(engagement.id, lastActivityId);
    }
  };

  // Get the display name for the current filter
  const getFilterOwnerName = () => {
    if (filterOwner === 'mine') return 'My Engagements';
    if (filterOwner === 'all') return 'All Team Engagements';
    const owner = getOwnerInfo(filterOwner);
    return `${owner.name}'s Engagements`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {showArchived ? 'Archived Engagements' : getFilterOwnerName()}
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
              {/* Team member avatars - includes SE Team (system users) */}
              {teamMembers.map(member => {
                const isSystemUser = member.isSystemUser === true;
                // Use centralized helper for base color classes
                const baseColorClasses = getAvatarColorClasses(member, currentUser?.id);
                
                return (
                  <button
                    key={member.id}
                    onClick={() => setFilterOwner(member.id)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      filterOwner === member.id 
                        ? `${isSystemUser ? 'bg-blue-500 text-white' : 'bg-gray-900 text-white'} ring-2 ring-offset-2 ${isSystemUser ? 'ring-blue-500' : 'ring-gray-900'}` 
                        : `${isSystemUser ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                    }`}
                    title={`${member.name}${isSystemUser ? ' (Shared Pool)' : ''}`}
                  >
                    {member.initials}
                  </button>
                );
              })}
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
        {engagements.map(engagement => {
          const hasActivities = engagement.activities?.length > 0;
          
          return (
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
                      hasActivities ? (
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
                      )
                    )}
                  </div>
                </div>
              </div>
              
              {/* Integration badges: Drive → Docs → Slides → Sheets → Slack */}
              {(engagement.driveFolderUrl || engagement.docsUrl || engagement.slidesUrl || engagement.sheetsUrl || engagement.slackUrl) && (
                <div className="flex gap-2 mb-3">
                  {/* Drive icon - always clickable (only shows if URL exists) */}
                  {engagement.driveFolderUrl && (
                    <a
                      href={engagement.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded hover:bg-green-100 transition-colors"
                      title={engagement.driveFolderName || 'Open Google Drive'}
                    >
                      <DriveIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  
                  {/* Docs icon - always clickable (only shows if URL exists) */}
                  {engagement.docsUrl && (
                    <a
                      href={engagement.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      title={engagement.docsName || 'Open Google Doc'}
                    >
                      <DocsIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  
                  {/* Slides icon - always clickable (only shows if URL exists) */}
                  {engagement.slidesUrl && (
                    <a
                      href={engagement.slidesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
                      title={engagement.slidesName || 'Open Google Slides'}
                    >
                      <SlidesIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  
                  {/* Sheets icon - always clickable (only shows if URL exists) */}
                  {engagement.sheetsUrl && (
                    <a
                      href={engagement.sheetsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                      title={engagement.sheetsName || 'Open Google Sheet'}
                    >
                      <SheetsIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  
                  {/* Slack icon - always clickable (only shows if URL exists) */}
                  {engagement.slackUrl && (
                    <a
                      href={engagement.slackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                      title={engagement.slackChannel || 'Open Slack'}
                    >
                      <SlackIcon className="w-3.5 h-3.5" />
                    </a>
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
          );
        })}
        
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
