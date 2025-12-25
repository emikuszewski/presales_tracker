import { useState, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import {
  groupBy,
  parseLinks,
  isEngagementStale,
  getDaysSinceActivity
} from '../utils';
import { phaseConfig, SYSTEM_SE_TEAM } from '../constants';

const usePresalesData = (selectedEngagementId = null) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [engagementViews, setEngagementViews] = useState({});
  const [loading, setLoading] = useState(true);

  const selectedEngagement = useMemo(() => {
    if (!selectedEngagementId) return null;
    return engagements.find(e => e.id === selectedEngagementId) || null;
  }, [engagements, selectedEngagementId]);

  const updateEngagementInState = useCallback((engagementId, updater) => {
    setEngagements(prev => prev.map(e => 
      e.id === engagementId 
        ? (typeof updater === 'function' ? updater(e) : { ...e, ...updater }) 
        : e
    ));
  }, []);

  const getOwnerInfo = useCallback((ownerId) => {
    const member = allTeamMembers.find(m => m.id === ownerId);
    return member || { name: 'Unknown', initials: '?' };
  }, [allTeamMembers]);

  const logChangeAsync = useCallback((engagementId, changeType, description, previousValue, newValue) => {
    if (!currentUser) return;
    
    const client = generateClient();
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue || null,
      newValue: newValue || null
    }).catch(e => console.error('Error logging change:', e));
  }, [currentUser]);

  const ensureSystemUser = useCallback(async (existingMembers) => {
    const seTeamExists = existingMembers.some(
      m => m.email === SYSTEM_SE_TEAM.EMAIL || m.isSystemUser === true
    );

    if (seTeamExists) {
      return existingMembers;
    }

    try {
      const client = generateClient();
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
      if (error.message && error.message.includes('unique')) {
        console.log('SE Team already created by another session');
        const client = generateClient();
        const { data: refreshedMembers } = await client.models.TeamMember.list();
        return refreshedMembers;
      }
      console.error('Error creating SE Team system user:', error);
      return existingMembers;
    }
  }, []);

  const fetchAllData = useCallback(async (userId) => {
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
          ? client.models.EngagementView.list({ filter: { visitorId: { eq: userId } } }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        client.models.PhaseNote.list().catch(() => ({ data: [] }))
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

      const enrichedEngagements = engagementData.map(function(eng) {
        const phases = phasesByEngagement[eng.id] || [];
        const activities = activitiesByEngagement[eng.id] || [];
        const ownershipRecords = ownershipByEngagement[eng.id] || [];
        const changeLogs = (changeLogsByEngagement[eng.id] || [])
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        const phaseNotes = (phaseNotesByEngagement[eng.id] || [])
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

        const activitiesWithComments = activities
          .map(function(activity) {
            return {
              ...activity,
              comments: (commentsByActivity[activity.id] || [])
                .sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); })
            };
          })
          .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

        const phasesObj = {};
        phaseConfig.forEach(function(p) {
          const existingPhase = phases.find(function(ph) { return ph.phaseType === p.id; });
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

        const hasSystemOwner = ownerIds.some(function(id) { return systemUserIds.includes(id); });

        const notesByPhase = {};
        phaseConfig.forEach(function(p) {
          notesByPhase[p.id] = phaseNotes.filter(function(n) { return n.phaseType === p.id; });
        });

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
    selectedEngagement,
    updateEngagementInState,
    getOwnerInfo,
    logChangeAsync,
    fetchAllData
  };
};

export default usePresalesData;
