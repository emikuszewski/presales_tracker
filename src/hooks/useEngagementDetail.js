import { useCallback } from 'react';
import { isClosedStatus, recalculateIsStale, recalculateDaysSinceActivity } from '../utils';
import { engagementStatusLabels, competitorLabels } from '../constants';

var useEngagementDetail = function(params) {
  var selectedEngagement = params.selectedEngagement;
  var updateEngagementInState = params.updateEngagementInState;
  var currentUser = params.currentUser;
  var engagementViews = params.engagementViews;
  var setEngagementViews = params.setEngagementViews;
  var logChangeAsync = params.logChangeAsync;
  var getOwnerInfo = params.getOwnerInfo;
  var client = params.client;
  var onConflict = params.onConflict; // Callback for conflict handling
  var refreshSingleEngagement = params.refreshSingleEngagement; // For targeted refresh after mutations

  /**
   * Helper to check for conflicts before update/delete operations.
   * Fetches fresh record from DB and compares updatedAt timestamp.
   * @param {string} modelName - The model name (e.g., 'Engagement', 'Activity')
   * @param {string} id - The record ID
   * @param {string} localUpdatedAt - The updatedAt from local state
   * @returns {Promise<{conflict: boolean, fresh: object|null, wasDeleted: boolean}>}
   */
  var checkForConflict = async function(modelName, id, localUpdatedAt) {
    var dataClient = typeof client === 'function' ? client() : client;
    var result = await dataClient.models[modelName].get({ id: id });
    
    if (result.errors) {
      throw new Error('Failed to check for conflicts: ' + JSON.stringify(result.errors));
    }
    
    // Record was deleted by another user
    if (!result.data) {
      return { conflict: true, fresh: null, wasDeleted: true };
    }
    
    // Record was modified by another user
    if (result.data.updatedAt !== localUpdatedAt) {
      return { conflict: true, fresh: result.data, wasDeleted: false };
    }
    
    // No conflict - safe to proceed
    return { conflict: false, fresh: result.data, wasDeleted: false };
  };

  /**
   * Helper to add a change log to the engagement's changeLogs array
   * @param {string} engagementId - The engagement ID
   * @param {Object} changeLog - The created change log record
   */
  var addChangeLogToState = function(engagementId, changeLog) {
    if (!changeLog) return;
    updateEngagementInState(engagementId, function(eng) {
      return Object.assign({}, eng, {
        changeLogs: [changeLog].concat(eng.changeLogs || [])
      });
    });
  };

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
  // GROUP B: Updated to add changeLog to state immediately
  var statusUpdate = useCallback(async function(newStatus, closedReason) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var oldStatus = selectedEngagement.engagementStatus || 'ACTIVE';
      
      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return false;
      }
      
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

      var result = await dataClient.models.Engagement.update(updateData);

      // Update local state with new updatedAt from server
      var stateUpdate = {
        engagementStatus: newStatus,
        updatedAt: result.data.updatedAt
      };
      
      if (isClosedStatus(newStatus)) {
        stateUpdate.isArchived = true;
        stateUpdate.isStale = false; // Closed engagements are never stale
      }
      
      if (closedReason !== undefined) {
        stateUpdate.closedReason = closedReason || null;
      }

      updateEngagementInState(selectedEngagement.id, stateUpdate);

      // Log the change and update state immediately
      if (logChangeAsync) {
        var oldLabel = engagementStatusLabels[oldStatus] || oldStatus;
        var newLabel = engagementStatusLabels[newStatus] || newStatus;
        var description = 'Changed status from ' + oldLabel + ' to ' + newLabel;
        if (closedReason) {
          description += ': "' + (closedReason.length > 50 ? closedReason.substring(0, 50) + '...' : closedReason) + '"';
        }
        var changeLog = await logChangeAsync(selectedEngagement.id, 'STATUS_CHANGED', description, oldStatus, newStatus);
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Update closed reason only - WITH OPTIMISTIC LOCKING
  var closedReasonUpdate = useCallback(async function(closedReason) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return false;
      }

      var result = await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        closedReason: closedReason || null
      });

      updateEngagementInState(selectedEngagement.id, {
        closedReason: closedReason || null,
        updatedAt: result.data.updatedAt
      });

      return true;
    } catch (error) {
      console.error('Error updating closed reason:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, client, onConflict]);

  // Competitors update operation - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var competitorsUpdate = useCallback(async function(competitorData) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return false;
      }
      
      var oldCompetitors = selectedEngagement.competitors || [];
      var newCompetitors = competitorData.competitors || [];
      
      // Store competitors as JSON string in DB
      var competitorsJson = newCompetitors.length > 0 ? JSON.stringify(newCompetitors) : null;

      var result = await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        competitors: competitorsJson,
        competitorNotes: competitorData.competitorNotes || null,
        otherCompetitorName: competitorData.otherCompetitorName || null
      });

      // Update local state with new updatedAt
      updateEngagementInState(selectedEngagement.id, {
        competitors: newCompetitors,
        competitorNotes: competitorData.competitorNotes || null,
        otherCompetitorName: competitorData.otherCompetitorName || null,
        updatedAt: result.data.updatedAt
      });

      // Build change log description and update state immediately
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
          var changeLog = await logChangeAsync(selectedEngagement.id, 'COMPETITORS_UPDATED', description);
          addChangeLogToState(selectedEngagement.id, changeLog);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating competitors:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Sales Rep update operation - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var salesRepUpdate = useCallback(async function(salesRepId, salesRepName) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return false;
      }
      
      var oldRepId = selectedEngagement.salesRepId;
      var oldRepName = selectedEngagement.salesRepName;

      var result = await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        salesRepId: salesRepId || null
      });

      // Update local state with new updatedAt
      updateEngagementInState(selectedEngagement.id, {
        salesRepId: salesRepId || null,
        salesRepName: salesRepName || null,
        updatedAt: result.data.updatedAt
      });

      // Build change log description and update state immediately
      if (logChangeAsync) {
        var description;
        if (!oldRepId && salesRepId) {
          description = 'Assigned ' + salesRepName;
        } else if (oldRepId && !salesRepId) {
          description = 'Removed ' + (oldRepName || 'sales rep');
        } else if (oldRepId && salesRepId) {
          description = 'Changed from ' + (oldRepName || 'unknown') + ' to ' + salesRepName;
        }
        
        if (description) {
          var changeLog = await logChangeAsync(selectedEngagement.id, 'SALES_REP_CHANGED', description, oldRepName || null, salesRepName || null);
          addChangeLogToState(selectedEngagement.id, changeLog);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating sales rep:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Partner update operation - WITH OPTIMISTIC LOCKING
  var partnerUpdate = useCallback(async function(partnerName) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return false;
      }
      
      var oldPartnerName = selectedEngagement.partnerName;
      var newPartnerName = partnerName && partnerName.trim() ? partnerName.trim() : null;

      var result = await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        partnerName: newPartnerName
      });

      // Update local state with new updatedAt
      updateEngagementInState(selectedEngagement.id, {
        partnerName: newPartnerName,
        updatedAt: result.data.updatedAt
      });

      // Build change log description and update state immediately
      if (logChangeAsync) {
        var description;
        if (!oldPartnerName && newPartnerName) {
          description = 'Added partner: ' + newPartnerName;
        } else if (oldPartnerName && !newPartnerName) {
          description = 'Removed partner: ' + oldPartnerName;
        } else if (oldPartnerName && newPartnerName && oldPartnerName !== newPartnerName) {
          description = 'Changed partner from ' + oldPartnerName + ' to ' + newPartnerName;
        }
        
        if (description) {
          var changeLog = await logChangeAsync(selectedEngagement.id, 'PARTNER_UPDATED', description, oldPartnerName || null, newPartnerName || null);
          addChangeLogToState(selectedEngagement.id, changeLog);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating partner:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Phase operations - WITH OPTIMISTIC LOCKING
  // GROUP B: Updated to add changeLog to state immediately
  var phaseSave = useCallback(async function(phaseType, phaseData) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) {
        console.error('Phase record not found for', phaseType);
        return;
      }

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Phase', phaseRecord.id, phaseRecord.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'phase' });
        }
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

      var result = await dataClient.models.Phase.update({
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
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], updateData, { updatedAt: result.data.updatedAt });
        
        var updates = { phases: newPhases };
        if (shouldUpdateCurrentPhase) {
          updates.currentPhase = phaseType;
        }
        
        return Object.assign({}, eng, updates);
      });

      if (logChangeAsync) {
        var changeLog = await logChangeAsync(selectedEngagement.id, 'PHASE_UPDATE', 'Updated ' + phaseType + ' phase to ' + phaseData.status);
        addChangeLogToState(selectedEngagement.id, changeLog);
      }
    } catch (error) {
      console.error('Error saving phase:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // GROUP A: Updated to add changeLog to state immediately
  var phaseAddLink = useCallback(async function(phaseType, linkData) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) {
        console.error('Phase record not found for', phaseType);
        return;
      }

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Phase', phaseRecord.id, phaseRecord.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'phase' });
        }
        return;
      }

      var currentLinks = phaseRecord.links || [];
      var updatedLinks = currentLinks.concat([linkData]);

      var result = await dataClient.models.Phase.update({
        id: phaseRecord.id,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], { links: updatedLinks, updatedAt: result.data.updatedAt });
        return Object.assign({}, eng, { phases: newPhases });
      });

      if (logChangeAsync) {
        var changeLog = await logChangeAsync(selectedEngagement.id, 'LINK_ADDED', 'Added link "' + linkData.title + '" to ' + phaseType);
        addChangeLogToState(selectedEngagement.id, changeLog);
      }
    } catch (error) {
      console.error('Error adding link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // phaseRemoveLink - no change logging, so not in Group A
  var phaseRemoveLink = useCallback(async function(phaseType, linkIndex) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var phaseRecord = selectedEngagement.phases[phaseType];
      
      if (!phaseRecord || !phaseRecord.id) return;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Phase', phaseRecord.id, phaseRecord.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'phase' });
        }
        return;
      }

      var currentLinks = phaseRecord.links || [];
      var updatedLinks = currentLinks.filter(function(_, i) { return i !== linkIndex; });

      var result = await dataClient.models.Phase.update({
        id: phaseRecord.id,
        links: JSON.stringify(updatedLinks)
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newPhases = Object.assign({}, eng.phases);
        newPhases[phaseType] = Object.assign({}, eng.phases[phaseType], { links: updatedLinks, updatedAt: result.data.updatedAt });
        return Object.assign({}, eng, { phases: newPhases });
      });
    } catch (error) {
      console.error('Error removing link:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client, onConflict]);

  // Activity operations - activityAdd does NOT need locking (it's a create)
  // GROUP B: Updated to add changeLog to state immediately + recalculate derived fields
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

      // Build the updated engagement to recalculate derived fields
      var updatedEngagement = Object.assign({}, selectedEngagement, {
        lastActivity: activityData.date,
        activities: [newActivity].concat(selectedEngagement.activities)
      });

      // Recalculate derived fields
      var newIsStale = recalculateIsStale(updatedEngagement);
      var newDaysSinceActivity = recalculateDaysSinceActivity(activityData.date);

      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          lastActivity: activityData.date,
          activities: [newActivity].concat(eng.activities),
          isStale: newIsStale,
          daysSinceActivity: newDaysSinceActivity
        });
      });

      if (logChangeAsync) {
        var desc = activityData.description;
        var truncated = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
        var changeLog = await logChangeAsync(selectedEngagement.id, 'ACTIVITY_ADDED', 'Added ' + activityData.type + ': ' + truncated);
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error adding activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client]);

  // activityEdit - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var activityEdit = useCallback(async function(activityId, updates) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the activity to get its updatedAt
      var activity = selectedEngagement.activities.find(function(a) { return a.id === activityId; });
      if (!activity) return false;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Activity', activityId, activity.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'activity' });
        }
        return false;
      }

      // Update activity in DB
      var result = await dataClient.models.Activity.update({
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

      // Update engagement.lastActivity if changed (secondary update - no conflict check)
      if (newLastActivity !== selectedEngagement.lastActivity) {
        await dataClient.models.Engagement.update({
          id: selectedEngagement.id,
          lastActivity: newLastActivity
        });
      }

      // Update local state with new updatedAt
      updateEngagementInState(selectedEngagement.id, function(eng) {
        var newActivities = eng.activities.map(function(a) {
          if (a.id === activityId) {
            return Object.assign({}, a, updates, { updatedAt: result.data.updatedAt });
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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'ACTIVITY_EDITED', 'Edited activity: "' + truncated + '"');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error editing activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // activityDelete - WITH OPTIMISTIC LOCKING
  // GROUP C: Updated to add changeLog to state immediately + recalculate all derived fields
  var activityDelete = useCallback(async function(activityId) {
    if (!selectedEngagement) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the activity to get its info for logging and updatedAt
      var activity = selectedEngagement.activities.find(function(a) { return a.id === activityId; });
      if (!activity) return false;

      // Check for conflicts before deleting
      var conflictCheck = await checkForConflict('Activity', activityId, activity.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'activity' });
        }
        return false;
      }

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

      // Update engagement.lastActivity in DB (secondary update - no conflict check)
      await dataClient.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: newLastActivity
      });

      // Build the updated engagement to recalculate derived fields
      var updatedEngagement = Object.assign({}, selectedEngagement, {
        lastActivity: newLastActivity,
        activities: remainingActivities
      });

      // Recalculate derived fields
      var newIsStale = recalculateIsStale(updatedEngagement);
      var newDaysSinceActivity = recalculateDaysSinceActivity(newLastActivity);

      // Update local state with all derived fields
      updateEngagementInState(selectedEngagement.id, function(eng) {
        return Object.assign({}, eng, {
          activities: eng.activities.filter(function(a) { return a.id !== activityId; }),
          lastActivity: newLastActivity,
          isStale: newIsStale,
          daysSinceActivity: newDaysSinceActivity
        });
      });

      if (logChangeAsync) {
        var changeLog = await logChangeAsync(
          selectedEngagement.id, 
          'ACTIVITY_DELETED', 
          'Deleted ' + activity.type + ' activity from ' + activity.date
        );
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // activityAddComment - NO locking (it's a create)
  // GROUP A: Updated to add changeLog to state immediately
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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'COMMENT_ADDED', 'Commented: "' + truncated + '"');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }, [selectedEngagement, currentUser, updateEngagementInState, logChangeAsync, client]);

  // activityDeleteComment - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
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

      // Check for conflicts before deleting
      var conflictCheck = await checkForConflict('Comment', commentId, comment.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'comment' });
        }
        return false;
      }

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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'COMMENT_DELETED', 'Deleted a comment');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // noteAdd - NO locking (it's a create)
  // GROUP A: Updated to add changeLog to state immediately
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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'NOTE_ADDED', 'Added note to ' + phaseType + ': "' + truncated + '"');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    }
  }, [selectedEngagement, currentUser, updateEngagementInState, logChangeAsync, client]);

  // noteEdit - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var noteEdit = useCallback(async function(noteId, phaseType, text) {
    if (!selectedEngagement || !noteId || !text) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the note to get its updatedAt
      var note = (selectedEngagement.phaseNotes || []).find(function(n) { return n.id === noteId; });
      if (!note) return false;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('PhaseNote', noteId, note.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'note' });
        }
        return false;
      }

      var result = await dataClient.models.PhaseNote.update({
        id: noteId,
        text: text
      });

      updateEngagementInState(selectedEngagement.id, function(eng) {
        // Update notesByPhase
        var newNotesByPhase = Object.assign({}, eng.notesByPhase);
        var phaseNotes = newNotesByPhase[phaseType] || [];
        newNotesByPhase[phaseType] = phaseNotes.map(function(n) {
          if (n.id === noteId) {
            return Object.assign({}, n, { 
              text: text, 
              updatedAt: result.data.updatedAt 
            });
          }
          return n;
        });

        // Update flat phaseNotes array
        var newPhaseNotes = (eng.phaseNotes || []).map(function(n) {
          if (n.id === noteId) {
            return Object.assign({}, n, { 
              text: text, 
              updatedAt: result.data.updatedAt 
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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'NOTE_EDITED', 'Edited note in ' + phaseType + ': "' + truncated + '"');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error editing note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // noteDelete - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var noteDelete = useCallback(async function(noteId, phaseType) {
    if (!selectedEngagement || !noteId) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the note to get its updatedAt
      var note = (selectedEngagement.phaseNotes || []).find(function(n) { return n.id === noteId; });
      if (!note) return false;

      // Check for conflicts before deleting
      var conflictCheck = await checkForConflict('PhaseNote', noteId, note.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'note' });
        }
        return false;
      }

      await dataClient.models.PhaseNote.delete({ id: noteId });

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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'NOTE_DELETED', 'Deleted note from ' + phaseType);
        addChangeLogToState(selectedEngagement.id, changeLog);
      }

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Integrations operations - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var integrationsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return;
      }

      var result = await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates));

      updateEngagementInState(selectedEngagement.id, Object.assign({}, updates, { updatedAt: result.data.updatedAt }));

      if (logChangeAsync) {
        var changeLog = await logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', 'Updated integrations');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }
    } catch (error) {
      console.error('Error updating integrations:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, client, onConflict]);

  // Details operations - WITH OPTIMISTIC LOCKING
  var detailsUpdate = useCallback(async function(updates) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Check for conflicts before updating
      var conflictCheck = await checkForConflict('Engagement', selectedEngagement.id, selectedEngagement.updatedAt);
      if (conflictCheck.conflict) {
        if (onConflict) {
          onConflict({ recordType: 'engagement' });
        }
        return;
      }

      var result = await dataClient.models.Engagement.update(Object.assign({ id: selectedEngagement.id }, updates));

      updateEngagementInState(selectedEngagement.id, Object.assign({}, updates, { updatedAt: result.data.updatedAt }));
    } catch (error) {
      console.error('Error updating details:', error);
    }
  }, [selectedEngagement, updateEngagementInState, client, onConflict]);

  // ownerAdd - NO locking (it's a create)
  // GROUP A: Updated to add changeLog to state immediately
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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'OWNER_ADDED', 'Added ' + member.name + ' as owner');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, getOwnerInfo, client]);

  // ownerRemove - WITH OPTIMISTIC LOCKING
  // GROUP A: Updated to add changeLog to state immediately
  var ownerRemove = useCallback(async function(memberId) {
    if (!selectedEngagement) return;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find the ownership record
      var ownershipRecord = (selectedEngagement.ownershipRecords || []).find(function(o) {
        return o.teamMemberId === memberId;
      });

      if (ownershipRecord) {
        // Check for conflicts before deleting
        var conflictCheck = await checkForConflict('EngagementOwner', ownershipRecord.id, ownershipRecord.updatedAt);
        if (conflictCheck.conflict) {
          if (onConflict) {
            onConflict({ recordType: 'owner' });
          }
          return;
        }

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
        var changeLog = await logChangeAsync(selectedEngagement.id, 'OWNER_REMOVED', 'Removed ' + member.name + ' as owner');
        addChangeLogToState(selectedEngagement.id, changeLog);
      }
    } catch (error) {
      console.error('Error removing owner:', error);
    }
  }, [selectedEngagement, updateEngagementInState, logChangeAsync, getOwnerInfo, client, onConflict]);

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
    },
    salesRep: {
      update: salesRepUpdate
    },
    partner: {
      update: partnerUpdate
    }
  };
};

export default useEngagementDetail;
