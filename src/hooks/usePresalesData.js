import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { groupBy, parseLinks, safeJsonParse, isEngagementStale, getDaysSinceActivity } from '../utils';
import { SYSTEM_SE_TEAM } from '../constants';

/**
 * Enrich a single engagement with all related data
 * This function is extracted to be reusable for both initial fetch and targeted refresh
 * 
 * @param {Object} eng - Raw engagement object from database
 * @param {Object} relatedData - Object containing all related data
 * @param {Object} relatedData.phasesGrouped - Phases grouped by engagementId
 * @param {Object} relatedData.activitiesGrouped - Activities grouped by engagementId
 * @param {Object} relatedData.commentsGrouped - Comments grouped by activityId
 * @param {Object} relatedData.ownersGrouped - Ownership records grouped by engagementId
 * @param {Object} relatedData.changeLogsGrouped - Change logs grouped by engagementId
 * @param {Object} relatedData.phaseNotesGrouped - Phase notes grouped by engagementId
 * @param {Array} relatedData.viewsData - All engagement views
 * @param {Array} relatedData.salesRepsData - All sales reps
 * @param {Array} relatedData.systemUserIds - IDs of system users
 * @param {string} relatedData.currentUserId - Current user's ID
 * @returns {Object} Enriched engagement object
 */
function enrichSingleEngagement(eng, relatedData) {
  var phasesGrouped = relatedData.phasesGrouped;
  var activitiesGrouped = relatedData.activitiesGrouped;
  var commentsGrouped = relatedData.commentsGrouped;
  var ownersGrouped = relatedData.ownersGrouped;
  var changeLogsGrouped = relatedData.changeLogsGrouped;
  var phaseNotesGrouped = relatedData.phaseNotesGrouped;
  var viewsData = relatedData.viewsData;
  var salesRepsData = relatedData.salesRepsData;
  var systemUserIds = relatedData.systemUserIds;
  var currentUserId = relatedData.currentUserId;

  // Build phases object
  var phases = {};
  var engagementPhases = phasesGrouped[eng.id] || [];
  engagementPhases.forEach(function(phase) {
    phases[phase.phaseType] = Object.assign({}, phase, {
      links: parseLinks(phase.links)
    });
  });

  // Build activities with comments
  var engagementActivities = activitiesGrouped[eng.id] || [];
  var activitiesWithComments = engagementActivities.map(function(activity) {
    var activityComments = commentsGrouped[activity.id] || [];
    activityComments.sort(function(a, b) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    return Object.assign({}, activity, { comments: activityComments });
  });
  activitiesWithComments.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  // Get ownership records and owner IDs
  var ownershipRecords = ownersGrouped[eng.id] || [];
  var ownerIds = ownershipRecords.map(function(o) { return o.teamMemberId; });
  if (ownerIds.length === 0 && eng.ownerId) {
    ownerIds = [eng.ownerId];
  }

  // Get change logs
  var engagementChangeLogs = changeLogsGrouped[eng.id] || [];
  engagementChangeLogs.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Get phase notes
  var engagementPhaseNotes = phaseNotesGrouped[eng.id] || [];
  engagementPhaseNotes.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Group notes by phase
  var notesByPhase = {};
  engagementPhaseNotes.forEach(function(note) {
    if (!notesByPhase[note.phaseType]) {
      notesByPhase[note.phaseType] = [];
    }
    notesByPhase[note.phaseType].push(note);
  });

  // Calculate unread changes
  var viewRecord = viewsData.find(function(v) {
    return v.visitorId === currentUserId && v.engagementId === eng.id;
  });
  var lastViewedAt = viewRecord ? viewRecord.lastViewedAt : null;
  var unreadChanges = 0;
  if (lastViewedAt && currentUserId) {
    unreadChanges = engagementChangeLogs.filter(function(log) {
      return new Date(log.createdAt) > new Date(lastViewedAt) && log.userId !== currentUserId;
    }).length;
  }

  // Check if engagement has system owner
  var hasSystemOwner = ownerIds.some(function(id) {
    return systemUserIds.indexOf(id) !== -1;
  });

  // Get sales rep name
  var salesRepName = null;
  if (eng.salesRepId) {
    var salesRep = salesRepsData.find(function(rep) {
      return rep.id === eng.salesRepId;
    });
    if (salesRep) {
      salesRepName = salesRep.name;
    }
  }

  // Parse competitors from JSON string
  var competitors = safeJsonParse(eng.competitors, []);

  // Build the enriched engagement object
  var enrichedEngagement = Object.assign({}, eng, {
    phases: phases,
    activities: activitiesWithComments,
    ownerIds: ownerIds,
    ownershipRecords: ownershipRecords,
    changeLogs: engagementChangeLogs,
    phaseNotes: engagementPhaseNotes,
    notesByPhase: notesByPhase,
    totalNotesCount: engagementPhaseNotes.length,
    unreadChanges: unreadChanges,
    lastViewedAt: lastViewedAt,
    hasSystemOwner: hasSystemOwner,
    salesRepName: salesRepName,
    competitors: competitors
  });

  // Calculate derived fields
  enrichedEngagement.isStale = isEngagementStale(enrichedEngagement);
  enrichedEngagement.daysSinceActivity = getDaysSinceActivity(enrichedEngagement);

  return enrichedEngagement;
}

var usePresalesData = function() {
  var client = generateClient();
  
  var stateResult = useState([]);
  var engagements = stateResult[0];
  var setEngagements = stateResult[1];
  
  var teamMembersState = useState([]);
  var allTeamMembers = teamMembersState[0];
  var setAllTeamMembers = teamMembersState[1];
  
  var salesRepsState = useState([]);
  var salesReps = salesRepsState[0];
  var setSalesReps = salesRepsState[1];
  
  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];
  
  var currentUserState = useState(null);
  var currentUser = currentUserState[0];
  var setCurrentUser = currentUserState[1];

  /**
   * Get owner info by ID
   * Returns initials, name, and display info for a team member
   * Now handles inactive users and system users
   */
  var getOwnerInfo = useCallback(function(ownerId) {
    if (!ownerId) return { initials: '?', name: 'Unknown', isActive: true, isSystemUser: false };
    
    var member = allTeamMembers.find(function(m) { return m.id === ownerId; });
    if (member) {
      return {
        initials: member.initials || member.name?.substring(0, 2).toUpperCase() || '??',
        name: member.name || 'Unknown',
        isActive: member.isActive !== false,
        isSystemUser: member.isSystemUser === true,
        colorClass: member.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
      };
    }
    
    return { initials: '??', name: 'Unknown User', isActive: true, isSystemUser: false };
  }, [allTeamMembers]);

  /**
   * Fetch all data from the database
   * Loads engagements, phases, activities, comments, team members, ownership, change logs, views, phase notes, sales reps
   */
  var fetchAllData = useCallback(async function() {
    try {
      setLoading(true);
      
      var results = await Promise.all([
        client.models.TeamMember.list(),
        client.models.Engagement.list(),
        client.models.Phase.list(),
        client.models.Activity.list(),
        client.models.EngagementOwner.list(),
        client.models.Comment.list(),
        client.models.ChangeLog.list(),
        client.models.EngagementView.list(),
        client.models.PhaseNote.list(),
        client.models.SalesRep.list()
      ]);
      
      var teamData = results[0].data || [];
      var engagementData = results[1].data || [];
      var phaseData = results[2].data || [];
      var activityData = results[3].data || [];
      var ownerData = results[4].data || [];
      var commentData = results[5].data || [];
      var changeLogData = results[6].data || [];
      var viewsData = results[7].data || [];
      var phaseNotesData = results[8].data || [];
      var salesRepsData = results[9].data || [];
      
      // Sort sales reps alphabetically
      salesRepsData.sort(function(a, b) {
        return (a.name || '').localeCompare(b.name || '');
      });
      
      // Store team members with active status and system user flag
      var processedTeamMembers = teamData.map(function(member) {
        return Object.assign({}, member, {
          isActive: member.isActive !== false,
          isSystemUser: member.isSystemUser === true
        });
      });
      
      // Sort team members: active first, then by name, system users at end
      processedTeamMembers.sort(function(a, b) {
        // System users go last
        if (a.isSystemUser && !b.isSystemUser) return 1;
        if (!a.isSystemUser && b.isSystemUser) return -1;
        // Then sort by active status
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // Then alphabetically
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setAllTeamMembers(processedTeamMembers);
      setSalesReps(salesRepsData);
      
      // Get system user IDs for hasSystemOwner calculation
      var systemUserIds = processedTeamMembers
        .filter(function(m) { return m.isSystemUser === true; })
        .map(function(m) { return m.id; });
      
      // Get current user ID
      var currentUserId = currentUser ? currentUser.id : null;
      
      // Group related data by engagement/activity ID for efficient lookup
      var phasesGrouped = groupBy(phaseData, 'engagementId');
      var activitiesGrouped = groupBy(activityData, 'engagementId');
      var commentsGrouped = groupBy(commentData, 'activityId');
      var ownersGrouped = groupBy(ownerData, 'engagementId');
      var changeLogsGrouped = groupBy(changeLogData, 'engagementId');
      var phaseNotesGrouped = groupBy(phaseNotesData, 'engagementId');
      
      // Build related data object for enrichment function
      var relatedData = {
        phasesGrouped: phasesGrouped,
        activitiesGrouped: activitiesGrouped,
        commentsGrouped: commentsGrouped,
        ownersGrouped: ownersGrouped,
        changeLogsGrouped: changeLogsGrouped,
        phaseNotesGrouped: phaseNotesGrouped,
        viewsData: viewsData,
        salesRepsData: salesRepsData,
        systemUserIds: systemUserIds,
        currentUserId: currentUserId
      };
      
      // Enrich each engagement using the extracted function
      var enrichedEngagements = engagementData.map(function(eng) {
        return enrichSingleEngagement(eng, relatedData);
      });
      
      setEngagements(enrichedEngagements);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, [client, currentUser]);

  /**
   * Log a change to the ChangeLog table (fire-and-forget)
   * @param {string} engagementId - ID of the engagement
   * @param {string} changeType - Type of change (e.g., 'PHASE_UPDATE', 'ACTIVITY_ADDED')
   * @param {string} description - Human-readable description
   * @param {string} previousValue - Previous value (optional)
   * @param {string} newValue - New value (optional)
   */
  var logChangeAsync = useCallback(function(engagementId, changeType, description, previousValue, newValue) {
    if (!currentUser) return;
    
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue || null,
      newValue: newValue || null
    }).catch(function(e) { console.error('Error logging change:', e); });
  }, [client, currentUser]);

  /**
   * Update a single engagement in state
   * @param {string} engagementId - ID of the engagement to update
   * @param {Object|Function} updates - Object with updates or function that receives current engagement and returns updates
   */
  var updateEngagementInState = useCallback(function(engagementId, updates) {
    setEngagements(function(prev) {
      return prev.map(function(eng) {
        if (eng.id !== engagementId) return eng;
        
        if (typeof updates === 'function') {
          return Object.assign({}, eng, updates(eng));
        }
        return Object.assign({}, eng, updates);
      });
    });
  }, []);

  /**
   * Check for conflicts before updating a record (optimistic locking)
   * @param {string} modelName - Name of the model (e.g., 'Engagement', 'Phase')
   * @param {string} recordId - ID of the record
   * @param {string} expectedUpdatedAt - Expected updatedAt timestamp
   * @returns {Object} { conflict: boolean, fresh: Object|null, wasDeleted: boolean }
   */
  var checkForConflict = useCallback(async function(modelName, recordId, expectedUpdatedAt) {
    try {
      var model = client.models[modelName];
      if (!model) {
        console.error('Unknown model:', modelName);
        return { conflict: false, fresh: null, wasDeleted: false };
      }
      
      var result = await model.get({ id: recordId });
      
      if (!result.data) {
        return { conflict: true, fresh: null, wasDeleted: true };
      }
      
      var freshRecord = result.data;
      var isConflict = freshRecord.updatedAt !== expectedUpdatedAt;
      
      return {
        conflict: isConflict,
        fresh: freshRecord,
        wasDeleted: false
      };
    } catch (error) {
      console.error('Error checking for conflict:', error);
      return { conflict: false, fresh: null, wasDeleted: false };
    }
  }, [client]);

  return {
    engagements: engagements,
    setEngagements: setEngagements,
    allTeamMembers: allTeamMembers,
    setAllTeamMembers: setAllTeamMembers,
    salesReps: salesReps,
    setSalesReps: setSalesReps,
    loading: loading,
    currentUser: currentUser,
    setCurrentUser: setCurrentUser,
    fetchAllData: fetchAllData,
    getOwnerInfo: getOwnerInfo,
    logChangeAsync: logChangeAsync,
    updateEngagementInState: updateEngagementInState,
    checkForConflict: checkForConflict,
    client: client
  };
};

export default usePresalesData;
