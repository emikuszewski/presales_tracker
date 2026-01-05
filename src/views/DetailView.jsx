import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  EngagementStatusIcon,
  RefreshIcon,
  CheckIcon,
  ChevronLeftIcon,
  PlusIcon,
  UserIcon
} from '../components';
import { phaseLabels, engagementStatusLabels, phaseStatusLabels } from '../constants';
import { 
  isClosedStatus, 
  getClosedBannerClasses,
  getDerivedCurrentPhase,
  getPhaseBadgeClasses
} from '../utils';

// Import tab components and extracted engagement components
import { TabSidebar, TabBottomBar, ProgressTab, ActivityTab, HistoryTab, NotesTab, OverflowMenu, EngagementStatusDropdown } from '../components/engagement';

/**
 * Refresh button with loading/success states
 */
const RefreshButton = ({ onClick, disabled, refreshState }) => {
  const isLoading = refreshState === 'loading';
  const isSuccess = refreshState === 'success';
  
  const buttonClasses = `p-1.5 rounded-lg transition-colors ${
    disabled || isLoading || isSuccess
      ? 'cursor-not-allowed opacity-50'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;
  
  const renderIcon = () => {
    if (isLoading) {
      return (
        <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
      );
    }
    if (isSuccess) {
      return <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    return <RefreshIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };
  
  const getTitle = () => {
    if (isLoading) return 'Refreshing...';
    if (isSuccess) return 'Refreshed!';
    if (disabled) return 'Close modal to refresh';
    return 'Refresh engagement';
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading || isSuccess}
      className={buttonClasses}
      title={getTitle()}
    >
      {renderIcon()}
    </button>
  );
};

/**
 * Closed Engagement Banner
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm resize-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-white"
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
 * Competition indicator for header
 */
const CompetitionIndicator = ({ competitors, otherCompetitorName, onClick }) => {
  const hasCompetitors = competitors && competitors.length > 0;
  
  if (!hasCompetitors) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" />
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
  salesReps = [],
  currentUser,
  getOwnerInfo,
  detail,
  onToggleArchive,
  onBack,
  onModalStateChange,
  activeTab,
  onTabChange,
  onRefresh
}) => {
  const [searchParams] = useSearchParams();
  const scrollToActivityFromUrl = searchParams.get('scrollToActivity');
  const setActiveTab = onTabChange;
  const [highlightedActivityId, setHighlightedActivityId] = useState(null);
  const [scrollToPhase, setScrollToPhase] = useState(null);

  // Modal states
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const [refreshState, setRefreshState] = useState('idle');
  const refreshTimeoutRef = useRef(null);

  const hasOpenModal = 
    showEditDetailsModal || 
    showOwnersModal || 
    showIntegrationsModal || 
    showCompetitionModal || 
    showArchiveConfirm;

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
  }, [hasOpenModal, onModalStateChange]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const owners = useMemo(() => {
    if (!engagement || !engagement.ownerIds) return [];
    return engagement.ownerIds.map(ownerId => getOwnerInfo(ownerId));
  }, [engagement, getOwnerInfo]);

  const activityCount = engagement?.activities?.length || 0;
  const unreadCount = engagement?.unreadChanges || 0;
  const notesCount = engagement?.totalNotesCount || 0;

  useEffect(() => {
    if (scrollToActivityFromUrl && engagement) {
      setActiveTab('activity');
      setHighlightedActivityId(scrollToActivityFromUrl);
      const timer = setTimeout(() => {
        setHighlightedActivityId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scrollToActivityFromUrl, engagement]);

  useEffect(() => {
    if (scrollToPhase && activeTab === 'notes') {
      const timer = setTimeout(() => {
        setScrollToPhase(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [scrollToPhase, activeTab]);

  const handlePhaseStatusChange = useCallback((phaseType, newStatus) => {
    if (detail?.phase?.save) {
      detail.phase.save(phaseType, { status: newStatus });
    }
  }, [detail]);

  const handlePhaseNotesClick = useCallback((phaseType) => {
    setScrollToPhase(phaseType);
    setActiveTab('notes');
  }, []);

  const handleUpdateDetails = useCallback((updatedData) => {
    const oldSalesRepId = engagement?.salesRepId;
    const newSalesRepId = updatedData.salesRepId;
    
    if (oldSalesRepId !== newSalesRepId && detail?.salesRep?.update) {
      detail.salesRep.update(newSalesRepId, updatedData.salesRepName);
    }
    
    const oldPartnerName = engagement?.partnerName || null;
    const newPartnerName = updatedData.partnerName || null;
    
    if (oldPartnerName !== newPartnerName && detail?.partner?.update) {
      detail.partner.update(newPartnerName);
    }
    
    if (detail?.details?.update) {
      const { salesRepId, salesRepName, partnerName, ...otherData } = updatedData;
      detail.details.update(otherData);
    }
    setShowEditDetailsModal(false);
  }, [detail, engagement]);

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
      onToggleArchive(engagement.id);
    } else {
      setShowArchiveConfirm(true);
    }
  }, [engagement, onToggleArchive]);

  const handleConfirmArchive = useCallback(() => {
    onToggleArchive(engagement.id);
    setShowArchiveConfirm(false);
  }, [engagement, onToggleArchive]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshState !== 'idle' || hasOpenModal) return;
    
    setRefreshState('loading');
    
    try {
      await onRefresh();
      setRefreshState('success');
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshState('idle');
      }, 1500);
    } catch (error) {
      console.error('Error refreshing engagement:', error);
      setRefreshState('idle');
    }
  }, [onRefresh, refreshState, hasOpenModal]);

  if (!engagement) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500">Loading engagement...</p>
      </div>
    );
  }

  const engagementStatus = engagement.engagementStatus || 'ACTIVE';
  const isClosed = isClosedStatus(engagementStatus);
  
  const derivedCurrentPhase = getDerivedCurrentPhase(engagement.phases);
  const derivedPhaseData = engagement.phases[derivedCurrentPhase];
  const derivedPhaseStatus = derivedPhaseData?.status || 'PENDING';
  const derivedPhaseLabel = phaseLabels[derivedCurrentPhase] || derivedCurrentPhase;
  const { badgeClasses, dotClasses } = getPhaseBadgeClasses(derivedPhaseStatus);

  const hasSlack = engagement.slackUrl;
  const hasDrive = engagement.driveFolderUrl;
  const hasDocs = engagement.docsUrl;
  const hasSlides = engagement.slidesUrl;
  const hasSheets = engagement.sheetsUrl;
  const hasAnyIntegration = hasSlack || hasDrive || hasDocs || hasSlides || hasSheets;

  const hasPartner = engagement.partnerName && engagement.partnerName.trim();
  const partnerTooltip = hasPartner ? `Partner: ${engagement.partnerName}` : '';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 ${hasPartner ? 'partner-indicator-detail' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
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
                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">{engagement.company}</h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{engagement.contactName}</p>
            </div>

            <div 
              className="phase-badge-tooltip"
              data-tooltip={phaseStatusLabels[derivedPhaseStatus] || 'Pending'}
            >
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${badgeClasses}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>
                {derivedPhaseLabel}
              </span>
            </div>

            <EngagementStatusDropdown 
              currentStatus={engagementStatus}
              onStatusChange={handleStatusChange}
            />

            <CompetitionIndicator
              competitors={engagement.competitors}
              otherCompetitorName={engagement.otherCompetitorName}
              onClick={() => setShowCompetitionModal(true)}
            />

            {engagement.salesRepName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                <UserIcon className="w-3.5 h-3.5" />
                {engagement.salesRepName}
              </span>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {hasAnyIntegration && (
              <div className="flex items-center gap-1 mr-1">
                {hasSlack && (
                  <a
                    href={engagement.slackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={engagement.sheetsName || 'Google Sheets'}
                  >
                    <SheetsIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            <RefreshButton
              onClick={handleRefresh}
              disabled={hasOpenModal}
              refreshState={refreshState}
            />

            <OverflowMenu
              isArchived={engagement.isArchived}
              onEditDetails={() => setShowEditDetailsModal(true)}
              onManageOwners={() => setShowOwnersModal(true)}
              onEditIntegrations={() => setShowIntegrationsModal(true)}
              onArchive={handleArchive}
            />
          </div>
        </div>
      </div>

      {isClosed && (
        <ClosedBanner
          status={engagementStatus}
          closedReason={engagement.closedReason}
          onEditReason={handleClosedReasonUpdate}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block">
          <TabSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activityCount={activityCount}
            unreadCount={unreadCount}
            notesCount={notesCount}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'progress' && (
            <ProgressTab
              engagement={engagement}
              onStatusChange={handlePhaseStatusChange}
              onAddLink={detail?.phase?.addLink}
              onRemoveLink={detail?.phase?.removeLink}
              onNotesClick={handlePhaseNotesClick}
              onAddNote={detail?.note?.add}
              getOwnerInfo={getOwnerInfo}
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

      <div className="md:hidden">
        <TabBottomBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activityCount={activityCount}
          unreadCount={unreadCount}
          notesCount={notesCount}
        />
      </div>

      <EditDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        initialData={engagement}
        onSave={handleUpdateDetails}
        salesReps={salesReps}
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

      <Modal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        title="Archive Engagement"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Archive <strong className="text-gray-900 dark:text-gray-100">{engagement.company}</strong>? This engagement will move to your archived list. You can restore it anytime.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchiveConfirm(false)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmArchive}
            className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white"
          >
            Archive
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DetailView;
