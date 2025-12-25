import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlackIcon,
  DriveIcon,
  DocsIcon,
  SlidesIcon,
  SheetsIcon,
  EditDetailsModal,
  OwnersModal,
  IntegrationsModal
} from '../components';
import { phaseLabels } from '../constants';

// Import tab components
import { TabSidebar, TabBottomBar, ProgressTab, ActivityTab, HistoryTab, NotesTab } from '../components/engagement';

/**
 * Detail header component - compact header with back, owners, company, phase
 */
const DetailHeader = ({ engagement, owners, onBack, onEdit, onArchive, isStale, daysSinceActivity }) => {
  const currentPhase = engagement?.currentPhase || 'DISCOVER';

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

          {/* Owner avatars */}
          <div className="flex -space-x-2 flex-shrink-0">
            {owners.slice(0, 3).map((owner, idx) => (
              <div
                key={owner.id || idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white ${
                  owner.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}
                title={owner.name}
              >
                {owner.initials}
              </div>
            ))}
            {owners.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white">
                +{owners.length - 3}
              </div>
            )}
          </div>

          {/* Company name */}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {engagement?.company || 'Engagement'}
          </h1>

          {/* Phase badge */}
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
            {phaseLabels[currentPhase] || currentPhase}
          </span>

          {/* Deal size */}
          {engagement?.dealSize && (
            <span className="text-sm text-gray-500 flex-shrink-0 hidden sm:inline">
              {engagement.dealSize}
            </span>
          )}

          {/* Stale indicator */}
          {isStale && (
            <span className="text-xs text-amber-600 flex-shrink-0 hidden sm:inline" title={`${daysSinceActivity} days since last activity`}>
              ⚠️ {daysSinceActivity}d stale
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Integration icons */}
          {hasIntegrations && (
            <div className="hidden sm:flex items-center gap-0.5 mr-2">
              {integrations.map((integration, idx) => {
                if (!integration.url) return null;
                const IconComp = integration.Icon;
                return (
                  <a
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
            </div>
          )}

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

          {/* Archive button */}
          <button
            onClick={onArchive}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={engagement?.isArchived ? 'Restore engagement' : 'Archive engagement'}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
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

  // Get owners with full info
  const owners = useMemo(() => {
    if (!engagement?.ownerIds) return [];
    return engagement.ownerIds.map(ownerId => getOwnerInfo(ownerId));
  }, [engagement, getOwnerInfo]);

  // Tab counts
  const activityCount = engagement?.activities?.length || 0;
  const unreadCount = engagement?.unreadChanges || 0;
  const notesCount = engagement?.totalNotesCount || 0;

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

  // Activity handlers
  const handleAddActivity = useCallback(async (activityData) => {
    if (detail?.activity?.add) {
      return await detail.activity.add(activityData);
    }
    return false;
  }, [detail]);

  const handleAddComment = useCallback(async (activityId, text) => {
    if (detail?.activity?.addComment) {
      return await detail.activity.addComment(activityId, text);
    }
    return false;
  }, [detail]);

  // Mark viewed handler
  const handleMarkViewed = useCallback(() => {
    if (detail?.view?.update && engagement) {
      detail.view.update(engagement.id);
    }
  }, [detail, engagement]);

  // Archive handler
  const handleArchive = useCallback(() => {
    if (engagement && onToggleArchive) {
      onToggleArchive(engagement.id, !engagement.isArchived);
    }
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
            onAddComment={handleAddComment}
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
        isStale={engagement.isStale}
        daysSinceActivity={engagement.daysSinceActivity}
      />

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
    </div>
  );
};

export default DetailView;
