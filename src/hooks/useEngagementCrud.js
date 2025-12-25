import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { phaseConfig } from '../constants';

var useEngagementCrud = function(params) {
  var currentUser = params.currentUser;
  var setEngagements = params.setEngagements;
  var logChangeAsync = params.logChangeAsync;

  var createEngagement = useCallback(async function(engagementData) {
    if (!currentUser) {
      return { success: false, error: 'No current user' };
    }

    try {
      var client = generateClient();
      var result = await client.models.Engagement.create({
        company: engagementData.company,
        contactName: engagementData.contactName,
        contactEmail: engagementData.contactEmail || null,
        contactPhone: engagementData.contactPhone || null,
        industry: engagementData.industry || null,
        dealSize: engagementData.dealSize || null,
        currentPhase: 'DISCOVER',
        startDate: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0],
        ownerId: currentUser.id,
        isArchived: false,
        salesforceId: engagementData.salesforceId || null,
        salesforceUrl: engagementData.salesforceUrl || null,
        jiraTicket: engagementData.jiraTicket || null,
        jiraUrl: engagementData.jiraUrl || null,
        slackChannel: engagementData.slackChannel || null,
        slackUrl: engagementData.slackUrl || null,
        driveFolderName: engagementData.driveFolderName || null,
        driveFolderUrl: engagementData.driveFolderUrl || null,
        docsName: engagementData.docsName || null,
        docsUrl: engagementData.docsUrl || null,
        slidesName: engagementData.slidesName || null,
        slidesUrl: engagementData.slidesUrl || null,
        sheetsName: engagementData.sheetsName || null,
        sheetsUrl: engagementData.sheetsUrl || null
      });

      var newEngagement = result.data;
      var phases = {};
      
      for (var i = 0; i < phaseConfig.length; i++) {
        var phase = phaseConfig[i];
        var phaseResult = await client.models.Phase.create({
          engagementId: newEngagement.id,
          phaseType: phase.id,
          status: phase.id === 'DISCOVER' ? 'IN_PROGRESS' : 'PENDING',
          completedDate: null,
          notes: '',
          links: JSON.stringify([])
        });
        phases[phase.id] = { ...phaseResult.data, links: [] };
      }

      await client.models.EngagementOwner.create({
        engagementId: newEngagement.id,
        teamMemberId: currentUser.id,
        role: 'primary',
        addedAt: new Date().toISOString()
      });

      var enrichedEngagement = {
        ...newEngagement,
        phases: phases,
        activities: [],
        ownerIds: [currentUser.id],
        ownershipRecords: [],
        changeLogs: [],
        phaseNotes: [],
        notesByPhase: {},
        totalNotesCount: 0,
        unreadChanges: 0,
        isStale: false,
        daysSinceActivity: 0,
        hasSystemOwner: false
      };

      setEngagements(function(prev) { return [enrichedEngagement].concat(prev); });

      if (logChangeAsync) {
        logChangeAsync(newEngagement.id, 'CREATED', 'Created engagement for ' + engagementData.company);
      }

      return { success: true, engagement: enrichedEngagement };
    } catch (error) {
      console.error('Error creating engagement:', error);
      return { success: false, error: error };
    }
  }, [currentUser, setEngagements, logChangeAsync]);

  var updateEngagement = useCallback(async function(engagementId, updates) {
    try {
      var client = generateClient();
      var result = await client.models.Engagement.update({
        id: engagementId,
        ...updates
      });

      var updatedEngagement = result.data;
      setEngagements(function(prev) {
        return prev.map(function(e) {
          return e.id === engagementId ? { ...e, ...updatedEngagement } : e;
        });
      });

      return { success: true, engagement: updatedEngagement };
    } catch (error) {
      console.error('Error updating engagement:', error);
      return { success: false, error: error };
    }
  }, [setEngagements]);

  var archiveEngagement = useCallback(async function(engagementId) {
    try {
      var client = generateClient();
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: true
      });

      setEngagements(function(prev) {
        return prev.map(function(e) {
          return e.id === engagementId ? { ...e, isArchived: true } : e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'ARCHIVED', 'Archived engagement');
      }

      return { success: true };
    } catch (error) {
      console.error('Error archiving engagement:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  var restoreEngagement = useCallback(async function(engagementId) {
    try {
      var client = generateClient();
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: false
      });

      setEngagements(function(prev) {
        return prev.map(function(e) {
          return e.id === engagementId ? { ...e, isArchived: false } : e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'RESTORED', 'Restored engagement');
      }

      return { success: true };
    } catch (error) {
      console.error('Error restoring engagement:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  var advancePhase = useCallback(async function(engagementId, newPhase) {
    try {
      var client = generateClient();
      await client.models.Engagement.update({
        id: engagementId,
        currentPhase: newPhase
      });

      setEngagements(function(prev) {
        return prev.map(function(e) {
          return e.id === engagementId ? { ...e, currentPhase: newPhase } : e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'PHASE_UPDATE', 'Advanced to ' + newPhase + ' phase');
      }

      return { success: true };
    } catch (error) {
      console.error('Error advancing phase:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  var addOwner = useCallback(async function(engagementId, teamMemberId) {
    try {
      var client = generateClient();
      var result = await client.models.EngagementOwner.create({
        engagementId: engagementId,
        teamMemberId: teamMemberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });

      var ownership = result.data;

      setEngagements(function(prev) {
        return prev.map(function(e) {
          if (e.id === engagementId) {
            return {
              ...e,
              ownerIds: e.ownerIds.concat([teamMemberId]),
              ownershipRecords: (e.ownershipRecords || []).concat([ownership])
            };
          }
          return e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'OWNER_ADDED', 'Added owner');
      }

      return { success: true, ownership: ownership };
    } catch (error) {
      console.error('Error adding owner:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  var removeOwner = useCallback(async function(engagementId, teamMemberId, ownershipId) {
    try {
      var client = generateClient();
      await client.models.EngagementOwner.delete({ id: ownershipId });

      setEngagements(function(prev) {
        return prev.map(function(e) {
          if (e.id === engagementId) {
            return {
              ...e,
              ownerIds: e.ownerIds.filter(function(id) { return id !== teamMemberId; }),
              ownershipRecords: (e.ownershipRecords || []).filter(function(o) { return o.id !== ownershipId; })
            };
          }
          return e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'OWNER_REMOVED', 'Removed owner');
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing owner:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  var updateIntegrations = useCallback(async function(engagementId, integrations) {
    try {
      var client = generateClient();
      await client.models.Engagement.update({
        id: engagementId,
        ...integrations
      });

      setEngagements(function(prev) {
        return prev.map(function(e) {
          return e.id === engagementId ? { ...e, ...integrations } : e;
        });
      });

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'INTEGRATION_UPDATE', 'Updated integrations');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating integrations:', error);
      return { success: false, error: error };
    }
  }, [setEngagements, logChangeAsync]);

  return {
    createEngagement: createEngagement,
    updateEngagement: updateEngagement,
    archiveEngagement: archiveEngagement,
    restoreEngagement: restoreEngagement,
    advancePhase: advancePhase,
    addOwner: addOwner,
    removeOwner: removeOwner,
    updateIntegrations: updateIntegrations
  };
};

export default useEngagementCrud;
