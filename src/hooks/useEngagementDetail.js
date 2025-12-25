import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';

var useEngagementDetail = function(params) {
  var currentUser = params.currentUser;
  var updateEngagementInState = params.updateEngagementInState;
  var logChangeAsync = params.logChangeAsync;

  var updatePhaseStatus = useCallback(async function(engagementId, phaseId, phaseType, newStatus, previousStatus) {
    try {
      var client = generateClient();
      var updateData = { status: newStatus };
      
      if (newStatus === 'COMPLETE') {
        updateData.completedDate = new Date().toISOString().split('T')[0];
      } else if (previousStatus === 'COMPLETE') {
        updateData.completedDate = null;
      }

      await client.models.Phase.update({
        id: phaseId,
        ...updateData
      });

      updateEngagementInState(engagementId, function(eng) {
        var newPhases = { ...eng.phases };
        newPhases[phaseType] = {
          ...eng.phases[phaseType],
          status: newStatus,
          completedDate: updateData.completedDate !== undefined ? updateData.completedDate : eng.phases[phaseType].completedDate
        };
        return { ...eng, phases: newPhases };
      });

      logChangeAsync(engagementId, 'PHASE_UPDATE', 'Updated ' + phaseType + ' phase to ' + newStatus, previousStatus, newStatus);

      return { success: true };
    } catch (error) {
      console.error('Error updating phase status:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  var addPhaseLink = useCallback(async function(engagementId, phaseId, phaseType, currentLinks, newLink) {
    try {
      var client = generateClient();
      var updatedLinks = currentLinks.concat([newLink]);
      
      await client.models.Phase.update({
        id: phaseId,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(engagementId, function(eng) {
        var newPhases = { ...eng.phases };
        newPhases[phaseType] = { ...eng.phases[phaseType], links: updatedLinks };
        return { ...eng, phases: newPhases };
      });

      logChangeAsync(engagementId, 'LINK_ADDED', 'Added link "' + newLink.title + '" to ' + phaseType + ' phase');

      return { success: true };
    } catch (error) {
      console.error('Error adding phase link:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  var removePhaseLink = useCallback(async function(engagementId, phaseId, phaseType, currentLinks, linkIndex) {
    try {
      var client = generateClient();
      var updatedLinks = currentLinks.filter(function(_, i) { return i !== linkIndex; });
      
      await client.models.Phase.update({
        id: phaseId,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(engagementId, function(eng) {
        var newPhases = { ...eng.phases };
        newPhases[phaseType] = { ...eng.phases[phaseType], links: updatedLinks };
        return { ...eng, phases: newPhases };
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing phase link:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState]);

  var addActivity = useCallback(async function(engagementId, activityData) {
    try {
      var client = generateClient();
      var result = await client.models.Activity.create({
        engagementId: engagementId,
        date: activityData.date,
        type: activityData.type,
        description: activityData.description
      });

      await client.models.Engagement.update({
        id: engagementId,
        lastActivity: activityData.date
      });

      var activityWithComments = { ...result.data, comments: [] };

      updateEngagementInState(engagementId, function(eng) {
        return {
          ...eng,
          lastActivity: activityData.date,
          activities: [activityWithComments].concat(eng.activities),
          isStale: false
        };
      });

      var desc = activityData.description;
      var truncated = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
      logChangeAsync(engagementId, 'ACTIVITY_ADDED', 'Added ' + activityData.type + ': ' + truncated);

      return { success: true, activity: activityWithComments };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  var addComment = useCallback(async function(engagementId, activityId, text) {
    if (!currentUser) return { success: false, error: 'No current user' };

    try {
      var client = generateClient();
      var result = await client.models.Comment.create({
        activityId: activityId,
        authorId: currentUser.id,
        text: text
      });

      var newComment = result.data;

      updateEngagementInState(engagementId, function(eng) {
        var newActivities = eng.activities.map(function(a) {
          if (a.id === activityId) {
            return { ...a, comments: a.comments.concat([newComment]) };
          }
          return a;
        });
        return { ...eng, activities: newActivities };
      });

      var truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
      logChangeAsync(engagementId, 'COMMENT_ADDED', 'Commented: "' + truncated + '"');

      return { success: true, comment: newComment };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error };
    }
  }, [currentUser, updateEngagementInState, logChangeAsync]);

  var addPhaseNote = useCallback(async function(engagementId, phaseType, text) {
    if (!currentUser) return { success: false, error: 'No current user' };
    if (!text.trim()) return { success: false, error: 'Note text is required' };

    try {
      var client = generateClient();
      var result = await client.models.PhaseNote.create({
        engagementId: engagementId,
        phaseType: phaseType,
        text: text.trim(),
        authorId: currentUser.id
      });

      var newNote = result.data;

      updateEngagementInState(engagementId, function(eng) {
        var updatedPhaseNotes = [newNote].concat(eng.phaseNotes);
        var updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = [newNote].concat(updatedNotesByPhase[phaseType] || []);
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase,
          totalNotesCount: eng.totalNotesCount + 1
        };
      });

      var truncatedText = text.length > 50 ? text.substring(0, 47) + '...' : text;
      logChangeAsync(engagementId, 'NOTE_ADDED', 'Added note to ' + phaseType + ': "' + truncatedText + '"');

      return { success: true, note: newNote };
    } catch (error) {
      console.error('Error adding phase note:', error);
      return { success: false, error: error };
    }
  }, [currentUser, updateEngagementInState, logChangeAsync]);

  var updatePhaseNote = useCallback(async function(engagementId, noteId, phaseType, newText) {
    if (!newText.trim()) return { success: false, error: 'Note text is required' };

    try {
      var client = generateClient();
      var result = await client.models.PhaseNote.update({
        id: noteId,
        text: newText.trim()
      });

      var updatedNote = result.data;

      updateEngagementInState(engagementId, function(eng) {
        var updatedPhaseNotes = eng.phaseNotes.map(function(n) {
          return n.id === noteId ? { ...n, text: newText.trim(), updatedAt: updatedNote.updatedAt } : n;
        });
        var updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = (updatedNotesByPhase[phaseType] || []).map(function(n) {
          return n.id === noteId ? { ...n, text: newText.trim(), updatedAt: updatedNote.updatedAt } : n;
        });
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase
        };
      });

      logChangeAsync(engagementId, 'NOTE_EDITED', 'Edited note in ' + phaseType);

      return { success: true, note: updatedNote };
    } catch (error) {
      console.error('Error updating phase note:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  var deletePhaseNote = useCallback(async function(engagementId, noteId, phaseType) {
    try {
      var client = generateClient();
      await client.models.PhaseNote.delete({ id: noteId });

      updateEngagementInState(engagementId, function(eng) {
        var updatedPhaseNotes = eng.phaseNotes.filter(function(n) { return n.id !== noteId; });
        var updatedNotesByPhase = { ...eng.notesByPhase };
        updatedNotesByPhase[phaseType] = (updatedNotesByPhase[phaseType] || []).filter(function(n) { return n.id !== noteId; });
        
        return {
          ...eng,
          phaseNotes: updatedPhaseNotes,
          notesByPhase: updatedNotesByPhase,
          totalNotesCount: eng.totalNotesCount - 1
        };
      });

      logChangeAsync(engagementId, 'NOTE_DELETED', 'Deleted note from ' + phaseType);

      return { success: true };
    } catch (error) {
      console.error('Error deleting phase note:', error);
      return { success: false, error: error };
    }
  }, [updateEngagementInState, logChangeAsync]);

  var markEngagementViewed = useCallback(async function(engagementId, existingView, setEngagementViews) {
    if (!currentUser) return;

    try {
      var client = generateClient();
      var now = new Date().toISOString();
      
      if (existingView) {
        await client.models.EngagementView.update({
          id: existingView.id,
          lastViewedAt: now
        });
        setEngagementViews(function(prev) {
          var updated = { ...prev };
          updated[engagementId] = { ...existingView, lastViewedAt: now };
          return updated;
        });
      } else {
        var result = await client.models.EngagementView.create({
          engagementId: engagementId,
          visitorId: currentUser.id,
          lastViewedAt: now
        });
        setEngagementViews(function(prev) {
          var updated = { ...prev };
          updated[engagementId] = result.data;
          return updated;
        });
      }

      updateEngagementInState(engagementId, { unreadChanges: 0 });
    } catch (error) {
      console.error('Error marking engagement viewed:', error);
    }
  }, [currentUser, updateEngagementInState]);

  return {
    updatePhaseStatus: updatePhaseStatus,
    addPhaseLink: addPhaseLink,
    removePhaseLink: removePhaseLink,
    addActivity: addActivity,
    addComment: addComment,
    addPhaseNote: addPhaseNote,
    updatePhaseNote: updatePhaseNote,
    deletePhaseNote: deletePhaseNote,
    markEngagementViewed: markEngagementViewed
  };
};

export default useEngagementDetail;
