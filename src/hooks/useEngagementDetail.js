import { useCallback } from 'react';
import { isClosedStatus } from '../utils';
import { engagementStatusLabels, competitorLabels } from '../constants';

/**
 * Helper to check if an error is a conditional check failure
 * These occur when another user modified the record since we last fetched it
 */
var isConditionalCheckFailed = function(error) {
  if (!error) return false;
  var message = error.message || '';
  var name = error.name || '';
  // Check for various Amplify/DynamoDB conditional check failure patterns
  return (
    message.indexOf('ConditionalCheckFailed') !== -1 ||
    message.indexOf('conditional request failed') !== -1 ||
    message.indexOf('The conditional request failed') !== -1 ||
    name === 'ConditionalCheckFailedException'
  );
};

var useEngagementDetail = function(params) {
  var selectedEngagement = params.selectedEngagement;
  var updateEngagementInState = params.updateEngagementInState;
  var currentUser = params.currentUser;
  var engagementViews = params.engagementViews;
  var setEngagementViews = params.setEngagementViews;
  var logChangeAsync = params.logChangeAsync;
  var getOwnerInfo = params.getOwnerInfo;
  var client = params.client;
  var onConflict = params.onConflict; // NEW: callback for conflict handling

  /**
   * Helper to handle conflict errors
   * @param {Error} error - The caught error
   * @param {string} recordType - Type of record (e.g., "engagement", "activity")
   * @returns {boolean} - True if it was a conflict error (handled), false otherwise
   */
  var handleConflictError = useCallback(function(error, recordType) {
    if (isConditionalCheckFailed(error)) {
      console.warn('[OptimisticLock] Conflict detected for ' + recordType);
      if (onConflict) {
        onConflict({ recordType: recordType });
      }
      return true;
    }
    return false;
  }, [onConflict]);

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

  // Engagement status operations - WITH OPTIMISTIC LOCKING
  var statusUpdate = useCallback(async function(newStatus, closedReason) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var oldStatus = selectedEngagement.engagementStatus || 'ACTIVE';
      
      // Prepare update data
      var updateData = {
        id: selectedEngagement.id,
        engagementStatus: newStatus
      };
      
      // If closing (WON/LOST/DISQUALIFIED/NO_DECISION), auto-archive
      if (isClosedStatus(newStatus)) {
        updateData.isArchived = true;
      }
      
      // If providing a closed reason, include it
      if (closedReason !== undefined) {
        updateData.closedReason = closedReason || null;
      }

      // OPTIMISTIC LOCKING: Add condition based on updatedAt
      await dataClient.models.Engagement.update(updateData, {
        condition: {
          updatedAt: { eq: selectedEngagement.updatedAt }
        }
      });

      // Update local state
      var stateUpdate = {
        engagementStatus: newStatus
      };
      
      if (isClosedStatus(newStatus)) {
        stateUpdate.isArchived = true;
        stateUpdate.isStale = false; // Closed engagements are never stale
      }
      
      if (closedReason !== undefined) {
        stateUpdate.closedReason = closedReason || null;
      }

      updateEngagementInState(selectedEngagement.id, stateUpdate);

      // Log the change
      if (logChangeAsync) {
        var oldLabel = engagementStatusLabels[oldStatus] || oldStatus;
        var newLabel = engagementStatusLabels[newStatus] || newStatus;
        var description = 'Changed status from ' + oldLabel + ' to ' + newLabel;
        if (closedReason) {
          description += ': "' + (closedReason.length > 50 ? closedReason.substring(0, 50) + '...' : closedReason) + '"';
        }
        logChangeAsync(selectedEngagement.id, 'STATUS_CHANGED', description, oldStatus, newStatus);
      }

      return true;
    } catch (error) {
      if (handleConflictError(error, 'engagement')) {
        return false;
      }
      console.error('Error updating status:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // Update closed reason only - WITH OPTIMISTIC LOCKING
  var closedReasonUpdate = useCallback(async function(closedReason) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        closedReason: closedReason || null
      }, {
        condition: {
          updatedAt: { eq: selectedEngagement.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, {
        closedReason: closedReason || null
      });

      return true;
    } catch (error) {
      if (handleConflictError(error, 'engagement')) {
        return false;
      }
      console.error('Error updating closed reason:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, client, handleConflictError]);

  // Competitors update operation - WITH OPTIMISTIC LOCKING
  var competitorsUpdate = useCallback(async function(competitorData) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      var oldCompetitors = selectedEngagement.competitors || [];
      var newCompetitors = competitorData.competitors || [];
      
      // Store competitors as JSON string in DB
      var competitorsJson = newCompetitors.length > 0 ? JSON.stringify(newCompetitors) : null;

      await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        competitors: competitorsJson,
        competitorNotes: competitorData.competitorNotes || null,
        otherCompetitorName: competitorData.otherCompetitorName || null
      }, {
        condition: {
          updatedAt: { eq: selectedEngagement.updatedAt }
        }
      });

      // Update local state
      updateEngagementInState(selectedEngagement.id, {
        competitors: newCompetitors,
        competitorNotes: competitorData.competitorNotes || null,
        otherCompetitorName: competitorData.otherCompetitorName || null
      });

      // Build change log description
      if (logChangeAsync) {
        var addedCompetitors = newCompetitors.filter(function(c) { return oldCompetitors.indexOf(c) === -1; });
        var removedCompetitors = oldCompetitors.filter(function(c) { return newCompetitors.indexOf(c) === -1; });
        
        var descParts = [];
        
        if (addedCompetitors.length > 0) {
          var addedLabels = addedCompetitors.map(function(c) {
            if (c === 'OTHER' && competitorData.otherCompetitorName) {
              return 'Other (' + competitorData.otherCompetitorName + ')';
            }
            return competitorLabels[c] || c;
          });
          descParts.push('Added ' + addedLabels.join(', '));
        }
        
        if (removedCompetitors.length > 0) {
          var removedLabels = removedCompetitors.map(function(c) {
            return competitorLabels[c] || c;
          });
          descParts.push('Removed ' + removedLabels.join(', '));
        }
        
        // Check if notes changed
        var oldNotes = selectedEngagement.competitorNotes || '';
        var newNotes = competitorData.competitorNotes || '';
        if (oldNotes !== newNotes) {
          if (descParts.length > 0) {
            descParts.push('updated notes');
          } else {
            descParts.push('Updated competition notes');
          }
        }
        
        if (descParts.length > 0) {
          var description = descParts.join('; ');
          logChangeAsync(selectedEngagement.id, 'COMPETITORS_UPDATED', description);
        }
      }

      return true;
    } catch (error) {
      if (handleConflictError(error, 'engagement')) {
        return false;
      }
      console.error('Error updating competitors:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // Phase operations - WITH OPTIMISTIC LOCKING
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
      }, {
        condition: {
          updatedAt: { eq: phaseRecord.updatedAt }
        }
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
      if (handleConflictError(error, 'phase')) {
        return;
      }
      console.error('Error saving phase:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

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
      }, {
        condition: {
          updatedAt: { eq: phaseRecord.updatedAt }
        }
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
      if (handleConflictError(error, 'phase')) {
        return;
      }
      console.error('Error adding link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

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
      }, {
        condition: {
          updatedAt: { eq: phaseRecord.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], { links: updatedLinks });
        return Object.assign({}, eng, { phases: newPhases });
      });
    } catch (error) {
      if (handleConflictError(error, 'phase')) {
        return;
      }
      console.error('Error removing link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client, handleConflictError]);

  // Activity operations - activityAdd does NOT need locking (it's a create)
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

  // activityEdit - WITH OPTIMISTIC LOCKING
  var activityEdit = useCallback(async function(activityId, updates) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the activity to get its updatedAt
      var activity = selectedEngagement.activities.find(function(a) { return a.id === activityId; });
      if (!activity) return false;

      // Update activity in DB with optimistic lock
      await dataClient.models.Activity.update({
        id: activityId,
        type: updates.type,
        date: updates.date,
        description: updates.description
      }, {
        condition: {
          updatedAt: { eq: activity.updatedAt }
        }
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
      if (handleConflictError(error, 'activity')) {
        return false;
      }
      console.error('Error editing activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // activityDelete - WITH OPTIMISTIC LOCKING
  var activityDelete = useCallback(async function(activityId) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the activity to get its info for logging and updatedAt
      var activity = selectedEngagement.activities.find(function(a) { return a.id === activityId; });
      if (!activity) return false;

      // Delete all comments for this activity first
      var comments = activity.comments || [];
      for (var i = 0; i < comments.length; i++) {
        await dataClient.models.Comment.delete({ id: comments[i].id });
      }

      // Delete the activity with optimistic lock
      await dataClient.models.Activity.delete({ id: activityId }, {
        condition: {
          updatedAt: { eq: activity.updatedAt }
        }
      });

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
      if (handleConflictError(error, 'activity')) {
        return false;
      }
      console.error('Error deleting activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // activityAddComment - NO locking (it's a create)
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

  // activityDeleteComment - WITH OPTIMISTIC LOCKING
  var activityDeleteComment = useCallback(async function(commentId) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the comment to get its updatedAt
      var comment = null;
      for (var i = 0; i < selectedEngagement.activities.length; i++) {
        var activity = selectedEngagement.activities[i];
        var found = activity.comments.find(function(c) { return c.id === commentId; });
        if (found) {
          comment = found;
          break;
        }
      }

      if (!comment) return false;

      await dataClient.models.Comment.delete({ id: commentId }, {
        condition: {
          updatedAt: { eq: comment.updatedAt }
        }
      });

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
      if (handleConflictError(error, 'comment')) {
        return false;
      }
      console.error('Error deleting comment:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // noteAdd - NO locking (it's a create)
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

  // noteEdit - WITH OPTIMISTIC LOCKING
  var noteEdit = useCallback(async function(noteId, phaseType, text) {
    if (!selectedEngagement || !noteId || !text) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the note to get its updatedAt
      var note = (selectedEngagement.phaseNotes || []).find(function(n) { return n.id === noteId; });
      if (!note) return false;

      await dataClient.models.PhaseNote.update({
        id: noteId,
        text: text
      }, {
        condition: {
          updatedAt: { eq: note.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        newNotesByPhase[phaseType] = phaseNotes.map(function(n) {
          if (n.id === noteId) {
            return Object.assign({}, n, { 
              text: text, 
              updatedAt: new Date().toISOString() 
            });
          }
          return n;
        });

        // Update flat phaseNotes array
        var newPhaseNotes = (eng.phaseNotes || []).map(function(n) {
          if (n.id === noteId) {
            return Object.assign({}, n, { 
              text: text, 
              updatedAt: new Date().toISOString() 
            });
          }
          return n;
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
      if (handleConflictError(error, 'note')) {
        return false;
      }
      console.error('Error editing note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // noteDelete - WITH OPTIMISTIC LOCKING
  var noteDelete = useCallback(async function(noteId, phaseType) {
    if (!selectedEngagement || !noteId) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the note to get its updatedAt
      var note = (selectedEngagement.phaseNotes || []).find(function(n) { return n.id === noteId; });
      if (!note) return false;

      await dataClient.models.PhaseNote.delete({ id: noteId }, {
        condition: {
          updatedAt: { eq: note.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        newNotesByPhase[phaseType] = phaseNotes.filter(function(n) {
          return n.id !== noteId;
        });

        // Update flat phaseNotes array
        var newPhaseNotes = (eng.phaseNotes || []).filter(function(n) {
          return n.id !== noteId;
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
      if (handleConflictError(error, 'note')) {
        return false;
      }
      console.error('Error deleting note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // Integrations operations - WITH OPTIMISTIC LOCKING
  var integrationsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates), {
        condition: {
          updatedAt: { eq: selectedEngagement.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, updates);

      if (logChangeAsync) {
        logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', 'Updated integrations');
      }
    } catch (error) {
      if (handleConflictError(error, 'engagement')) {
        return;
      }
      console.error('Error updating integrations:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, handleConflictError]);

  // Details operations - WITH OPTIMISTIC LOCKING
  var detailsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates), {
        condition: {
          updatedAt: { eq: selectedEngagement.updatedAt }
        }
      });

      updateEngagementInState(selectedEngagement.id, updates);
    } catch (error) {
      if (handleConflictError(error, 'engagement')) {
        return;
      }
      console.error('Error updating details:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client, handleConflictError]);

  // ownerAdd - NO locking (it's a create)
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

  // ownerRemove - WITH OPTIMISTIC LOCKING
  var ownerRemove = useCallback(async function(memberId) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the ownership record
      var ownershipRecord = (selectedEngagement.ownershipRecords || []).find(function(o) {
        return o.teamMemberId === memberId;
      });

      if (ownershipRecord) {
        await dataClient.models.EngagementOwner.delete({ id: ownershipRecord.id }, {
          condition: {
            updatedAt: { eq: ownershipRecord.updatedAt }
          }
        });
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
      if (handleConflictError(error, 'owner')) {
        return;
      }
      console.error('Error removing owner:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, getOwnerInfo, client, handleConflictError]);

  // Return namespaced object matching what App.jsx and DetailView.jsx expect
  return {
    view: {
      update: viewUpdate
    },
    status: {
      update: statusUpdate,
      updateReason: closedReasonUpdate
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
    },
    competitors: {
      update: competitorsUpdate
    }
  };
};

export default useEngagementDetail;
