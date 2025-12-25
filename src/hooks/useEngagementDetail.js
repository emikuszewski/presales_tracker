import { useCallback } from 'react';

var useEngagementDetail = function(params) {
  var selectedEngagement = params.selectedEngagement;
  var updateEngagementInState = params.updateEngagementInState;
  var currentUser = params.currentUser;
  var engagementViews = params.engagementViews;
  var setEngagementViews = params.setEngagementViews;
  var logChangeAsync = params.logChangeAsync;
  var getOwnerInfo = params.getOwnerInfo;
  var client = params.client;

  // View operations
  var viewUpdate = useCallback(async function(engagementId) {
    if (!currentUser || !engagementId) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var now = new Date().toISOString();
      var existingView = engagementViews[engagementId];

      if (existingView) {
        await dataClient.models.EngagementView.update({
          id: existingView.id,
          lastViewedAt: now
        });
        setEngagementViews(function(prev) {
          var updated = Object.assign({}, prev);
          updated[engagementId] = Object.assign({}, existingView, { lastViewedAt: now });
          return updated;
        });
      } else {
        var result = await dataClient.models.EngagementView.create({
          engagementId: engagementId,
          visitorId: currentUser.id,
          lastViewedAt: now
        });
        setEngagementViews(function(prev) {
          var updated = Object.assign({}, prev);
          updated[engagementId] = result.data;
          return updated;
        });
      }

      updateEngagementInState(engagementId, { unreadChanges: 0 });
    } catch (error) {
      console.error('Error updating view:', error);
    }
  }, [currentUser, engagementViews, setEngagementViews, updateEngagementInState, client]);

  // Phase operations
  var phaseSave = useCallback(async function(phaseType, phaseData) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) {
        console.error('Phase record not found for', phaseType);
        return;
      }

      var updateData = {
        status: phaseData.status,
        notes: phaseData.notes || ''
      };

      if (phaseData.status === 'COMPLETE') {
        updateData.completedDate = new Date().toISOString().split('T')[0];
      } else if (phaseRecord.status === 'COMPLETE' && phaseData.status !== 'COMPLETE') {
        updateData.completedDate = null;
      }

      await dataClient.models.Phase.update({
        id: phaseRecord.id,
        status: updateData.status,
        notes: updateData.notes,
        completedDate: updateData.completedDate
      });

      // Update currentPhase on the engagement when a phase is set to IN_PROGRESS
      var shouldUpdateCurrentPhase = phaseData.status === 'IN_PROGRESS';
      if (shouldUpdateCurrentPhase) {
        await dataClient.models.Engagement.update({
          id: selectedEngagement.id,
          currentPhase: phaseType
        });
      }

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], updateData);
        
        var updates = { phases: newPhases };
        if (shouldUpdateCurrentPhase) {
          updates.currentPhase = phaseType;
        }
        
        return Object.assign({}, eng, updates);
      });

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'PHASE_UPDATE', 'Updated ' + phaseType + ' phase to ' + phaseData.status);
      }
    } catch (error) {
      console.error('Error saving phase:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var phaseAddLink = useCallback(async function(phaseType, linkData) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) {
        console.error('Phase record not found for', phaseType);
        return;
      }

      var currentLinks = phaseRecord.links || [];
      var updatedLinks = currentLinks.concat([linkData]);

      await dataClient.models.Phase.update({
        id: phaseRecord.id,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], { links: updatedLinks });
        return Object.assign({}, eng, { phases: newPhases });
      });

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'LINK_ADDED', 'Added link "' + linkData.title + '" to ' + phaseType);
      }
    } catch (error) {
      console.error('Error adding link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var phaseRemoveLink = useCallback(async function(phaseType, linkIndex) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) return;

      var currentLinks = phaseRecord.links || [];
      var updatedLinks = currentLinks.filter(function(_, i) { return i !== linkIndex; });

      await dataClient.models.Phase.update({
        id: phaseRecord.id,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], { links: updatedLinks });
        return Object.assign({}, eng, { phases: newPhases });
      });
    } catch (error) {
      console.error('Error removing link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client]);

  // Activity operations
  var activityAdd = useCallback(async function(activityData) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      var result = await dataClient.models.Activity.create({
        engagementId: selectedEngagement.id,
        date: activityData.date,
        type: activityData.type,
        description: activityData.description
      });

      await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: activityData.date
      });

      var newActivity = Object.assign({}, result.data, { comments: [] });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          lastActivity: activityData.date,
          activities: [newActivity].concat(eng.activities),
          isStale: false
        });
      });

      if (logChangeAsync) {
        var desc = activityData.description;
        var truncated = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
        logChangeAsync(selectedEngagement.id, 'ACTIVITY_ADDED', 'Added ' + activityData.type + ': ' + truncated);
      }

      return true;
    } catch (error) {
      console.error('Error adding activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var activityEdit = useCallback(async function(activityId, updates) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Update activity in DB
      await dataClient.models.Activity.update({
        id: activityId,
        type: updates.type,
        date: updates.date,
        description: updates.description
      });

      // Check if we need to update engagement.lastActivity
      var activities = selectedEngagement.activities;
      var updatedActivities = activities.map(function(a) {
        if (a.id === activityId) {
          return Object.assign({}, a, updates);
        }
        return a;
      });

      // Recalculate lastActivity from all activities
      var newLastActivity = updatedActivities.reduce(function(latest, a) {
        return a.date > latest ? a.date : latest;
      }, updatedActivities[0]?.date || selectedEngagement.startDate);

      // Update engagement.lastActivity if changed
      if (newLastActivity !== selectedEngagement.lastActivity) {
        await dataClient.models.Engagement.update({
          id: selectedEngagement.id,
          lastActivity: newLastActivity
        });
      }

      // Update local state
      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newActivities = eng.activities.map(function(a) {
          if (a.id === activityId) {
            return Object.assign({}, a, updates);
          }
          return a;
        });
        // Re-sort by date (newest first)
        newActivities.sort(function(a, b) {
          return new Date(b.date) - new Date(a.date);
        });
        return Object.assign({}, eng, {
          activities: newActivities,
          lastActivity: newLastActivity
        });
      });

      if (logChangeAsync) {
        var truncated = updates.description.length > 40 
          ? updates.description.substring(0, 40) + '...' 
          : updates.description;
        logChangeAsync(selectedEngagement.id, 'ACTIVITY_EDITED', 'Edited activity: "' + truncated + '"');
      }

      return true;
    } catch (error) {
      console.error('Error editing activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var activityDelete = useCallback(async function(activityId) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the activity to get its info for logging
      var activity = selectedEngagement.activities.find(function(a) { return a.id === activityId; });
      if (!activity) return false;

      // Delete all comments for this activity first
      var comments = activity.comments || [];
      for (var i = 0; i < comments.length; i++) {
        await dataClient.models.Comment.delete({ id: comments[i].id });
      }

      // Delete the activity
      await dataClient.models.Activity.delete({ id: activityId });

      // Recalculate lastActivity from remaining activities
      var remainingActivities = selectedEngagement.activities.filter(function(a) { 
        return a.id !== activityId; 
      });
      var newLastActivity = remainingActivities.length > 0
        ? remainingActivities.reduce(function(latest, a) {
            return a.date > latest ? a.date : latest;
          }, remainingActivities[0].date)
        : selectedEngagement.startDate;

      // Update engagement.lastActivity in DB
      await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: newLastActivity
      });

      // Update local state
      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          activities: eng.activities.filter(function(a) { return a.id !== activityId; }),
          lastActivity: newLastActivity
        });
      });

      if (logChangeAsync) {
        logChangeAsync(
          selectedEngagement.id, 
          'ACTIVITY_DELETED', 
          'Deleted ' + activity.type + ' activity from ' + activity.date
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var activityAddComment = useCallback(async function(activityId, commentText) {
    if (!selectedEngagement || !currentUser || !commentText) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      var result = await dataClient.models.Comment.create({
        activityId: activityId,
        authorId: currentUser.id,
        text: commentText
      });

      var newComment = result.data;

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newActivities = eng.activities.map(function(a) {
          if (a.id === activityId) {
            return Object.assign({}, a, { comments: a.comments.concat([newComment]) });
          }
          return a;
        });
        return Object.assign({}, eng, { activities: newActivities });
      });

      if (logChangeAsync) {
        var truncated = commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText;
        logChangeAsync(selectedEngagement.id, 'COMMENT_ADDED', 'Commented: "' + truncated + '"');
      }

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }, [selectedEngagement, currentUser, updateEngagementInState, logChangeAsync, client]);

  var activityDeleteComment = useCallback(async function(commentId) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Comment.delete({ id: commentId });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newActivities = eng.activities.map(function(a) {
          return Object.assign({}, a, {
            comments: a.comments.filter(function(c) { return c.id !== commentId; })
          });
        });
        return Object.assign({}, eng, { activities: newActivities });
      });

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'COMMENT_DELETED', 'Deleted a comment');
      }

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // Note operations
  var noteAdd = useCallback(async function(phaseType, text) {
    if (!selectedEngagement || !currentUser || !text) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      var result = await dataClient.models.PhaseNote.create({
        engagementId: selectedEngagement.id,
        phaseType: phaseType,
        text: text,
        authorId: currentUser.id
      });

      var newNote = result.data;

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        // Add new note at the beginning (newest first)
        newNotesByPhase[phaseType] = [newNote].concat(phaseNotes);

        // Update flat phaseNotes array
        var newPhaseNotes = [newNote].concat(eng.phaseNotes || []);

        return Object.assign({}, eng, {
          notesByPhase: newNotesByPhase,
          phaseNotes: newPhaseNotes,
          totalNotesCount: (eng.totalNotesCount || 0) + 1
        });
      });

      if (logChangeAsync) {
        var truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
        logChangeAsync(selectedEngagement.id, 'NOTE_ADDED', 'Added note to ' + phaseType + ': "' + truncated + '"');
      }

      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    }
  }, [selectedEngagement, currentUser, updateEngagementInState, logChangeAsync, client]);

  var noteEdit = useCallback(async function(noteId, phaseType, text) {
    if (!selectedEngagement || !noteId || !text) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.PhaseNote.update({
        id: noteId,
        text: text
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        newNotesByPhase[phaseType] = phaseNotes.map(function(note) {
          if (note.id === noteId) {
            return Object.assign({}, note, { 
              text: text, 
              updatedAt: new Date().toISOString() 
            });
          }
          return note;
        });

        // Update flat phaseNotes array
        var newPhaseNotes = (eng.phaseNotes || []).map(function(note) {
          if (note.id === noteId) {
            return Object.assign({}, note, { 
              text: text, 
              updatedAt: new Date().toISOString() 
            });
          }
          return note;
        });

        return Object.assign({}, eng, {
          notesByPhase: newNotesByPhase,
          phaseNotes: newPhaseNotes
        });
      });

      if (logChangeAsync) {
        var truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
        logChangeAsync(selectedEngagement.id, 'NOTE_EDITED', 'Edited note in ' + phaseType + ': "' + truncated + '"');
      }

      return true;
    } catch (error) {
      console.error('Error editing note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  var noteDelete = useCallback(async function(noteId, phaseType) {
    if (!selectedEngagement || !noteId) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.PhaseNote.delete({ id: noteId });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        newNotesByPhase[phaseType] = phaseNotes.filter(function(note) {
          return note.id !== noteId;
        });

        // Update flat phaseNotes array
        var newPhaseNotes = (eng.phaseNotes || []).filter(function(note) {
          return note.id !== noteId;
        });

        return Object.assign({}, eng, {
          notesByPhase: newNotesByPhase,
          phaseNotes: newPhaseNotes,
          totalNotesCount: Math.max(0, (eng.totalNotesCount || 0) - 1)
        });
      });

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'NOTE_DELETED', 'Deleted note from ' + phaseType);
      }

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // Integrations operations
  var integrationsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates));

      updateEngagementInState(selectedEngagement.id, updates);

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', 'Updated integrations');
      }
    } catch (error) {
      console.error('Error updating integrations:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // Details operations
  var detailsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates));

      updateEngagementInState(selectedEngagement.id, updates);
    } catch (error) {
      console.error('Error updating details:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client]);

  // Owner operations
  var ownerAdd = useCallback(async function(memberId) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      var result = await dataClient.models.EngagementOwner.create({
        engagementId: selectedEngagement.id,
        teamMemberId: memberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          ownerIds: eng.ownerIds.concat([memberId]),
          ownershipRecords: (eng.ownershipRecords || []).concat([result.data])
        });
      });

      if (logChangeAsync) {
        var member = getOwnerInfo(memberId);
        logChangeAsync(selectedEngagement.id, 'OWNER_ADDED', 'Added ' + member.name + ' as owner');
      }
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, getOwnerInfo, client]);

  var ownerRemove = useCallback(async function(memberId) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the ownership record
      var ownershipRecord = (selectedEngagement.ownershipRecords || []).find(function(o) {
        return o.teamMemberId === memberId;
      });

      if (ownershipRecord) {
        await dataClient.models.EngagementOwner.delete({ id: ownershipRecord.id });
      }

      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          ownerIds: eng.ownerIds.filter(function(id) { return id !== memberId; }),
          ownershipRecords: (eng.ownershipRecords || []).filter(function(o) { return o.teamMemberId !== memberId; })
        });
      });

      if (logChangeAsync) {
        var member = getOwnerInfo(memberId);
        logChangeAsync(selectedEngagement.id, 'OWNER_REMOVED', 'Removed ' + member.name + ' as owner');
      }
    } catch (error) {
      console.error('Error removing owner:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, getOwnerInfo, client]);

  // Return namespaced object matching what App.jsx and DetailView.jsx expect
  return {
    view: {
      update: viewUpdate
    },
    phase: {
      save: phaseSave,
      addLink: phaseAddLink,
      removeLink: phaseRemoveLink
    },
    activity: {
      add: activityAdd,
      edit: activityEdit,
      delete: activityDelete,
      addComment: activityAddComment,
      deleteComment: activityDeleteComment
    },
    note: {
      add: noteAdd,
      edit: noteEdit,
      delete: noteDelete
    },
    integrations: {
      update: integrationsUpdate
    },
    details: {
      update: detailsUpdate
    },
    owner: {
      add: ownerAdd,
      remove: ownerRemove
    }
  };
};

export default useEngagementDetail;
