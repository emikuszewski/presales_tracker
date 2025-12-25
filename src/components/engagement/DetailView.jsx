import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DetailHeader from './DetailHeader';
import TabSidebar from './TabSidebar';
import TabBottomBar from './TabBottomBar';
import ProgressTab from './ProgressTab';
import ActivityTab from './ActivityTab';
import HistoryTab from './HistoryTab';
import NotesTab from './NotesTab';

/**
 * Main engagement detail view with vertical tab navigation
 * 
 * @param {Object} props
 * @param {Object} props.engagement - The engagement data
 * @param {Array} props.owners - Array of owner objects
 * @param {Function} props.getOwnerInfo - Function to get owner info by ID
 * @param {Object} props.currentUser - Current logged-in user
 * @param {Object} props.engagementView - Last viewed timestamp for engagement
 * @param {Function} props.onBack - Callback for back navigation
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onArchive - Callback for archive action
 * @param {Function} props.onStatusChange - Callback for phase status change
 * @param {Function} props.onAddLink - Callback for adding a link
 * @param {Function} props.onRemoveLink - Callback for removing a link
 * @param {Function} props.onAddActivity - Callback for adding activity
 * @param {Function} props.onAddComment - Callback for adding comment
 * @param {Function} props.onAddNote - Callback for adding note
 * @param {Function} props.onEditNote - Callback for editing note
 * @param {Function} props.onDeleteNote - Callback for deleting note
 * @param {Function} props.onMarkViewed - Callback to mark engagement as viewed
 */
const DetailView = ({
  engagement,
  owners = [],
  getOwnerInfo,
  currentUser,
  engagementView,
  onBack,
  onEdit,
  onArchive,
  onStatusChange,
  onAddLink,
  onRemoveLink,
  onAddActivity,
  onAddComment,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onMarkViewed
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get tab from URL or default to 'progress'
  const activeTab = searchParams.get('tab') || 'progress';
  
  // Get highlight params from URL
  const highlightActivityId = searchParams.get('highlight');
  const scrollToPhase = searchParams.get('phase');

  // Tab counts for badges
  const activityCount = engagement?.activities?.length || 0;
  const unreadCount = engagement?.unreadChanges || 0;
  const notesCount = engagement?.totalNotesCount || 0;

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (tabId === 'progress') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabId);
    }
    
    // Clear highlight and phase params on tab change
    newParams.delete('highlight');
    newParams.delete('phase');
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle notes click from Progress tab
  const handleNotesClick = useCallback((phaseType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'notes');
    newParams.set('phase', phaseType);
    newParams.delete('highlight');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Wrapper for status change that includes phase ID lookup
  const handleStatusChange = useCallback((phaseType, newStatus) => {
    const phase = engagement?.phases?.[phaseType];
    if (phase?.id) {
      onStatusChange(engagement.id, phase.id, phaseType, newStatus, phase.status);
    }
  }, [engagement, onStatusChange]);

  // Wrapper for add link that includes phase ID lookup
  const handleAddLink = useCallback((phaseType, link) => {
    const phase = engagement?.phases?.[phaseType];
    if (phase?.id) {
      onAddLink(engagement.id, phase.id, phaseType, phase.links || [], link);
    }
  }, [engagement, onAddLink]);

  // Wrapper for remove link that includes phase ID lookup
  const handleRemoveLink = useCallback((phaseType, linkIndex) => {
    const phase = engagement?.phases?.[phaseType];
    if (phase?.id) {
      onRemoveLink(engagement.id, phase.id, phaseType, phase.links || [], linkIndex);
    }
  }, [engagement, onRemoveLink]);

  // Wrapper for add activity
  const handleAddActivity = useCallback(async (activityData) => {
    return onAddActivity(engagement.id, activityData);
  }, [engagement?.id, onAddActivity]);

  // Wrapper for add comment
  const handleAddComment = useCallback(async (activityId, text) => {
    return onAddComment(engagement.id, activityId, text);
  }, [engagement?.id, onAddComment]);

  // Wrapper for note operations
  const handleAddNote = useCallback(async (phaseType, text) => {
    return onAddNote(engagement.id, phaseType, text);
  }, [engagement?.id, onAddNote]);

  const handleEditNote = useCallback(async (noteId, phaseType, text) => {
    return onEditNote(engagement.id, noteId, phaseType, text);
  }, [engagement?.id, onEditNote]);

  const handleDeleteNote = useCallback(async (noteId, phaseType) => {
    return onDeleteNote(engagement.id, noteId, phaseType);
  }, [engagement?.id, onDeleteNote]);

  // Mark as viewed when History tab opens
  const handleMarkViewed = useCallback(() => {
    if (engagement?.id && onMarkViewed) {
      onMarkViewed(engagement.id, engagementView);
    }
  }, [engagement?.id, engagementView, onMarkViewed]);

  // Render active tab content
  const renderTabContent = () => {
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
            lastViewedAt={engagementView?.lastViewedAt}
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
            onStatusChange={handleStatusChange}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Compact header */}
      <DetailHeader
        engagement={engagement}
        owners={owners}
        onBack={onBack}
        onEdit={onEdit}
        onArchive={onArchive}
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
    </div>
  );
};

export default DetailView;
