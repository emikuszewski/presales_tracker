import { useCallback } from 'react';
import { getTodayDate, generateTempId, parseLinks } from '../utils';
import { phaseConfig, phaseLabels, activityTypeLabels } from '../constants';

/**
 * Hook for engagement detail operations, organized by domain.
 * Returns namespaced handlers: phase.*, activity.*, owner.*, integrations.*, details.*, view.*
 * 
 * @param {Object} params - Hook parameters
 * @param {Object} params.selectedEngagement - Currently selected engagement
 * @param {Function} params.updateEngagementInState - Function to update single engagement
 * @param {Object} params.currentUser - Current logged-in user
 * @param {Object} params.engagementViews - Map of engagement views
 * @param {Function} params.setEngagementViews - Setter for engagement views
 * @param {Function} params.logChangeAsync - Function to log changes
 * @param {Function} params.getOwnerInfo - Function to get owner info by ID
 * @param {Object} params.client - Amplify data client
 * @returns {Object} Namespaced detail operations
 */
const useEngagementDetail = ({
  selectedEngagement,
  updateEngagementInState,
  currentUser,
  engagementViews,
  setEngagementViews,
  logChangeAsync,
  getOwnerInfo,
  client
}) => {

  // ============================================
  // PHASE OPERATIONS
  // ============================================

  const handleSavePhase = useCallback(async (phaseId, phaseData) => {
    if (!selectedEngagement || !phaseId) return;
    
    const engagementId = selectedEngagement.id;
    const existingPhase = selectedEngagement.phases[phaseId];
    const previousStatus = existingPhase?.status || 'PENDING';
    const previousNotes = existingPhase?.notes || '';
    
    // Calculate new current phase if completing
    let newCurrentPhase = selectedEngagement.currentPhase;
    if (phaseData.status === 'COMPLETE') {
      const phaseIndex = phaseConfig.findIndex(p => p.id === phaseId);
      if (phaseIndex < phaseConfig.length - 1) {
        newCurrentPhase = phaseConfig[phaseIndex + 1].id;
      }
    }
    
    // Optimistic update
    updateEngagementInState(engagementId, (eng) => ({
      ...eng,
      currentPhase: newCurrentPhase,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          status: phaseData.status,
          notes: phaseData.notes,
          completedDate: phaseData.status === 'COMPLETE' ? getTodayDate() : eng.phases[phaseId]?.completedDate
        }
      }
    }));
    
    try {
      if (existingPhase && existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          status: phaseData.status,
          notes: phaseData.notes,
          completedDate: phaseData.status === 'COMPLETE' ? getTodayDate() : existingPhase.completedDate
        });
      } else {
        await client.models.Phase.create({
          engagementId: engagementId,
          phaseType: phaseId,
          status: phaseData.status || 'PENDING',
          completedDate: phaseData.status === 'COMPLETE' ? getTodayDate() : null,
          notes: phaseData.notes || null,
          links: null
        });
      }
      
      if (newCurrentPhase !== selectedEngagement.currentPhase) {
        await client.models.Engagement.update({
          id: engagementId,
          currentPhase: newCurrentPhase
        });
      }
      
      if (phaseData.status !== previousStatus) {
        logChangeAsync(
          engagementId,
          'PHASE_UPDATE',
          `${phaseLabels[phaseId]} phase changed to ${phaseData.status.toLowerCase().replace('_', ' ')}`,
          previousStatus,
          phaseData.status
        );
      }
      
    } catch (error) {
      console.error('Error updating phase:', error);
      // Rollback
      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        currentPhase: selectedEngagement.currentPhase,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            status: previousStatus,
            notes: previousNotes
          }
        }
      }));
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  const handleAddLink = useCallback(async (phaseId, linkData) => {
    if (!linkData?.title || !linkData?.url || !selectedEngagement || !phaseId) {
      return;
    }
    
    const engagementId = selectedEngagement.id;
    const linkToAdd = { title: linkData.title, url: linkData.url };
    const existingPhase = selectedEngagement.phases[phaseId];
    const currentLinks = parseLinks(existingPhase?.links);
    
    // Optimistic update
    updateEngagementInState(engagementId, (eng) => ({
      ...eng,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          links: [...currentLinks, linkToAdd]
        }
      }
    }));
    
    try {
      // Fetch fresh phase data from database
      const { data: freshPhases } = await client.models.Phase.list({
        filter: { engagementId: { eq: engagementId } }
      });
      const freshPhase = freshPhases.find(p => p.phaseType === phaseId);
      
      const freshLinks = parseLinks(freshPhase?.links);
      const updatedLinks = [...freshLinks, linkToAdd];
      
      if (freshPhase && freshPhase.id) {
        await client.models.Phase.update({
          id: freshPhase.id,
          links: JSON.stringify(updatedLinks)
        });
      } else {
        await client.models.Phase.create({
          engagementId: engagementId,
          phaseType: phaseId,
          status: 'PENDING',
          completedDate: null,
          notes: null,
          links: JSON.stringify(updatedLinks)
        });
      }
      
      logChangeAsync(
        engagementId,
        'LINK_ADDED',
        `Added link "${linkToAdd.title}" to ${phaseLabels[phaseId]} phase`
      );
      
    } catch (error) {
      console.error('Error adding link:', error);
      // Rollback
      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            links: currentLinks
          }
        }
      }));
      alert('Error saving link: ' + error.message);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  const handleRemoveLink = useCallback(async (phaseId, linkIndex) => {
    if (!selectedEngagement) return;
    
    const existingPhase = selectedEngagement.phases[phaseId];
    const currentLinks = parseLinks(existingPhase?.links);
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          links: currentLinks.filter((_, i) => i !== linkIndex)
        }
      }
    }));
    
    try {
      const updatedLinks = currentLinks.filter((_, i) => i !== linkIndex);
      
      if (existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          links: JSON.stringify(updatedLinks)
        });
      }
      
    } catch (error) {
      console.error('Error removing link:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            links: currentLinks
          }
        }
      }));
    }
  }, [selectedEngagement, updateEngagementInState, client]);

  // ============================================
  // ACTIVITY OPERATIONS
  // ============================================

  const handleAddActivity = useCallback(async (activityData) => {
    if (!activityData.date || !activityData.description || !selectedEngagement) return;
    
    const tempId = generateTempId();
    const tempActivity = {
      id: tempId,
      engagementId: selectedEngagement.id,
      date: activityData.date,
      type: activityData.type,
      description: activityData.description,
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: [tempActivity, ...eng.activities],
      lastActivity: activityData.date,
      isStale: false,
      daysSinceActivity: 0
    }));
    
    try {
      const { data: createdActivity } = await client.models.Activity.create({
        engagementId: selectedEngagement.id,
        date: activityData.date,
        type: activityData.type,
        description: activityData.description
      });
      
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: activityData.date
      });
      
      // Replace temp with real
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === tempId ? { ...createdActivity, comments: [] } : a
        )
      }));
      
      logChangeAsync(
        selectedEngagement.id, 
        'ACTIVITY_ADDED', 
        `Added ${activityTypeLabels[activityData.type]}: ${activityData.description.substring(0, 50)}${activityData.description.length > 50 ? '...' : ''}`
      );
      
      return true; // Success indicator
      
    } catch (error) {
      console.error('Error adding activity:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.filter(a => a.id !== tempId)
      }));
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  const handleAddComment = useCallback(async (activityId, commentText) => {
    if (!commentText?.trim() || !currentUser || !selectedEngagement) return;
    
    const tempId = generateTempId();
    const tempComment = {
      id: tempId,
      activityId: activityId,
      authorId: currentUser.id,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: eng.activities.map(a => 
        a.id === activityId 
          ? { ...a, comments: [...(a.comments || []), tempComment] }
          : a
      )
    }));
    
    try {
      const { data: createdComment } = await client.models.Comment.create({
        activityId: activityId,
        authorId: currentUser.id,
        text: commentText.trim()
      });
      
      // Replace temp with real
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === activityId 
            ? { ...a, comments: a.comments.map(c => c.id === tempId ? createdComment : c) }
            : a
        )
      }));
      
      logChangeAsync(
        selectedEngagement.id, 
        'COMMENT_ADDED', 
        `Added comment: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`
      );
      
      return true;
      
    } catch (error) {
      console.error('Error adding comment:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === activityId 
            ? { ...a, comments: a.comments.filter(c => c.id !== tempId) }
            : a
        )
      }));
      return false;
    }
  }, [selectedEngagement, currentUser, updateEngagementInState, logChangeAsync, client]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!selectedEngagement) return;
    
    // Find the activity and comment for rollback
    let targetActivity = null;
    let deletedComment = null;
    
    for (const activity of selectedEngagement.activities) {
      const comment = activity.comments?.find(c => c.id === commentId);
      if (comment) {
        targetActivity = activity;
        deletedComment = comment;
        break;
      }
    }
    
    if (!targetActivity || !deletedComment) return;
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: eng.activities.map(a => 
        a.id === targetActivity.id 
          ? { ...a, comments: a.comments.filter(c => c.id !== commentId) }
          : a
      )
    }));
    
    try {
      await client.models.Comment.delete({ id: commentId });
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === targetActivity.id 
            ? { ...a, comments: [...a.comments, deletedComment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) }
            : a
        )
      }));
    }
  }, [selectedEngagement, updateEngagementInState, client]);

  // ============================================
  // OWNER OPERATIONS
  // ============================================

  const handleAddOwner = useCallback(async (teamMemberId) => {
    if (!selectedEngagement || selectedEngagement.ownerIds?.includes(teamMemberId)) return;
    
    const tempId = generateTempId();
    const addedMember = getOwnerInfo(teamMemberId);
    
    // Optimistic update
    const newOwnerIds = [...(selectedEngagement.ownerIds || []), teamMemberId];
    const tempOwnershipRecord = {
      id: tempId,
      engagementId: selectedEngagement.id,
      teamMemberId: teamMemberId,
      role: 'secondary',
      addedAt: new Date().toISOString()
    };
    
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      ownerIds: newOwnerIds,
      ownershipRecords: [...(eng.ownershipRecords || []), tempOwnershipRecord]
    }));
    
    try {
      const { data: newRecord } = await client.models.EngagementOwner.create({
        engagementId: selectedEngagement.id,
        teamMemberId: teamMemberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });
      
      // Replace temp record with real one
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownershipRecords: eng.ownershipRecords.map(r => 
          r.id === tempId ? newRecord : r
        )
      }));
      
      logChangeAsync(selectedEngagement.id, 'OWNER_ADDED', `Added ${addedMember.name} as owner`);
      
    } catch (error) {
      console.error('Error adding owner:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownerIds: eng.ownerIds.filter(id => id !== teamMemberId),
        ownershipRecords: eng.ownershipRecords.filter(r => r.id !== tempId)
      }));
    }
  }, [selectedEngagement, updateEngagementInState, getOwnerInfo, logChangeAsync, client]);

  const handleRemoveOwner = useCallback(async (teamMemberId) => {
    if (!selectedEngagement) return;
    
    if (selectedEngagement.ownerIds?.length <= 1) {
      alert('Cannot remove the last owner. Add another owner first.');
      return;
    }
    
    const removedMember = getOwnerInfo(teamMemberId);
    const ownershipRecord = selectedEngagement.ownershipRecords?.find(
      o => o.teamMemberId === teamMemberId
    );
    
    // Store for rollback
    const previousOwnerIds = [...selectedEngagement.ownerIds];
    const previousOwnershipRecords = [...(selectedEngagement.ownershipRecords || [])];
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      ownerIds: eng.ownerIds.filter(id => id !== teamMemberId),
      ownershipRecords: eng.ownershipRecords?.filter(r => r.teamMemberId !== teamMemberId) || []
    }));
    
    try {
      if (ownershipRecord) {
        await client.models.EngagementOwner.delete({ id: ownershipRecord.id });
      }
      
      logChangeAsync(selectedEngagement.id, 'OWNER_REMOVED', `Removed ${removedMember.name} as owner`);
      
    } catch (error) {
      console.error('Error removing owner:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownerIds: previousOwnerIds,
        ownershipRecords: previousOwnershipRecords
      }));
    }
  }, [selectedEngagement, updateEngagementInState, getOwnerInfo, logChangeAsync, client]);

  // ============================================
  // INTEGRATIONS OPERATIONS
  // ============================================

  const handleUpdateIntegrations = useCallback(async (updates) => {
    if (!selectedEngagement) return;
    
    const previousValues = {
      salesforceId: selectedEngagement.salesforceId,
      salesforceUrl: selectedEngagement.salesforceUrl,
      jiraTicket: selectedEngagement.jiraTicket,
      jiraUrl: selectedEngagement.jiraUrl,
      slackChannel: selectedEngagement.slackChannel
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, updates);
    
    try {
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        ...updates
      });
      
      logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', 'Updated integration links');
      
    } catch (error) {
      console.error('Error updating integrations:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, previousValues);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // ============================================
  // DETAILS OPERATIONS
  // ============================================

  const handleUpdateDetails = useCallback(async (updates) => {
    if (!selectedEngagement) return;
    
    const previousValues = {
      company: selectedEngagement.company,
      contactName: selectedEngagement.contactName,
      contactEmail: selectedEngagement.contactEmail,
      contactPhone: selectedEngagement.contactPhone,
      industry: selectedEngagement.industry,
      dealSize: selectedEngagement.dealSize
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, updates);
    
    try {
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        ...updates
      });
      
      // Log changes for significant updates
      const changes = [];
      if (updates.company !== previousValues.company) changes.push(`company to "${updates.company}"`);
      if (updates.contactName !== previousValues.contactName) changes.push(`contact to "${updates.contactName}"`);
      if (updates.industry !== previousValues.industry) {
        const { industryLabels } = require('../constants');
        changes.push(`industry to ${industryLabels[updates.industry]}`);
      }
      if (updates.dealSize !== previousValues.dealSize) changes.push(`deal size to "${updates.dealSize || 'N/A'}"`);
      
      if (changes.length > 0) {
        logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', `Updated ${changes.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error updating details:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, previousValues);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // ============================================
  // VIEW OPERATIONS
  // ============================================

  const updateEngagementView = useCallback(async (engagementId) => {
    if (!currentUser) return;
    
    try {
      const existingView = engagementViews[engagementId];
      
      if (existingView) {
        await client.models.EngagementView.update({
          id: existingView.id,
          lastViewedAt: new Date().toISOString()
        });
      } else {
        await client.models.EngagementView.create({
          engagementId: engagementId,
          visitorId: currentUser.id,
          lastViewedAt: new Date().toISOString()
        });
      }
      
      setEngagementViews(prev => ({
        ...prev,
        [engagementId]: { ...prev[engagementId], lastViewedAt: new Date().toISOString() }
      }));
      
      updateEngagementInState(engagementId, { unreadChanges: 0 });
    } catch (e) {
      console.error('Error updating view:', e);
    }
  }, [currentUser, engagementViews, setEngagementViews, updateEngagementInState, client]);

  // Return namespaced operations
  return {
    phase: {
      save: handleSavePhase,
      addLink: handleAddLink,
      removeLink: handleRemoveLink
    },
    activity: {
      add: handleAddActivity,
      addComment: handleAddComment,
      deleteComment: handleDeleteComment
    },
    owner: {
      add: handleAddOwner,
      remove: handleRemoveOwner
    },
    integrations: {
      update: handleUpdateIntegrations
    },
    details: {
      update: handleUpdateDetails
    },
    view: {
      update: updateEngagementView
    }
  };
};

export default useEngagementDetail;
