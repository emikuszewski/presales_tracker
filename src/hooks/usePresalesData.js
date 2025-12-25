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

  const logChangeAsync = useCallback((engagementId, changeType, description, previousValue = null, newValue = null) => {
    if (!currentUser) return;
    
    const client = generateClient();
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue,
      newValue: newValue
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
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
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
              .catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        client.models.PhaseNote.list()
          .catch(() => ({ data: [] }))
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

      allMembersData = await ensureSystemUser(allMembersData);

      const phasesByEngagement = groupBy(allPhases, 'engagementId');
      const activitiesByEngagement = groupBy(allActivities, 'engagementId');
      const ownershipByEngagement = groupBy(allOwnershipRecords, 'engagementId');
      const commentsByActivity = groupBy(allComments, 'activityId');
      const changeLogsByEngagement = groupBy(allChangeLogs, 'engagementId');
      const phaseNotesByEngagement = groupBy(allPhaseNotes, 'engagementId');
      
      const viewsMap = {};
      allViews.forEach(v => {
        viewsMap[v.engagementId] = v;
      });
      setEngagementViews(viewsMap);

      setAllTeamMembers(allMembersData);
      const activeMembers = allMembersData.filter(m => m.isActive !== false);
      setTeamMembers(activeMembers);

      const systemUserIds = allMembersData
        .filter(m => m.isSystemUser === true)
        .map(m => m.id);

      const enrichedEngagements = engagementData.map((eng) => {
        const phases = phasesByEngagement[eng.id] || [];
        const activities = activitiesByEngagement[eng.id] || [];
        const ownershipRecords = ownershipByEngagement[eng.id] || [];
        const changeLogs = (changeLogsByEngagement[eng.id] || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const phaseNotes = (phaseNotesByEngagement[eng.id] || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const activitiesWithComments = activities
          .map((activity) => ({
            ...activity,
            comments: (commentsByActivity[activity.id] || [])
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

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

        const ownerIds = ownershipRecords.map(o => o.teamMemberId);
        if (ownerIds.length === 0 && eng.ownerId) {
          ownerIds.push(eng.ownerId);
        }

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

        const hasSystemOwne
