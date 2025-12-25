import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailView } from '../components/engagement';
import { usePresalesData, useEngagementDetail } from '../hooks';

/**
 * Engagement detail page that wires DetailView to data hooks
 * 
 * This component:
 * - Extracts engagement ID from URL params
 * - Uses usePresalesData for data state
 * - Uses useEngagementDetail for operations
 * - Passes all necessary props to DetailView
 */
const EngagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  // Data hook
  const {
    currentUser,
    engagements,
    engagementViews,
    setEngagementViews,
    loading,
    updateEngagementInState,
    getOwnerInfo,
    logChangeAsync,
    fetchAllData,
    allTeamMembers
  } = usePresalesData(id);

  // Detail operations hook
  const {
    updatePhaseStatus,
    addPhaseLink,
    removePhaseLink,
    addActivity,
    addComment,
    addPhaseNote,
    updatePhaseNote,
    deletePhaseNote,
    markEngagementViewed
  } = useEngagementDetail({
    currentUser,
    updateEngagementInState,
    logChangeAsync
  });

  // Get the selected engagement
  const engagement = useMemo(() => {
    return engagements.find(e => e.id === id);
  }, [engagements, id]);

  // Get engagement view for unread tracking
  const engagementView = engagementViews[id];

  // Get owners with full info
  const owners = useMemo(() => {
    if (!engagement) return [];
    return engagement.ownerIds.map(ownerId => {
      const member = allTeamMembers.find(m => m.id === ownerId);
      return member || { id: ownerId, name: 'Unknown', initials: '?' };
    });
  }, [engagement, allTeamMembers]);

  // Handlers
  const handleBack = useCallback(() => {
    navigate('/engagements');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleArchive = useCallback(async () => {
    if (!engagement) return;
    
    const newArchived = !engagement.isArchived;
    // TODO: Implement archive toggle via a useEngagementCrud hook
    // For now, this is a placeholder
    console.log('Archive toggle:', newArchived);
  }, [engagement]);

  // Mark as viewed handler for history tab
  const handleMarkViewed = useCallback((engagementId, existingView) => {
    markEngagementViewed(engagementId, existingView, setEngagementViews);
  }, [markEngagementViewed, setEngagementViews]);

  // Fetch data on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchAllData(currentUser.id);
    }
  }, [currentUser?.id, fetchAllData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Engagement not found</h2>
        <p className="text-gray-500 mb-4">The engagement you're looking for doesn't exist.</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <>
      <DetailView
        engagement={engagement}
        owners={owners}
        getOwnerInfo={getOwnerInfo}
        currentUser={currentUser}
        engagementView={engagementView}
        onBack={handleBack}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onStatusChange={updatePhaseStatus}
        onAddLink={addPhaseLink}
        onRemoveLink={removePhaseLink}
        onAddActivity={addActivity}
        onAddComment={addComment}
        onAddNote={addPhaseNote}
        onEditNote={updatePhaseNote}
        onDeleteNote={deletePhaseNote}
        onMarkViewed={handleMarkViewed}
      />

      {/* Edit modal would go here */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Edit Engagement</h2>
            <p className="text-gray-500 mb-4">Edit modal placeholder - integrate your existing EditEngagementModal here</p>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EngagementPage;
