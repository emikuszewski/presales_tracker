import { useState, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import {
  groupBy,
  parseLinks,
  isEngagementStale,
  getDaysSinceActivity,
  safeJsonParse
} from '../utils';
import { phaseConfig, SYSTEM_SE_TEAM } from '../constants';

/**
 * Enrich a single engagement with all related data
 * Extracted for reuse in targeted refresh and new engagement creation
 * 
 * @param {Object} eng - Raw engagement from database
 * @param {Object} context - All the contextual data needed for enrichment
 * @returns {Object} Enriched engagement
 */
function enrichSingleEngagement(eng, context) {
  const phasesByEngagement = context.phasesByEngagement;
  const activitiesByEngagement = context.activitiesByEngagement;
  const ownershipByEngagement = context.ownershipByEngagement;
  const commentsByActivity = context.commentsByActivity;
  const changeLogsByEngagement = context.changeLogsByEngagement;
  const phaseNotesByEngagement = context.phaseNotesByEngagement;
  const viewsMap = context.viewsMap;
  const salesRepsMap = context.salesRepsMap;
  const systemUserIds = context.systemUserIds;
  const userId = context.userId;

  const phases = phasesByEngagement[eng.id] || [];
  const activities = activitiesByEngagement[eng.id] || [];
  const ownershipRecords = ownershipByEngagement[eng.id] || [];
  const changeLogs = (changeLogsByEngagement[eng.id] || [])
    .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  const phaseNotes = (phaseNotesByEngagement[eng.id] || [])
    .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  const activitiesWithComments = activities
    .map(function(activity) {
      return Object.assign({}, activity, {
        comments: (commentsByActivity[activity.id] || [])
          .sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); })
      });
    })
    .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  const phasesObj = {};
  phaseConfig.forEach(function(p) {
    const existingPhase = phases.find(function(ph) { return ph.phaseType === p.id; });
    if (existingPhase) {
      const parsedLinks = parseLinks(existingPhase.links);
      phasesObj[p.id] = Object.assign({}, existingPhase, { links: parsedLinks });
    } else {
      phasesObj[p.id] = {
        phaseType: p.id,
        status: 'PENDING',
        completedDate: null,
        notes: '',
        links: []
      };
    }
  });

  const ownerIds = ownershipRecords.map(function(o) { return o.teamMemberId; });
  if (ownerIds.length === 0 && eng.ownerId) {
    ownerIds.push(eng.ownerId);
  }

  const userView = viewsMap[eng.id];
  let unreadChanges = 0;
  if (userView && userId) {
    const lastViewed = new Date(userView.lastViewedAt);
    unreadChanges = changeLogs.filter(function(log) {
      return new Date(log.createdAt) > lastViewed && log.userId !== userId;
    }).length;
  } else if (changeLogs.length > 0 && userId) {
    unreadChanges = changeLogs.filter(function(log) { return log.userId !== userId; }).length;
  }

  const hasSystemOwner = ownerIds.some(function(id) { return systemUserIds.indexOf(id) !== -1; });

  const notesByPhase = {};
  phaseConfig.forEach(function(p) {
    notesByPhase[p.id] = phaseNotes.filter(function(n) { return n.phaseType === p.id; });
  });

  const totalNotesCount = phaseNotes.length;

  // Default engagementStatus to 'ACTIVE' if not set (backwards compatibility)
  const engagementStatus = eng.engagementStatus || 'ACTIVE';

  // Parse competitors from JSON string
  const competitors = safeJsonParse(eng.competitors, []);

  // Get sales rep name if assigned
  let salesRepName = null;
  if (eng.salesRepId && salesRepsMap[eng.salesRepId]) {
    salesRepName = salesRepsMap[eng.salesRepId].name;
  }

  // Build enriched engagement with new status and competitor fields
  const enrichedEng = Object.assign({}, eng, {
    phases: phasesObj,
    activities: activitiesWithComments,
    ownerIds: ownerIds,
    ownershipRecords: ownershipRecords,
    changeLogs: changeLogs,
    phaseNotes: phaseNotes,
    notesByPhase: notesByPhase,
    totalNotesCount: totalNotesCount,
    unreadChanges: unreadChanges,
    daysSinceActivity: getDaysSinceActivity(eng),
    hasSystemOwner: hasSystemOwner,
    engagementStatus: engagementStatus,
    closedReason: eng.closedReason || null,
    // Competitor fields
    competitors: competitors,
    competitorNotes: eng.competitorNotes || null,
    otherCompetitorName: eng.otherCompetitorName || null,
    // Sales rep field
    salesRepName: salesRepName
  });

  // Calculate isStale using the enriched engagement (which includes engagementStatus)
  enrichedEng.isStale = isEngagementStale(enrichedEng);

  return enrichedEng;
}

const usePresalesData = (selectedEngagementId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [engagementViews, setEngagementViews] = useState({});
  const [loading, setLoading] = useState(true);

  const selectedEngagement = useMemo(function() {
    if (!selectedEngagementId) return null;
    return engagements.find(function(e) { return e.id === selectedEngagementId; }) || null;
  }, [engagements, selectedEngagementId]);

  const updateEngagementInState = useCallback(function(engagementId, updater) {
    setEngagements(function(prev) {
      return prev.map(function(e) {
        if (e.id === engagementId) {
          return typeof updater === 'function' ? updater(e) : Object.assign({}, e, updater);
        }
        return e;
      });
    });
  }, []);

  const getOwnerInfo = useCallback(function(ownerId) {
    const member = allTeamMembers.find(function(m) { return m.id === ownerId; });
    return member || { name: 'Unknown', initials: '?' };
  }, [allTeamMembers]);

  /**
   * Log a change to the ChangeLog table
   * Returns the created log record, or null on failure
   * 
   * @param {string} engagementId - ID of the engagement
   * @param {string} changeType - Type of change (e.g., 'PHASE_UPDATE', 'ACTIVITY_ADDED')
   * @param {string} description - Human-readable description
   * @param {string} previousValue - Previous value (optional)
   * @param {string} newValue - New value (optional)
   * @returns {Promise<Object|null>} Created log record or null
   */
  const logChangeAsync = useCallback(async function(engagementId, changeType, description, previousValue, newValue) {
    if (!currentUser) return null;
    
    try {
      const client = generateClient();
      const result = await client.models.ChangeLog.create({
        engagementId: engagementId,
        userId: currentUser.id,
        changeType: changeType,
        description: description,
        previousValue: previousValue || null,
        newValue: newValue || null
      });
      return result.data || null;
    } catch (e) {
      console.error('Error logging change:', e);
      return null;
    }
  }, [currentUser]);

  const ensureSystemUser = useCallback(async function(existingMembers) {
    const seTeamExists = existingMembers.some(function(m) {
      return m.email === SYSTEM_SE_TEAM.EMAIL || m.isSystemUser === true;
    });

    if (seTeamExists) {
      return existingMembers;
    }

    try {
      const client = generateClient();
      const result = await client.models.TeamMember.create({
        email: SYSTEM_SE_TEAM.EMAIL,
        name: SYSTEM_SE_TEAM.NAME,
        initials: SYSTEM_SE_TEAM.INITIALS,
        isAdmin: false,
        isActive: true,
        isSystemUser: true
      });

      return existingMembers.concat([result.data]);
    } catch (error) {
      if (error.message && error.message.indexOf('unique') !== -1) {
        const client2 = generateClient();
        const refreshed = await client2.models.TeamMember.list();
        return refreshed.data;
      }
      console.error('Error creating SE Team system user:', error);
      return existingMembers;
    }
  }, []);

  /**
   * Refresh a single engagement from the database
   * Fetches engagement + related data (phases, activities, owners, changeLogs, phaseNotes, view)
   * Skips comments - preserves existing comments from current state
   * Uses enrichSingleEngagement for consistent enrichment
   * Merges into state only if data has changed
   * 
   * @param {string} engagementId - ID of the engagement to refresh
   * @returns {Promise<void>}
   */
  const refreshSingleEngagement = useCallback(async function(engagementId) {
    if (!engagementId) return;
    
    try {
      const client = generateClient();
      const userId = currentUser ? currentUser.id : null;
      
      // Fetch engagement and related data in parallel
      // Note: We skip comments - they will be preserved from current state
      const results = await Promise.all([
        client.models.Engagement.get({ id: engagementId }),
        client.models.Phase.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.Activity.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.EngagementOwner.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.ChangeLog.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.PhaseNote.list({ filter: { engagementId: { eq: engagementId } } }),
        userId 
          ? client.models.EngagementView.list({ filter: { engagementId: { eq: engagementId }, visitorId: { eq: userId } } }).catch(function() { return { data: [] }; })
          : Promise.resolve({ data: [] })
      ]);
      
      const engagementResult = results[0];
      const phasesData = results[1].data || [];
      const activitiesData = results[2].data || [];
      const ownersData = results[3].data || [];
      const changeLogsData = results[4].data || [];
      const phaseNotesData = results[5].data || [];
      const viewsData = results[6].data || [];
      
      // If engagement not found (deleted), remove from state
      if (!engagementResult.data) {
        setEngagements(function(prev) {
          return prev.filter(function(e) { return e.id !== engagementId; });
        });
        return;
      }
      
      const freshEngagement = engagementResult.data;
      
      // Get existing engagement from state to preserve comments
      let existingEngagement = null;
      setEngagements(function(prev) {
        existingEngagement = prev.find(function(e) { return e.id === engagementId; });
        return prev; // No change yet, just reading
      });
      
      // Build comments lookup from existing state (we don't refetch comments)
      const commentsByActivity = {};
      if (existingEngagement && existingEngagement.activities) {
        existingEngagement.activities.forEach(function(activity) {
          if (activity.comments) {
            commentsByActivity[activity.id] = activity.comments;
          }
        });
      }
      
      // Build salesRepsMap from current salesReps state
      const salesRepsMap = {};
      salesReps.forEach(function(rep) {
        salesRepsMap[rep.id] = rep;
      });
      
      // Get systemUserIds from allTeamMembers
      const systemUserIds = allTeamMembers
        .filter(function(m) { return m.isSystemUser === true; })
        .map(function(m) { return m.id; });
      
      // Build viewsMap
      const viewsMap = {};
      viewsData.forEach(function(v) {
        viewsMap[v.engagementId] = v;
      });
      
      // Build enrichment context
      const enrichmentContext = {
        phasesByEngagement: { [engagementId]: phasesData },
        activitiesByEngagement: { [engagementId]: activitiesData },
        ownershipByEngagement: { [engagementId]: ownersData },
        commentsByActivity: commentsByActivity,
        changeLogsByEngagement: { [engagementId]: changeLogsData },
        phaseNotesByEngagement: { [engagementId]: phaseNotesData },
        viewsMap: viewsMap,
        salesRepsMap: salesRepsMap,
        systemUserIds: systemUserIds,
        userId: userId
      };
      
      // Enrich the engagement
      const enrichedEngagement = enrichSingleEngagement(freshEngagement, enrichmentContext);
      
      // Merge into state
      setEngagements(function(prev) {
        let found = false;
        const updated = prev.map(function(e) {
          if (e.id === engagementId) {
            found = true;
            // Shallow comparison - only update if something changed
            // Compare updatedAt as a quick check
            if (e.updatedAt === enrichedEngagement.updatedAt && 
                e.changeLogs.length === enrichedEngagement.changeLogs.length &&
                e.activities.length === enrichedEngagement.activities.length) {
              return e; // No change
            }
            return enrichedEngagement;
          }
          return e;
        });
        
        // If not found, add it (shouldn't happen in normal flow)
        if (!found) {
          updated.push(enrichedEngagement);
        }
        
        return updated;
      });
      
    } catch (error) {
      console.error('Error refreshing single engagement:', error);
    }
  }, [currentUser, allTeamMembers, salesReps]);

  const fetchAllData = useCallback(async function(userId) {
    try {
      const client = generateClient();
      
      const results = await Promise.all([
        client.models.TeamMember.list(),
        client.models.Engagement.list(),
        client.models.Phase.list(),
        client.models.Activity.list(),
        client.models.EngagementOwner.list(),
        client.models.Comment.list(),
        client.models.ChangeLog.list(),
        userId 
          ? client.models.EngagementView.list({ filter: { visitorId: { eq: userId } } }).catch(function() { return { data: [] }; })
          : Promise.resolve({ data: [] }),
        client.models.PhaseNote.list().catch(function() { return { data: [] }; }),
        client.models.SalesRep.list().catch(function() { return { data: [] }; })
      ]);

      let allMembersData = results[0].data;
      const engagementData = results[1].data;
      const allPhases = results[2].data;
      const allActivities = results[3].data;
      const allOwnershipRecords = results[4].data;
      const allComments = results[5].data;
      const allChangeLogs = results[6].data;
      const allViews = results[7].data;
      const allPhaseNotes = results[8].data;
      const allSalesReps = results[9].data;

      // Sort and store sales reps
      const sortedSalesReps = allSalesReps.sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      setSalesReps(sortedSalesReps);

      // Create salesReps lookup map
      const salesRepsMap = {};
      allSalesReps.forEach(function(rep) {
        salesRepsMap[rep.id] = rep;
      });

      allMembersData = await ensureSystemUser(allMembersData);

      const phasesByEngagement = groupBy(allPhases, 'engagementId');
      const activitiesByEngagement = groupBy(allActivities, 'engagementId');
      const ownershipByEngagement = groupBy(allOwnershipRecords, 'engagementId');
      const commentsByActivity = groupBy(allComments, 'activityId');
      const changeLogsByEngagement = groupBy(allChangeLogs, 'engagementId');
      const phaseNotesByEngagement = groupBy(allPhaseNotes, 'engagementId');
      
      const viewsMap = {};
      allViews.forEach(function(v) {
        viewsMap[v.engagementId] = v;
      });
      setEngagementViews(viewsMap);

      setAllTeamMembers(allMembersData);
      const activeMembers = allMembersData.filter(function(m) { return m.isActive !== false; });
      setTeamMembers(activeMembers);

      const systemUserIds = allMembersData
        .filter(function(m) { return m.isSystemUser === true; })
        .map(function(m) { return m.id; });

      // Build context object for enrichment function
      const enrichmentContext = {
        phasesByEngagement: phasesByEngagement,
        activitiesByEngagement: activitiesByEngagement,
        ownershipByEngagement: ownershipByEngagement,
        commentsByActivity: commentsByActivity,
        changeLogsByEngagement: changeLogsByEngagement,
        phaseNotesByEngagement: phaseNotesByEngagement,
        viewsMap: viewsMap,
        salesRepsMap: salesRepsMap,
        systemUserIds: systemUserIds,
        userId: userId
      };

      // Use extracted enrichment function
      const enrichedEngagements = engagementData.map(function(eng) {
        return enrichSingleEngagement(eng, enrichmentContext);
      });

      setEngagements(enrichedEngagements);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [ensureSystemUser]);

  // Return a client getter (not a static client) so it's created when needed
  const getClient = useCallback(function() {
    return generateClient();
  }, []);

  return {
    currentUser: currentUser,
    setCurrentUser: setCurrentUser,
    teamMembers: teamMembers,
    setTeamMembers: setTeamMembers,
    allTeamMembers: allTeamMembers,
    setAllTeamMembers: setAllTeamMembers,
    engagements: engagements,
    setEngagements: setEngagements,
    salesReps: salesReps,
    setSalesReps: setSalesReps,
    engagementViews: engagementViews,
    setEngagementViews: setEngagementViews,
    loading: loading,
    setLoading: setLoading,
    selectedEngagement: selectedEngagement,
    updateEngagementInState: updateEngagementInState,
    getOwnerInfo: getOwnerInfo,
    logChangeAsync: logChangeAsync,
    fetchAllData: fetchAllData,
    refreshSingleEngagement: refreshSingleEngagement,
    client: getClient // App.jsx expects 'client'
  };
};

export default usePresalesData;
