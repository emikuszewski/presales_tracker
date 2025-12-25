import { useState, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import {
  groupBy,
  parseLinks,
  isEngagementStale,
  getDaysSinceActivity
} from '../utils';
import { phaseConfig, SYSTEM_SE_TEAM } from '../constants';

// Generate typed client
const client = generateClient();

/**
 * Core data hook that owns all engagement/team data state
 * and provides fundamental data operations.
 * 
 * @param {string|null} selectedEngagementId - ID of currently selected engagement
 * @returns {Object} Data state and operations
 */
const usePresalesData = (selectedEngagementId = null) => {
  // Core data state
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [engagementViews, setEngagementViews] = useState({});
  const [loading, setLoading] = useState(true);

  // Derive selectedEngagement from ID - single source of truth
  const selectedEngagement = useMemo(() => {
    if (!selectedEngagementId) return null;
    return engagements.find(e => e.id === selectedEngagementId) || null;
  }, [engagements, selectedEngagementId]);

  // Helper to update a single engagement in state
  // Now only updates engagements array - selectedEngagement derives automatically
  const updateEngagementInState = useCallback((engagementId, updater) => {
    setEngagements(prev => prev.map(e => 
      e.id === engagementId 
        ? (typeof updater === 'function' ? updater(e) : { ...e, ...updater }) 
        : e
    ));
  }, []);

  // Memoized owner info lookup function
  const getOwnerInfo = useCallback((ownerId) => {
    const member = allTeamMembers.find(m => m.id === ownerId);
    return member || { name: 'Unknown', initials: '?' };
  }, [allTeamMembers]);

  // Background log - doesn't block UI
  const logChangeAsync = useCallback((engagementId, changeType, description, previousValue = null, newValue = null) => {
    if (!currentUser) return;
    
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue,
      newValue: newValue
    }).catch(e => console.error('Error logging change:', e));
  }, [currentUser]);

  /**
   * Ensure SE Team system user exists (auto-seed on first load)
   * Self-healing: if deleted, recreates on next app load
   * 
   * @param {Array} existingMembers - Current team members from database
   * @returns {Array} Updated members list including SE Team
   */
  const ensureSystemUser = useCallback(async (existingMembers) => {
    // Check if SE Team already exists by email OR isSystemUser flag
    const seTeamExists = existingMembers.some(
      m => m.email === SYSTEM_SE_TEAM.EMAIL || m.isSystemUser === true
    );

    if (seTeamExists) {
      return existingMembers;
    }

    // SE Team doesn't exist - create it
    try {
      const { data: newSeTeam } = await client.models.TeamMember.create({
        email: SYSTEM_SE_TEAM.EMAIL,
        name: SYSTEM_SE_TEAM.NAME,
        initials: SYSTEM_SE_TEAM.INITIALS,
        isAdmin: false,
        isActive: true,
        isSystemUser: true
      });

      console.log('Created SE Team system user:', newSeTeam.id);
      return [...existingMembers, newSeTeam];
    } catch (error) {
      // Handle race condition: if another session created it, just log and continue
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        console.log('SE Team already created by another session');
        // Refetch to get the newly created record
        const { data: refreshedMembers } = await client.models.TeamMember.list();
        return refreshedMembers;
      }
      console.error('Error creating SE Team system user:', error);
      return existingMembers;
    }
  }, []);

  // OPTIMIZED: Batch fetch all data in parallel to solve N+1 query problem
  const fetchAllData = useCallback(async (userId) => {
    try {
      // Parallel fetch ALL data in one batch - this is the key optimization
      const [
        membersResult,
        engagementsResult,
        phasesResult,
        activitiesResult,
        ownershipResult,
        commentsResult,
        changeLogsResult,
        viewsResult,
        phaseNotesResult
      ] = await Promise.all([
        client.models.TeamMember.list(),
        client.models.Engagement.list(),
        client.models.Phase.list(),
        client.models.Activity.list(),
        client.models.EngagementOwner.list(),
        client.models.Comment.list(),
        client.models.ChangeLog.list(),
        userId 
          ? client.models.EngagementView.list({ filter: { visitorId: { eq: userId } } })
              .catch(() => ({ data: [] })) // Handle if EngagementView not available
          : Promise.resolve({ data: [] }),
        client.models.PhaseNote.list()
          .catch(() => ({ data: [] })) // Handle if PhaseNote not available yet
      ]);

      let allMembersData = membersResult.data;
      const engagementData = engagementsResult.data;
      const allPhases = phasesResult.data;
      const allActivities = activitiesResult.data;
      const allOwnershipRecords = ownershipResult.data;
      const allComments = commentsResult.data;
      const allChangeLogs = changeLogsResult.data;
      const allViews = viewsResult.data;
      const allPhaseNotes = phaseNotesResult.data;

      // Ensure SE Team system user exists (auto-seed if needed)
      allMembersData = await ensureSystemUser(allMembersData);

      // Create lookup maps for O(1) access instead of filtering per engagement
      const phasesByEngagement = groupBy(allPhases, 'engagementId');
      const activitiesByEngagement = groupBy(allActivities, 'engagementId');
      const ownershipByEngagement = groupBy(allOwnershipRecords, 'engagementId');
      const commentsByActivity = groupBy(allComments, 'activityId');
      const changeLogsByEngagement = groupBy(allChangeLogs, 'engagementId');
      const phaseNotesByEngagement = groupBy(allPhaseNotes, 'engagementId');
      
      // Create views map
      const viewsMap = {};
      allViews.forEach(v => {
        viewsMap[v.engagementId] = v;
      });
      setEngagementViews(viewsMap);

      // Set team members
      setAllTeamMembers(allMembersData);
      // Active members excludes inactive but INCLUDES system users (they're always active)
      const activeMembers = allMembersData.filter(m => m.isActive !== false);
      setTeamMembers(activeMembers);

      // Get system user IDs for hasSystemOwner computation
      const systemUserIds = allMembersData
        .filter(m => m.isSystemUser === true)
        .map(m => m.id);

      // Enrich engagements WITHOUT additional queries - all data is already loaded
      const enrichedEngagements = engagementData.map((eng) => {
        // Get phases for this engagement from our lookup map
        const phases = phasesByEngagement[eng.id] || [];
        
        // Get activities for this engagement from our lookup map
        const activities = activitiesByEngagement[eng.id] || [];
        
        // Get ownership records for this engagement from our lookup map
        const ownershipRecords = ownershipByEngagement[eng.id] || [];
        
        // Get change logs for this engagement from our lookup map
        const changeLogs = (changeLogsByEngagement[eng.id] || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Get phase notes for this engagement from our lookup map
        const phaseNotes = (phaseNotesByEngagement[eng.id] || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Enrich activities with their comments from our lookup map
        const activitiesWithComments = activities
          .map((activity) => ({
            ...activity,
            comments: (commentsByActivity[activity.id] || [])
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Build phases object
        const phasesObj = {};
        phaseConfig.forEach(p => {
          const existingPhase = phases.find(ph => ph.phaseType === p.id);
          if (existingPhase) {
            const parsedLinks = parseLinks(existingPhase.links);
            phasesObj[p.id] = {
              ...existingPhase,
              links: parsedLinks
            };
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

        // Build owner IDs list
        const ownerIds = ownershipRecords.map(o => o.teamMemberId);
        if (ownerIds.length === 0 && eng.ownerId) {
          ownerIds.push(eng.ownerId);
        }

        // Calculate unread changes
        const userView = viewsMap[eng.id];
        let unreadChanges = 0;
        if (userView && userId) {
          const lastViewed = new Date(userView.lastViewedAt);
          unreadChanges = changeLogs.filter(log => 
            new Date(log.createdAt) > lastViewed && log.userId !== userId
          ).length;
        } else if (changeLogs.length > 0 && userId) {
          unreadChanges = changeLogs.filter(log => log.userId !== userId).length;
        }

        // Compute hasSystemOwner - true if any owner is a system user
        const hasSystemOwner = ownerIds.some(id => systemUserIds.includes(id));

        // Group phase notes by phase type for easy access
        const notesByPhase = {};
        phaseConfig.forEach(p => {
          notesByPhase[p.id] = phaseNotes.filter(n => n.phaseType === p.id);
        });

        // Calculate total notes count
        const totalNotesCount = phaseNotes.length;

        return {
          ...eng,
          phases: phasesObj,
          activities: activitiesWithComments,
          ownerIds: ownerIds,
          ownershipRecords: ownershipRecords,
          changeLogs: changeLogs,
          phaseNotes: phaseNotes,
          notesByPhase: notesByPhase,
          totalNotesCount: totalNotesCount,
          unreadChanges: unreadChanges,
          isStale: isEngagementStale(eng),
          daysSinceActivity: getDaysSinceActivity(eng),
          hasSystemOwner: hasSystemOwner
        };
      });

      setEngagements(enrichedEngagements);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [ensureSystemUser]);

  return {
    // State
    currentUser,
    setCurrentUser,
    teamMembers,
    setTeamMembers,
    allTeamMembers,
    setAllTeamMembers,
    engagements,
    setEngagements,
    engagementViews,
    setEngagementViews,
    loading,
    setLoading,
    
    // Derived
    selectedEngagement,
    
    // Operations
    updateEngagementInState,
    getOwnerInfo,
    logChangeAsync,
    fetchAllData,
    
    // Client for other hooks
    client
  };
};

export default usePresalesData;
