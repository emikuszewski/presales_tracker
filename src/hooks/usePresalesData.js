import { useState, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import {
  groupBy,
  parseLinks,
  isEngagementStale,
  getDaysSinceActivity
} from '../utils';
import { phaseConfig, SYSTEM_SE_TEAM } from '../constants';

const usePresalesData = (selectedEngagementId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
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
    var member = allTeamMembers.find(function(m) { return m.id === ownerId; });
    return member || { name: 'Unknown', initials: '?' };
  }, [allTeamMembers]);

  const logChangeAsync = useCallback(function(engagementId, changeType, description, previousValue, newValue) {
    if (!currentUser) return;
    
    var client = generateClient();
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue || null,
      newValue: newValue || null
    }).catch(function(e) { console.error('Error logging change:', e); });
  }, [currentUser]);

  const ensureSystemUser = useCallback(async function(existingMembers) {
    var seTeamExists = existingMembers.some(function(m) {
      return m.email === SYSTEM_SE_TEAM.EMAIL || m.isSystemUser === true;
    });

    if (seTeamExists) {
      return existingMembers;
    }

    try {
      var client = generateClient();
      var result = await client.models.TeamMember.create({
        email: SYSTEM_SE_TEAM.EMAIL,
        name: SYSTEM_SE_TEAM.NAME,
        initials: SYSTEM_SE_TEAM.INITIALS,
        isAdmin: false,
        isActive: true,
        isSystemUser: true
      });

      console.log('Created SE Team system user:', result.data.id);
      return existingMembers.concat([result.data]);
    } catch (error) {
      if (error.message && error.message.indexOf('unique') !== -1) {
        console.log('SE Team already created by another session');
        var client2 = generateClient();
        var refreshed = await client2.models.TeamMember.list();
        return refreshed.data;
      }
      console.error('Error creating SE Team system user:', error);
      return existingMembers;
    }
  }, []);

  const fetchAllData = useCallback(async function(userId) {
    try {
      var client = generateClient();
      
      var results = await Promise.all([
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
        client.models.PhaseNote.list().catch(function() { return { data: [] }; })
      ]);

      var allMembersData = results[0].data;
      var engagementData = results[1].data;
      var allPhases = results[2].data;
      var allActivities = results[3].data;
      var allOwnershipRecords = results[4].data;
      var allComments = results[5].data;
      var allChangeLogs = results[6].data;
      var allViews = results[7].data;
      var allPhaseNotes = results[8].data;

      allMembersData = await ensureSystemUser(allMembersData);

      var phasesByEngagement = groupBy(allPhases, 'engagementId');
      var activitiesByEngagement = groupBy(allActivities, 'engagementId');
      var ownershipByEngagement = groupBy(allOwnershipRecords, 'engagementId');
      var commentsByActivity = groupBy(allComments, 'activityId');
      var changeLogsByEngagement = groupBy(allChangeLogs, 'engagementId');
      var phaseNotesByEngagement = groupBy(allPhaseNotes, 'engagementId');
      
      var viewsMap = {};
      allViews.forEach(function(v) {
        viewsMap[v.engagementId] = v;
      });
      setEngagementViews(viewsMap);

      setAllTeamMembers(allMembersData);
      var activeMembers = allMembersData.filter(function(m) { return m.isActive !== false; });
      setTeamMembers(activeMembers);

      var systemUserIds = allMembersData
        .filter(function(m) { return m.isSystemUser === true; })
        .map(function(m) { return m.id; });

      var enrichedEngagements = engagementData.map(function(eng) {
        var phases = phasesByEngagement[eng.id] || [];
        var activities = activitiesByEngagement[eng.id] || [];
        var ownershipRecords = ownershipByEngagement[eng.id] || [];
        var changeLogs = (changeLogsByEngagement[eng.id] || [])
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        var phaseNotes = (phaseNotesByEngagement[eng.id] || [])
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

        var activitiesWithComments = activities
          .map(function(activity) {
            return Object.assign({}, activity, {
              comments: (commentsByActivity[activity.id] || [])
                .sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); })
            });
          })
          .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

        var phasesObj = {};
        phaseConfig.forEach(function(p) {
          var existingPhase = phases.find(function(ph) { return ph.phaseType === p.id; });
          if (existingPhase) {
            var parsedLinks = parseLinks(existingPhase.links);
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

        var ownerIds = ownershipRecords.map(function(o) { return o.teamMemberId; });
        if (ownerIds.length === 0 && eng.ownerId) {
          ownerIds.push(eng.ownerId);
        }

        var userView = viewsMap[eng.id];
        var unreadChanges = 0;
        if (userView && userId) {
          var lastViewed = new Date(userView.lastViewedAt);
          unreadChanges = changeLogs.filter(function(log) {
            return new Date(log.createdAt) > lastViewed && log.userId !== userId;
          }).length;
        } else if (changeLogs.length > 0 && userId) {
          unreadChanges = changeLogs.filter(function(log) { return log.userId !== userId; }).length;
        }

        var hasSystemOwner = ownerIds.some(function(id) { return systemUserIds.indexOf(id) !== -1; });

        var notesByPhase = {};
        phaseConfig.forEach(function(p) {
          notesByPhase[p.id] = phaseNotes.filter(function(n) { return n.phaseType === p.id; });
        });

        var totalNotesCount = phaseNotes.length;

        // Default engagementStatus to 'ACTIVE' if not set (backwards compatibility)
        var engagementStatus = eng.engagementStatus || 'ACTIVE';

        // Build enriched engagement with new status fields
        var enrichedEng = Object.assign({}, eng, {
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
          closedReason: eng.closedReason || null
        });

        // Calculate isStale using the enriched engagement (which includes engagementStatus)
        enrichedEng.isStale = isEngagementStale(enrichedEng);

        return enrichedEng;
      });

      setEngagements(enrichedEngagements);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [ensureSystemUser]);

  // Return a client getter (not a static client) so it's created when needed
  var getClient = useCallback(function() {
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
    engagementViews: engagementViews,
    setEngagementViews: setEngagementViews,
    loading: loading,
    setLoading: setLoading,
    selectedEngagement: selectedEngagement,
    updateEngagementInState: updateEngagementInState,
    getOwnerInfo: getOwnerInfo,
    logChangeAsync: logChangeAsync,
    fetchAllData: fetchAllData,
    client: getClient // App.jsx expects 'client'
  };
};

export default usePresalesData;
