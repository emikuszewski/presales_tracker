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
  CompetitorChips,
  EngagementStatusIcon
} from '../components';
import { phaseLabels, engagementStatusLabels } from '../constants';
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
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {ALL_STATUSES.map(status => {
              const label = engagementStatusLabels[status];
              const isSelected = status === currentStatus;
              
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${isSelected ? 'bg-gray-50 font-medium' : ''}`}
                >
                  <span className={getEngagementStatusBadgeClasses(status).replace('bg-', 'text-').split(' ')[1] || 'text-gray-600'}>
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

/**
 * Closed Engagement Banner
 * Shown above tabs for WON/LOST/DISQUALIFIED/NO_DECISION statuses
 * Uses SVG icons instead of emojis
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
          <span className={bannerClasses.text}>
            <EngagementStatusIcon status={status} className="w-5 h-5" />
          </span>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </div>
      ) : closedReason ? (
        <p className={`mt-2 text-sm ${bannerClasses.text} opacity-80`}>
          {closedReason}
        </p>
      ) : null}
    </div>
  );
};

/**
 * Competition indicator for header - shows competitor chips
 */
const CompetitionIndicator = ({ competitors, otherCompetitorName, onClick }) => {
  const hasCompetitors = competitors && competitors.length > 0;
  
  if (!hasCompetitors) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Competition
      </button>
    );
  }

  return (
    <button onClick={onClick} className="hover:opacity-80 transition-opacity">
      <CompetitorChips 
        competitors={competitors}
        otherCompetitorName={otherCompetitorName}
        maxDisplay={3}
        size="xs"
      />
    </button>
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
  
  // Highlight state for activities
  const [highlightedActivityId, setHighlightedActivityId] = useState(null);
  
  // Scroll to phase state
  const [scrollToPhase, setScrollToPhase] = useState(null);

  // Modal states
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Get owners with full info
  const owners = useMemo(() => {
    if (!engagement || !engagement.ownerIds) return [];
    return engagement.ownerIds.map(ownerId => getOwnerInfo(ownerId));
  }, [engagement, getOwnerInfo]);

  // Tab counts for badges
  const activityCount = engagement?.activities?.length || 0;
  const unreadCount = engagement?.unreadChanges || 0;
  const notesCount = engagement?.totalNotesCount || 0;

  // Handle navigation options (scroll to activity, etc.)
  useEffect(() => {
    if (navigationOptions?.scrollToActivity && engagement) {
      const activityId = navigationOptions.scrollToActivity;
      
      // Switch to activity tab
      setActiveTab('activity');
      
      // Set highlight
      setHighlightedActivityId(activityId);
      
      // Clear after animation
      const timer = setTimeout(() => {
        setHighlightedActivityId(null);
        if (onClearNavigationOptions) {
          onClearNavigationOptions();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [navigationOptions, engagement, onClearNavigationOptions]);

  // Handle scroll to phase (from activity links or notes click)
  useEffect(() => {
    if (scrollToPhase && activeTab === 'notes') {
      // Clear after a short delay to allow the NotesTab to pick it up
      const timer = setTimeout(() => {
        setScrollToPhase(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [scrollToPhase, activeTab]);

  // ============================================
  // PHASE HANDLERS - Adapts ProgressTab props to detail.phase methods
  // ============================================

  /**
   * Phase status change handler
   * Adapts ProgressTab signature (phaseType, newStatus) to detail.phase.save signature (phaseType, { status, notes })
   */
  const handlePhaseStatusChange = useCallback((phaseType, newStatus) => {
    if (detail?.phase?.save) {
      detail.phase.save(phaseType, { status: newStatus });
    }
  }, [detail]);

  /**
   * Notes click handler from ProgressTab
   * Switches to notes tab and scrolls to the clicked phase
   */
  const handlePhaseNotesClick = useCallback((phaseType) => {
    setScrollToPhase(phaseType);
    setActiveTab('notes');
  }, []);

  // ============================================
  // UPDATE HANDLERS
  // ============================================

  const handleUpdateDetails = useCallback((updatedData) => {
    if (detail?.details?.update) {
      detail.details.update(updatedData);
    }
    setShowEditDetailsModal(false);
  }, [detail]);

  const handleUpdateIntegrations = useCallback((updatedData) => {
    if (detail?.integrations?.update) {
      detail.integrations.update(updatedData);
    }
    setShowIntegrationsModal(false);
  }, [detail]);

  const handleUpdateCompetitors = useCallback((updatedData) => {
    if (detail?.competitors?.update) {
      detail.competitors.update(updatedData);
    }
    setShowCompetitionModal(false);
  }, [detail]);

  const handleStatusChange = useCallback((newStatus) => {
    if (detail?.status?.update) {
      detail.status.update(newStatus);
    }
  }, [detail]);

  const handleClosedReasonUpdate = useCallback((reason) => {
    if (detail?.status?.updateReason) {
      detail.status.updateReason(reason);
    }
  }, [detail]);

  const handleArchive = useCallback(() => {
    if (engagement.isArchived) {
      // Restore immediately
      onToggleArchive(engagement.id);
    } else {
      // Show confirmation modal for archive
      setShowArchiveConfirm(true);
    }
  }, [engagement, onToggleArchive]);

  const handleConfirmArchive = useCallback(() => {
    onToggleArchive(engagement.id);
    setShowArchiveConfirm(false);
  }, [engagement, onToggleArchive]);

  // Early return if no engagement
  if (!engagement) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading engagement...</p>
      </div>
    );
  }

  const engagementStatus = engagement.engagementStatus || 'ACTIVE';
  const isClosed = isClosedStatus(engagementStatus);
  const currentPhaseLabel = phaseLabels[engagement.currentPhase] || engagement.currentPhase;

  // Check for integration links
  const hasSlack = engagement.slackUrl;
  const hasDrive = engagement.driveFolderUrl;
  const hasDocs = engagement.docsUrl;
  const hasSlides = engagement.slidesUrl;
  const hasSheets = engagement.sheetsUrl;
  const hasAnyIntegration = hasSlack || hasDrive || hasDocs || hasSlides || hasSheets;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back button + Company name + Phase + Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-medium text-gray-900">{engagement.company}</h1>
              <p className="text-sm text-gray-500">{engagement.contactName}</p>
            </div>

            {/* Phase badge */}
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
              {currentPhaseLabel}
            </span>

            {/* Status dropdown */}
            <EngagementStatusDropdown 
              currentStatus={engagementStatus}
              onStatusChange={handleStatusChange}
            />

            {/* Competition indicator */}
            <CompetitionIndicator
              competitors={engagement.competitors}
              otherCompetitorName={engagement.otherCompetitorName}
              onClick={() => setShowCompetitionModal(true)}
            />
          </div>

          {/* Right: Integration links + Settings + Archive */}
          <div className="flex items-center gap-2">
            {/* Integration links */}
            {hasAnyIntegration && (
              <div className="flex items-center gap-1 mr-2">
                {hasSlack && (
                  <a
                    href={engagement.slackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={engagement.slackChannel || 'Slack Channel'}
                  >
                    <SlackIcon className="w-5 h-5" />
                  </a>
                )}
                {hasDrive && (
                  <a
                    href={engagement.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={engagement.driveFolderName || 'Google Drive'}
                  >
                    <DriveIcon className="w-5 h-5" />
                  </a>
                )}
                {hasDocs && (
                  <a
                    href={engagement.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={engagement.docsName || 'Google Docs'}
                  >
                    <DocsIcon className="w-5 h-5" />
                  </a>
                )}
                {hasSlides && (
                  <a
                    href={engagement.slidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={engagement.slidesName || 'Google Slides'}
                  >
                    <SlidesIcon className="w-5 h-5" />
                  </a>
                )}
                {hasSheets && (
                  <a
                    href={engagement.sheetsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={engagement.sheetsName || 'Google Sheets'}
                  >
                    <SheetsIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={() => setShowIntegrationsModal(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit Integrations"
            >
              <GearIcon className="w-5 h-5 text-gray-600" />
            </button>

            {/* Archive/Restore button */}
            <button
              onClick={handleArchive}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title={engagement.isArchived ? 'Restore engagement' : 'Archive engagement'}
            >
              {engagement.isArchived ? (
                <RestoreIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ArchiveIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Closed Banner (for closed statuses) */}
      {isClosed && (
        <ClosedBanner
          status={engagementStatus}
          closedReason={engagement.closedReason}
          onEditReason={handleClosedReasonUpdate}
        />
      )}

      {/* Main content area with sidebar tabs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Sidebar tabs */}
        <div className="hidden md:block">
          <TabSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activityCount={activityCount}
            unreadCount={unreadCount}
            notesCount={notesCount}
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'progress' && (
            <ProgressTab
              engagement={engagement}
              onStatusChange={handlePhaseStatusChange}
              onAddLink={detail?.phase?.addLink}
              onRemoveLink={detail?.phase?.removeLink}
              onNotesClick={handlePhaseNotesClick}
            />
          )}
          
          {activeTab === 'activity' && (
            <ActivityTab
              engagement={engagement}
              getOwnerInfo={getOwnerInfo}
              onAddActivity={detail?.activity?.add}
              onAddComment={detail?.activity?.addComment}
              onDeleteComment={detail?.activity?.deleteComment}
              onEditActivity={detail?.activity?.edit}
              onDeleteActivity={detail?.activity?.delete}
              highlightId={highlightedActivityId}
            />
          )}
          
          {activeTab === 'history' && (
            <HistoryTab
              engagement={engagement}
              getOwnerInfo={getOwnerInfo}
              lastViewedAt={engagement.lastViewedAt}
              currentUserId={currentUser?.id}
              onMarkViewed={detail?.view?.update ? () => detail.view.update(engagement.id) : null}
            />
          )}
          
          {activeTab === 'notes' && (
            <NotesTab
              engagement={engagement}
              getOwnerInfo={getOwnerInfo}
              onAddNote={detail?.note?.add}
              onEditNote={detail?.note?.edit}
              onDeleteNote={detail?.note?.delete}
              scrollToPhase={scrollToPhase}
            />
          )}
        </div>
      </div>

      {/* Mobile: Bottom tab bar */}
      <div className="md:hidden">
        <TabBottomBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activityCount={activityCount}
          unreadCount={unreadCount}
          notesCount={notesCount}
        />
      </div>

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
        initialCompetitors={engagement.competitors || []}
        initialNotes={engagement.competitorNotes || ''}
        initialOtherName={engagement.otherCompetitorName || ''}
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
