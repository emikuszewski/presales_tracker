import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  SlackIcon,
  DriveIcon,
  DocsIcon,
  SlidesIcon,
  SheetsIcon,
  EditDetailsModal,
  OwnersModal,
  IntegrationsModal,
  CompetitionModal,
  CompetitorChips
} from '../components';
import { phaseLabels, engagementStatusLabels, engagementStatusIcons } from '../constants';
import { 
  isClosedStatus, 
  getEngagementStatusBadgeClasses, 
  getClosedBannerClasses 
} from '../utils';

// Import tab components
import { TabSidebar, TabBottomBar, ProgressTab, ActivityTab, HistoryTab, NotesTab } from '../components/engagement';

/**
 * Gear/cog icon for integrations editing
 */
const GearIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/**
 * Archive icon - box with down arrow (for archiving)
 */
const ArchiveIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4l3 3m0 0l3-3m-3 3V9" />
  </svg>
);

/**
 * Restore icon - box with up arrow (for restoring from archive)
 */
const RestoreIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4l3-3m0 0l3 3m-3-3v7" />
  </svg>
);

/**
 * All engagement status options
 */
const ALL_STATUSES = ['ACTIVE', 'ON_HOLD', 'UNRESPONSIVE', 'WON', 'LOST', 'DISQUALIFIED', 'NO_DECISION'];

/**
 * Engagement Status Dropdown component
 * Click to change status, similar to phase status dropdown
 */
const EngagementStatusDropdown = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusIcon = engagementStatusIcons[currentStatus];
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
        {statusIcon && <span>{statusIcon}</span>}
        {statusLabel}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {ALL_STATUSES.map(status => {
              const icon = engagementStatusIcons[status];
              const label = engagementStatusLabels[status];
              const isSelected = status === currentStatus;
              
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${isSelected ? 'bg-gray-50 font-medium' : ''}`}
                >
                  {icon && <span>{icon}</span>}
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

/**
 * Closed Engagement Banner
 * Shown above tabs for WON/LOST/DISQUALIFIED/NO_DECISION statuses
 */
const ClosedBanner = ({ status, closedReason, onEditReason }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(closedReason || '');
  const bannerClasses = getClosedBannerClasses(status);

  const handleSave = () => {
    onEditReason(editText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(closedReason || '');
    setIsEditing(false);
  };

  return (
    <div className={`${bannerClasses.bg} border ${bannerClasses.border} rounded-lg p-4 mx-4 mt-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{bannerClasses.icon}</span>
          <span className={`font-medium ${bannerClasses.text}`}>
            {engagementStatusLabels[status]}
          </span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={`text-sm ${bannerClasses.text} hover:underline`}
          >
            {closedReason ? 'Edit' : 'Add notes'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Add notes about why this engagement closed..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </div>
      ) : closedReason ? (
        <p className={`mt-2 text-sm ${bannerClasses.text}`}>
          {closedReason}
        </p>
      ) : (
        <p className={`mt-2 text-sm ${bannerClasses.text} opacity-60`}>
          No notes added
        </p>
      )}
    </div>
  );
};

/**
 * Competition button/chips for header
 * Shows chips when competitors exist, otherwise shows add button
 */
const CompetitionIndicator = ({ competitors, otherCompetitorName, onClick }) => {
  const hasCompetitors = competitors && competitors.length > 0;

  if (hasCompetitors) {
    return (
      <CompetitorChips
        competitors={competitors}
        otherCompetitorName={otherCompetitorName}
        maxDisplay={3}
        size="sm"
        onClick={onClick}
      />
    );
  }

  // Empty state - show muted add button
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      title="Add competitors"
    >
      <span>⚔️</span>
      <span>+</span>
    </button>
  );
};

/**
 * Detail header component - compact header with back, owners, company, phase, status dropdown, competitors
 */
const DetailHeader = ({ 
  engagement, 
  owners, 
  onBack, 
  onEdit, 
  onArchive, 
  onManageOwners,
  onEditIntegrations,
  onEditCompetitors,
  onStatusChange,
  isStale, 
  daysSinceActivity 
}) => {
  const currentPhase = engagement?.currentPhase || 'DISCOVER';
  const isArchived = engagement?.isArchived === true;
  const engagementStatus = engagement?.engagementStatus || 'ACTIVE';
  
  // Get the phase data and status for styling
  const currentPhaseData = engagement?.phases?.[currentPhase];
  const currentStatus = currentPhaseData?.status || 'PENDING';
  const phaseLabel = phaseLabels[currentPhase] || currentPhase;
  
  // Determine badge styling based on status
  let badgeClasses, dotClasses;
  if (currentStatus === 'COMPLETE') {
    badgeClasses = 'bg-emerald-50 text-emerald-700';
    dotClasses = 'bg-emerald-500';
  } else if (currentStatus === 'IN_PROGRESS') {
    badgeClasses = 'bg-blue-50 text-blue-700';
    dotClasses = 'bg-blue-500';
  } else {
    badgeClasses = 'bg-gray-100 text-gray-600';
    dotClasses = 'bg-gray-400';
  }

  const integrations = [
    { url: engagement?.driveFolderUrl, name: engagement?.driveFolderName || 'Drive', Icon: DriveIcon },
    { url: engagement?.docsUrl, name: engagement?.docsName || 'Docs', Icon: DocsIcon },
    { url: engagement?.slidesUrl, name: engagement?.slidesName || 'Slides', Icon: SlidesIcon },
    { url: engagement?.sheetsUrl, name: engagement?.sheetsName || 'Sheets', Icon: SheetsIcon },
    { url: engagement?.slackUrl, name: engagement?.slackChannel || 'Slack', Icon: SlackIcon }
  ];

  const hasIntegrations = integrations.some(i => i.url);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to list"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Owner avatars - clickable to manage owners */}
          <button
            onClick={onManageOwners}
            className="flex -space-x-2 flex-shrink-0 rounded-full hover:ring-2 hover:ring-gray-300 transition-all cursor-pointer"
            title="Manage owners"
            aria-label="Manage owners"
          >
            {owners.slice(0, 3).map((owner, idx) => (
              <div
                key={owner.id || idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white ${
                  owner.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {owner.initials}
              </div>
            ))}
            {owners.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white">
                +{owners.length - 3}
              </div>
            )}
          </button>

          {/* Company name */}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {engagement?.company || 'Engagement'}
          </h1>

          {/* Phase badge - styled based on status */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${badgeClasses}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>
            {phaseLabel}
          </span>

          {/* Engagement Status Dropdown */}
          <EngagementStatusDropdown
            currentStatus={engagementStatus}
            onStatusChange={onStatusChange}
          />

          {/* Competition Indicator - after status dropdown */}
          <CompetitionIndicator
            competitors={engagement?.competitors}
            otherCompetitorName={engagement?.otherCompetitorName}
            onClick={onEditCompetitors}
          />

          {/* Stale indicator - only for ACTIVE status */}
          {isStale && engagementStatus === 'ACTIVE' && (
            <span className="text-xs text-amber-600 flex-shrink-0 hidden sm:inline" title={`${daysSinceActivity} days since last activity`}>
              ⚠️ {daysSinceActivity}d stale
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Integration icons + gear button */}
          <div className="hidden sm:flex items-center gap-0.5 mr-2">
            {/* Existing integration links */}
            {integrations.map((integration, idx) => {
              if (!integration.url) return null;
              const IconComp = integration.Icon;
              return (
                
                  key={idx}
                  href={integration.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
                  title={integration.name}
                >
                  <IconComp className="w-4 h-4" />
                </a>
              );
            })}

            {/* Gear icon - always visible for adding/editing integrations */}
            <button
              onClick={onEditIntegrations}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
              title={hasIntegrations ? "Edit integrations" : "Add integrations"}
              aria-label={hasIntegrations ? "Edit integrations" : "Add integrations"}
            >
              <GearIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Edit button */}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit engagement"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Archive/Restore button - icon changes based on archived state */}
          <button
            onClick={onArchive}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={isArchived ? 'Restore engagement' : 'Archive engagement'}
          >
            {isArchived ? (
              <RestoreIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ArchiveIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main engagement detail view with vertical tab navigation
 */
const DetailView = ({
  engagement,
  teamMembers,
  currentUser,
  getOwnerInfo,
  detail,
  navigationOptions,
  onClearNavigationOptions,
  onToggleArchive,
  onBack
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('progress');
  const [highlightActivityId, setHighlightActivityId] = useState(null);
  const [scrollToPhase, setScrollToPhase] = useState(null);

  // Modal states
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Get owners with full info
  const owners = useMemo(() => {
    if (!engagement?.ownerIds) return [];
    return engagement.ownerIds.map(ownerId => getOwnerInfo(ownerId));
  }, [engagement, getOwnerInfo]);

  // Tab counts
  const activityCount = engagement?.activities?.length || 0;
  const unreadCount = engagement?.unreadChanges || 0;
  const notesCount = engagement?.totalNotesCount || 0;

  // Engagement status
  const engagementStatus = engagement?.engagementStatus || 'ACTIVE';
  const isClosed = isClosedStatus(engagementStatus);

  // Handle navigation options
  useEffect(() => {
    if (navigationOptions?.scrollToActivityId) {
      setActiveTab('activity');
      setHighlightActivityId(navigationOptions.scrollToActivityId);
      onClearNavigationOptions?.();
    }
  }, [navigationOptions, onClearNavigationOptions]);

  // Tab change handler
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setHighlightActivityId(null);
    setScrollToPhase(null);
  }, []);

  // Notes click from Progress tab
  const handleNotesClick = useCallback((phaseType) => {
    setActiveTab('notes');
    setScrollToPhase(phaseType);
  }, []);

  // Status change handler
  const handleStatusChange = useCallback(async (newStatus) => {
    if (detail?.status?.update) {
      await detail.status.update(newStatus);
    }
  }, [detail]);

  // Closed reason update handler
  const handleClosedReasonUpdate = useCallback(async (reason) => {
    if (detail?.status?.updateReason) {
      await detail.status.updateReason(reason);
    }
  }, [detail]);

  // Activity handlers
  const handleAddActivity = useCallback(async (activityData) => {
    if (detail?.activity?.add) {
      return await detail.activity.add(activityData);
    }
    return false;
  }, [detail]);

  const handleEditActivity = useCallback(async (activityId, updates) => {
    if (detail?.activity?.edit) {
      return await detail.activity.edit(activityId, updates);
    }
    return false;
  }, [detail]);

  const handleDeleteActivity = useCallback(async (activityId) => {
    if (detail?.activity?.delete) {
      return await detail.activity.delete(activityId);
    }
    return false;
  }, [detail]);

  const handleAddComment = useCallback(async (activityId, text) => {
    if (detail?.activity?.addComment) {
      return await detail.activity.addComment(activityId, text);
    }
    return false;
  }, [detail]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (detail?.activity?.deleteComment) {
      return await detail.activity.deleteComment(commentId);
    }
    return false;
  }, [detail]);

  // Mark viewed handler
  const handleMarkViewed = useCallback(() => {
    if (detail?.view?.update && engagement) {
      detail.view.update(engagement.id);
    }
  }, [detail, engagement]);

  // Archive handler - shows confirmation for archive, immediate for restore
  const handleArchive = useCallback(() => {
    if (!engagement) return;
    
    if (engagement.isArchived) {
      // Restoring - no confirmation needed, execute immediately
      onToggleArchive(engagement.id, false);
    } else {
      // Archiving - show confirmation modal
      setShowArchiveConfirm(true);
    }
  }, [engagement, onToggleArchive]);

  // Confirm archive handler
  const handleConfirmArchive = useCallback(() => {
    if (engagement && onToggleArchive) {
      onToggleArchive(engagement.id, true);
    }
    setShowArchiveConfirm(false);
  }, [engagement, onToggleArchive]);

  // Details save handler
  const handleUpdateDetails = useCallback((updates) => {
    if (detail?.details?.update) {
      detail.details.update(updates);
    }
    setShowEditDetailsModal(false);
  }, [detail]);

  // Integrations save handler
  const handleUpdateIntegrations = useCallback((updates) => {
    if (detail?.integrations?.update) {
      detail.integrations.update(updates);
    }
    setShowIntegrationsModal(false);
  }, [detail]);

  // Competitors save handler
  const handleUpdateCompetitors = useCallback((competitorData) => {
    if (detail?.competitors?.update) {
      detail.competitors.update(competitorData);
    }
  }, [detail]);

  // Note handlers - wired to detail.note.*
  const handleAddNote = useCallback(async (phaseType, text) => {
    if (detail?.note?.add) {
      return await detail.note.add(phaseType, text);
    }
    return false;
  }, [detail]);

  const handleEditNote = useCallback(async (noteId, phaseType, text) => {
    if (detail?.note?.edit) {
      return await detail.note.edit(noteId, phaseType, text);
    }
    return false;
  }, [detail]);

  const handleDeleteNote = useCallback(async (noteId, phaseType) => {
    if (detail?.note?.delete) {
      return await detail.note.delete(noteId, phaseType);
    }
    return false;
  }, [detail]);

  // Render tab content
  const renderTabContent = () => {
    if (!engagement) return null;

    switch (activeTab) {
      case 'activity':
        return (
          <ActivityTab
            engagement={engagement}
            getOwnerInfo={getOwnerInfo}
            onAddActivity={handleAddActivity}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            highlightId={highlightActivityId}
          />
        );

      case 'history':
        return (
          <HistoryTab
            engagement={engagement}
            getOwnerInfo={getOwnerInfo}
            lastViewedAt={null}
            currentUserId={currentUser?.id}
            onMarkViewed={handleMarkViewed}
          />
        );

      case 'notes':
        return (
          <NotesTab
            engagement={engagement}
            getOwnerInfo={getOwnerInfo}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            scrollToPhase={scrollToPhase}
          />
        );

      case 'progress':
      default:
        return (
          <ProgressTab
            engagement={engagement}
            onStatusChange={(phaseType, newStatus) => {
              if (detail?.phase?.save) {
                detail.phase.save(phaseType, { 
                  status: newStatus, 
                  notes: engagement.phases?.[phaseType]?.notes || '' 
                });
              }
            }}
            onAddLink={(phaseType, link) => {
              if (detail?.phase?.addLink) {
                detail.phase.addLink(phaseType, link);
              }
            }}
            onRemoveLink={(phaseType, linkIndex) => {
              if (detail?.phase?.removeLink) {
                detail.phase.removeLink(phaseType, linkIndex);
              }
            }}
            onNotesClick={handleNotesClick}
          />
        );
    }
  };

  if (!engagement) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading engagement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 -mx-6 -mt-10" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Compact header */}
      <DetailHeader
        engagement={engagement}
        owners={owners}
        onBack={onBack}
        onEdit={() => setShowEditDetailsModal(true)}
        onArchive={handleArchive}
        onManageOwners={() => setShowOwnersModal(true)}
        onEditIntegrations={() => setShowIntegrationsModal(true)}
        onEditCompetitors={() => setShowCompetitionModal(true)}
        onStatusChange={handleStatusChange}
        isStale={engagement.isStale}
        daysSinceActivity={engagement.daysSinceActivity}
      />

      {/* Closed Engagement Banner - shown for WON/LOST/DISQUALIFIED/NO_DECISION */}
      {isClosed && (
        <ClosedBanner
          status={engagementStatus}
          closedReason={engagement.closedReason}
          onEditReason={handleClosedReasonUpdate}
        />
      )}

      {/* Main content area with tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop vertical tab sidebar */}
        <TabSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activityCount={activityCount}
          unreadCount={unreadCount}
          notesCount={notesCount}
        />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {renderTabContent()}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <TabBottomBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activityCount={activityCount}
        unreadCount={unreadCount}
        notesCount={notesCount}
      />

      {/* Modals */}
      <EditDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        initialData={engagement}
        onSave={handleUpdateDetails}
      />

      <OwnersModal
        isOpen={showOwnersModal}
        onClose={() => setShowOwnersModal(false)}
        currentOwnerIds={engagement.ownerIds}
        teamMembers={teamMembers}
        currentUserId={currentUser?.id}
        getOwnerInfo={getOwnerInfo}
        onAddOwner={detail?.owner?.add || (() => {})}
        onRemoveOwner={detail?.owner?.remove || (() => {})}
      />

      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        initialData={engagement}
        onSave={handleUpdateIntegrations}
      />

      <CompetitionModal
        isOpen={showCompetitionModal}
        onClose={() => setShowCompetitionModal(false)}
        initialCompetitors={engagement.competitors}
        initialNotes={engagement.competitorNotes}
        initialOtherName={engagement.otherCompetitorName}
        onSave={handleUpdateCompetitors}
      />

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        title="Archive Engagement"
      >
        <p className="text-gray-600 mb-6">
          Archive <strong>{engagement.company}</strong>? This engagement will move to your archived list. You can restore it anytime.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchiveConfirm(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmArchive}
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
          >
            Archive
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DetailView;
