import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { phaseConfig } from '../constants';

const client = generateClient();

/**
 * Hook for engagement CRUD operations
 * 
 * @param {Object} params - Hook parameters
 * @param {Object} params.currentUser - Current logged-in user
 * @param {Function} params.setEngagements - Setter for engagements list
 * @param {Function} params.logChangeAsync - Function to log changes
 * @returns {Object} Engagement CRUD operations
 */
const useEngagementCrud = ({ currentUser, setEngagements, logChangeAsync }) => {

  /**
   * Create a new engagement with all phases
   */
  const createEngagement = useCallback(async (engagementData) => {
    if (!currentUser) {
      return { success: false, error: 'No current user' };
    }

    try {
      // Create the engagement
      const { data: newEngagement } = await client.models.Engagement.create({
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
        // Integration fields
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

      // Create all 5 phases
      const phases = {};
      for (const phase of phaseConfig) {
        const { data: newPhase } = await client.models.Phase.create({
          engagementId: newEngagement.id,
          phaseType: phase.id,
          status: phase.id === 'DISCOVER' ? 'IN_PROGRESS' : 'PENDING',
          completedDate: null,
          notes: '',
          links: JSON.stringify([])
        });
        phases[phase.id] = { ...newPhase, links: [] };
      }

      // Create ownership record
      await client.models.EngagementOwner.create({
        engagementId: newEngagement.id,
        teamMemberId: currentUser.id,
        role: 'primary',
        addedAt: new Date().toISOString()
      });

      // Build enriched engagement
      const enrichedEngagement = {
        ...newEngagement,
        phases,
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

      // Update local state
      setEngagements(prev => [enrichedEngagement, ...prev]);

      // Log the creation
      if (logChangeAsync) {
        logChangeAsync(
          newEngagement.id,
          'CREATED',
          `Created engagement for ${engagementData.company}`
        );
      }

      return { success: true, engagement: enrichedEngagement };
    } catch (error) {
      console.error('Error creating engagement:', error);
      return { success: false, error };
    }
  }, [currentUser, setEngagements, logChangeAsync]);

  /**
   * Update an engagement's details
   */
  const updateEngagement = useCallback(async (engagementId, updates) => {
    try {
      const { data: updatedEngagement } = await client.models.Engagement.update({
        id: engagementId,
        ...updates
      });

      // Update local state
      setEngagements(prev => prev.map(e =>
        e.id === engagementId ? { ...e, ...updatedEngagement } : e
      ));

      return { success: true, engagement: updatedEngagement };
    } catch (error) {
      console.error('Error updating engagement:', error);
      return { success: false, error };
    }
  }, [setEngagements]);

  /**
   * Archive an engagement
   */
  const archiveEngagement = useCallback(async (engagementId) => {
    try {
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: true
      });

      setEngagements(prev => prev.map(e =>
        e.id === engagementId ? { ...e, isArchived: true } : e
      ));

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'ARCHIVED', 'Archived engagement');
      }

      return { success: true };
    } catch (error) {
      console.error('Error archiving engagement:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  /**
   * Restore an archived engagement
   */
  const restoreEngagement = useCallback(async (engagementId) => {
    try {
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: false
      });

      setEngagements(prev => prev.map(e =>
        e.id === engagementId ? { ...e, isArchived: false } : e
      ));

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'RESTORED', 'Restored engagement');
      }

      return { success: true };
    } catch (error) {
      console.error('Error restoring engagement:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  /**
   * Update current phase
   */
  const advancePhase = useCallback(async (engagementId, newPhase) => {
    try {
      await client.models.Engagement.update({
        id: engagementId,
        currentPhase: newPhase
      });

      setEngagements(prev => prev.map(e =>
        e.id === engagementId ? { ...e, currentPhase: newPhase } : e
      ));

      if (logChangeAsync) {
        logChangeAsync(
          engagementId,
          'PHASE_UPDATE',
          `Advanced to ${newPhase} phase`
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error advancing phase:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  /**
   * Add an owner to engagement
   */
  const addOwner = useCallback(async (engagementId, teamMemberId) => {
    try {
      const { data: ownership } = await client.models.EngagementOwner.create({
        engagementId,
        teamMemberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });

      setEngagements(prev => prev.map(e => {
        if (e.id === engagementId) {
          return {
            ...e,
            ownerIds: [...e.ownerIds, teamMemberId],
            ownershipRecords: [...(e.ownershipRecords || []), ownership]
          };
        }
        return e;
      }));

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'OWNER_ADDED', 'Added owner');
      }

      return { success: true, ownership };
    } catch (error) {
      console.error('Error adding owner:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  /**
   * Remove an owner from engagement
   */
  const removeOwner = useCallback(async (engagementId, teamMemberId, ownershipId) => {
    try {
      await client.models.EngagementOwner.delete({ id: ownershipId });

      setEngagements(prev => prev.map(e => {
        if (e.id === engagementId) {
          return {
            ...e,
            ownerIds: e.ownerIds.filter(id => id !== teamMemberId),
            ownershipRecords: (e.ownershipRecords || []).filter(o => o.id !== ownershipId)
          };
        }
        return e;
      }));

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'OWNER_REMOVED', 'Removed owner');
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing owner:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  /**
   * Update integrations
   */
  const updateIntegrations = useCallback(async (engagementId, integrations) => {
    try {
      await client.models.Engagement.update({
        id: engagementId,
        ...integrations
      });

      setEngagements(prev => prev.map(e =>
        e.id === engagementId ? { ...e, ...integrations } : e
      ));

      if (logChangeAsync) {
        logChangeAsync(engagementId, 'INTEGRATION_UPDATE', 'Updated integrations');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating integrations:', error);
      return { success: false, error };
    }
  }, [setEngagements, logChangeAsync]);

  return {
    createEngagement,
    updateEngagement,
    archiveEngagement,
    restoreEngagement,
    advancePhase,
    addOwner,
    removeOwner,
    updateIntegrations
  };
};

export default useEngagementCrud;
