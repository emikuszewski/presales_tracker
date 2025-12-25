import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';

const useEngagementDetail = ({ currentUser, updateEngagementInState, logChangeAsync }) => {

  const updatePhaseStatus = useCallback(async (engagementId, phaseId, phaseType, newStatus, previousStatus) => {
    try {
      const client = generateClient();
      const updateData = { status: newStatus };
      
      if (newStatus === 'COMPLETE') {
        updateData.completedDate = new Date().toISOString().split('T')[0];
      } else if (previousStatus === 'COMPLETE') {
        updateData.completedDate = null;
      }

      await client.models.Phase.update({
        id: phaseId,
        ...updateData
      });

      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseType]: {
            ...eng.phases[phaseType],
            status: newStatus,
            completedDate: updateData.completedDate !== undefined 
              ? updateData.completedDate 
              : eng.phases[phaseType].completedDate
          }
        }
      }));

      logChangeAsync(
        engagementId,
        'PHASE_UPDATE',
        `Updated ${phaseType} phase to ${newStatus}`,
        previousStatus,
        newStatus
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating phase status:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  const addPhaseLink = useCallback(async (engagementId, phaseId, phaseType, currentLinks, newLink) => {
    try {
      const client = generateClient();
      const updatedLinks = [...currentLinks, newLink];
      
      await client.models.Phase.update({
        id: phaseId,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseType]: {
            ...eng.phases[phaseType],
            links: updatedLinks
          }
        }
      }));

      logChangeAsync(
        engagementId,
        'LINK_ADDED',
        `Added link "${newLink.title}" to ${phaseType} phase`
      );

      return { success: true };
    } catch (error) {
      console.error('Error adding phase link:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  const removePhaseLink = useCallback(async (engagementId, phaseId, phaseType, currentLinks, linkIndex) => {
    try {
      const client = generateClient();
      const updatedLinks = currentLinks.filter((_, i) => i !== linkIndex);
      
      await client.models.Phase.update({
        id: phaseId,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseType]: {
            ...eng.phases[phaseType],
            links: updatedLinks
          }
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error removing phase link:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState]);

  const addActivity = useCallback(async (engagementId, activityData) => {
    try {
      const client = generateClient();
      const { data: newActivity } = await client.models.Activity.create({
        engagementId,
        date: activityData.date,
        type: activityData.type,
        description: activityData.description
      });

      await client.models.Engagement.update({
        id: engagementId,
        lastActivity: activityData.date
      });

      const activityWithComments = { ...newActivity, comments: [] };

      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        lastActivity: activityData.date,
        activities: [activityWithComments, ...eng.activities],
        isStale: false
      }));

      logChangeAsync(
        engagementId,
        'ACTIVITY_ADDED',
        `Added ${activityData.type}: ${activityData.description.substring(0, 50)}${activityData.description.length > 50 ? '...' : ''}`
      );

      return { success: true, activity: activityWithComments };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  const addComment = useCallback(async (engagementId, activityId, text) => {
    if (!currentUser) return { success: false, error: 'No current user' };

    try {
      const client = generateClient();
      const { data: newComment } = await client.models.Comment.create({
        activityId,
        authorId: currentUser.id,
        text
      });

      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === activityId 
            ? { ...a, comments: [...a.comments, newComment] }
            : a
        )
      }));

      logChangeAsync(
        engagementId,
        'COMMENT_ADDED',
        `Commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
      );

      return { success: true, comment: newComment };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error };
    }
  }, [currentUser, updateEngagementInState, logChangeAsync]);

  const addPhaseNote = useCallback(async (engagementId, phaseType, text) => {
    if (!currentUser) return { success: false, error: 'No current user' };
    if (!text.trim()) return { success: false, error: 'Note text is required' };

    try {
      const client = generateClient();
      const { data: newNote } = await client.models.PhaseNote.create({
        engagementId,
        phaseType,
        text: text.trim(),
        authorId: currentUser.id
      });

      updateEngagementInState(engagementId, (eng) => {
        const updatedPhaseNotes = [newNote, ...eng.phaseNotes];
        const updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = [newNote, ...(updatedNotesByPhase[phaseType] || [])];
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase,
          totalNotesCount: eng.totalNotesCount + 1
        };
      });

      const truncatedText = text.length > 50 ? text.substring(0, 47) + '...' : text;
      logChangeAsync(
        engagementId,
        'NOTE_ADDED',
        `Added note to ${phaseType}: "${truncatedText}"`
      );

      return { success: true, note: newNote };
    } catch (error) {
      console.error('Error adding phase note:', error);
      return { success: false, error };
    }
  }, [currentUser, updateEngagementInState, logChangeAsync]);

  const updatePhaseNote = useCallback(async (engagementId, noteId, phaseType, newText) => {
    if (!newText.trim()) return { success: false, error: 'Note text is required' };

    try {
      const client = generateClient();
      const { data: updatedNote } = await client.models.PhaseNote.update({
        id: noteId,
        text: newText.trim()
      });

      updateEngagementInState(engagementId, (eng) => {
        const updatedPhaseNotes = eng.phaseNotes.map(n => 
          n.id === noteId ? { ...n, text: newText.trim(), updatedAt: updatedNote.updatedAt } : n
        );
        const updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = (updatedNotesByPhase[phaseType] || []).map(n =>
          n.id === noteId ? { ...n, text: newText.trim(), updatedAt: updatedNote.updatedAt } : n
        );
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase
        };
      });

      logChangeAsync(
        engagementId,
        'NOTE_EDITED',
        `Edited note in ${phaseType}`
      );

      return { success: true, note: updatedNote };
    } catch (error) {
      console.error('Error updating phase note:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  const deletePhaseNote = useCallback(async (engagementId, noteId, phaseType) => {
    try {
      const client = generateClient();
      await client.models.PhaseNote.delete({ id: noteId });

      updateEngagementInState(engagementId, (eng) => {
        const updatedPhaseNotes = eng.phaseNotes.filter(n => n.id !== noteId);
        const updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = (updatedNotesByPhase[phaseType] || []).filter(n => n.id !== noteId);
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase,
          totalNotesCount: eng.totalNotesCount - 1
        };
      });

      logChangeAsync(
        engagementId,
        'NOTE_DELETED',
        `Deleted note from ${phaseType}`
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting phase note:', error);
      return { success: false, error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  const markEngagementViewed = useCallback(async (engagementId, existingView, setEngagementViews) => {
    if (!currentUser) return;

    try {
      const client = generateClient();
      const now = new Date().toISOString();
      
      if (existingView) {
        await client.models.EngagementView.update({
          id: existingView.id,
          lastViewedAt: now
        });
        setEngagementViews(prev => ({
          ...prev,
          [engagementId]: { ...existingView, lastViewedAt: now }
        }));
      } else {
        const { data: newView } = await client.models.EngagementView.create({
          engagementId,
          visitorId: currentUser.id,
          lastViewedAt: now
        });
        setEngagementViews(prev => ({
          ...prev,
          [engagementId]: newView
        }));
      }

      updateEngagementInState(engagementId, { unreadChanges: 0 });
    } catch (error) {
      console.error('Error marking engagement viewed:', error);
    }
  }, [currentUser, updateEngagementInState]);

  return {
    updatePhaseStatus,
    addPhaseLink,
    removePhaseLink,
    addActivity,
    addComment,
    addPhaseNote,
    updatePhaseNote,
    deletePhaseNote,
    markEngagementViewed
  };
};

export default useEngagementDetail;
