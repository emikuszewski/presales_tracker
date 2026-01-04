import React from 'react';
import { OwnersDisplay } from './OwnersDisplay';
import { StaleBadge } from './StaleBadge';
import { NotificationBadge } from './NotificationBadge';
import { IntegrationLinksIndicator } from './IntegrationLinksIndicator';
import { CompetitorChips } from './CompetitorChips';
import { EngagementStatusIcon } from './EngagementStatusIcon';
import { industryLabels, phaseConfig, phaseLabels, engagementStatusLabels, phaseStatusLabels } from '../../constants';
import { 
  getEngagementStatusBorderClasses, 
  getEngagementStatusBadgeClasses,
  shouldShowStale,
  getDerivedCurrentPhase,
  getPhaseBadgeClasses
} from '../../utils';

/**
 * Get background color class for phase status dot
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
 * EngagementCard - Displays a single engagement in the list view
 * 
 * Shows company info, phase progress, status badges, competitors, and integration links.
 * Clickable to navigate to engagement detail view.
 */
const EngagementCard = React.memo(({ 
  engagement,
  currentUser,
  getOwnerInfo,
  showEverything,
  onSelect,
  onActivityClick
}) => {
  const hasActivities = engagement.activities?.length > 0;
  const engagementStatus = engagement.engagementStatus || 'ACTIVE';
  const statusBorderClasses = getEngagementStatusBorderClasses(engagementStatus);
  const showStale = shouldShowStale(engagement);
  const statusLabel = engagementStatusLabels[engagementStatus];
  const isArchivedInEverything = showEverything && engagement.isArchived === true;
  const hasCompetitors = engagement.competitors && engagement.competitors.length > 0;
  
  // Derive the current phase from actual phase data (fixes stale currentPhase bug)
  const derivedCurrentPhase = getDerivedCurrentPhase(engagement.phases);
  const derivedPhaseData = engagement.phases[derivedCurrentPhase];
  const derivedPhaseStatus = derivedPhaseData?.status || 'PENDING';
  const derivedPhaseLabel = phaseLabels[derivedCurrentPhase] || derivedCurrentPhase;
  const { badgeClasses, dotClasses } = getPhaseBadgeClasses(derivedPhaseStatus);
  
  // Partner indicator
  const hasPartner = engagement.partnerName && engagement.partnerName.trim();
  const partnerTooltip = hasPartner ? `Partner: ${engagement.partnerName}` : '';

  /**
   * Handle click on "Last activity" link
   * Navigates to detail view and scrolls to the most recent activity
   */
  const handleLastActivityClick = (e) => {
    e.stopPropagation();
    const lastActivityId = engagement.activities?.[0]?.id;
    if (lastActivityId && onActivityClick) {
      onActivityClick(engagement.id, lastActivityId);
    }
  };

  return (
    <div
      onClick={() => onSelect(engagement.id)}
      className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer ${statusBorderClasses} ${hasPartner ? 'partner-indicator-card' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <OwnersDisplay ownerIds={engagement.ownerIds} size="md" getOwnerInfo={getOwnerInfo} currentUserId={currentUser?.id} />
          <div>
            <div className="flex items-center gap-2">
              {hasPartner && (
                <div 
                  className="partner-dot-tooltip"
                  data-tooltip={partnerTooltip}
                >
                  <span className="partner-dot"></span>
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-900">{engagement.company}</h3>
              {engagement.unreadChanges > 0 && (
                <NotificationBadge count={engagement.unreadChanges} />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {engagement.contactName} · {industryLabels[engagement.industry] || engagement.industry}
              {engagement.salesRepName && (
                <span className="text-purple-600"> · {engagement.salesRepName}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-gray-900">{engagement.dealSize || '—'}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            {hasActivities ? (
              <button
                onClick={handleLastActivityClick}
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
      
      {/* Simplified Bottom Row: Compact Phase Dots + Phase Badge + Status Badge + Archived Badge + Stale Badge + Competitors + Links Indicator */}
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

          {/* Current Phase Badge - now uses derived phase with status tooltip */}
          <div 
            className="phase-badge-tooltip"
            data-tooltip={phaseStatusLabels[derivedPhaseStatus] || 'Pending'}
          >
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${badgeClasses}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>
              {derivedPhaseLabel}
            </span>
          </div>

          {/* Engagement Status Badge - hidden for ACTIVE (default state) */}
          {engagementStatus !== 'ACTIVE' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getEngagementStatusBadgeClasses(engagementStatus)}`}>
              <EngagementStatusIcon status={engagementStatus} className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          )}

          {/* Archived Badge - only shown in Everything mode for archived items */}
          {isArchivedInEverything && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archived
            </span>
          )}

          {/* Stale Badge - only for ACTIVE status engagements */}
          {showStale && (
            <StaleBadge daysSinceActivity={engagement.daysSinceActivity} />
          )}
        </div>

        {/* Right side: Competitor Chips + Integration Links */}
        <div className="flex items-center gap-2">
          {/* Competitor Chips - show max 3 + overflow */}
          {hasCompetitors && (
            <CompetitorChips 
              competitors={engagement.competitors}
              otherCompetitorName={engagement.otherCompetitorName}
              maxDisplay={3}
              size="xs"
            />
          )}
          
          {/* Integration Links Indicator */}
          <IntegrationLinksIndicator engagement={engagement} />
        </div>
      </div>
    </div>
  );
});

EngagementCard.displayName = 'EngagementCard';

export default EngagementCard;
