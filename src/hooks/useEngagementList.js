import { useMemo, useCallback } from 'react';
import { phaseConfig, phaseLabels } from '../constants';
import { computePipelineTotal, formatPipelineTotal, recalculateIsStale } from '../utils';

const useEngagementList = function(params) {
  const engagements = params.engagements;
  const setEngagements = params.setEngagements;
  const currentUser = params.currentUser;
  const newEngagement = params.newEngagement;
  const setNewEngagement = params.setNewEngagement;
  const navigateTo = params.navigateTo;
  const updateEngagementInState = params.updateEngagementInState;
  const fetchAllData = params.fetchAllData;
  const logChangeAsync = params.logChangeAsync;
  const client = params.client;
  const filters = params.filters || {};
  const getOwnerInfo = params.getOwnerInfo;

  const filterPhase = filters.filterPhase;
  const filterOwner = filters.filterOwner;
  const filterStale = filters.filterStale;
  const showArchived = filters.showArchived;
  const showEverything = filters.showEverything;
  const searchQuery = filters.searchQuery;

  // Total count of all engagements (for Everything button)
  const totalEverythingCount = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    return engagements.length;
  }, [engagements]);

  // Compute pipeline total for all non-archived engagements (ignores filters)
  const pipelineStats = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) {
      return { total: 0, count: 0, formatted: '$0' };
    }
    const stats = computePipelineTotal(engagements, true); // activeOnly = true
    return {
      total: stats.total,
      count: stats.count,
      formatted: formatPipelineTotal(stats.total)
    };
  }, [engagements]);

  // Compute filtered engagements for list view
  const filteredEngagements = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return [];
    
    let result = engagements.slice();

    // When showEverything is active, bypass owner and archived filters
    if (!showEverything) {
      // Filter by archived status
      result = result.filter(function(e) {
        return showArchived ? e.isArchived === true : e.isArchived !== true;
      });

      // Filter by owner
      if (filterOwner === 'mine' && currentUser) {
        result = result.filter(function(e) {
          return e.ownerIds && e.ownerIds.indexOf(currentUser.id) !== -1;
        });
      } else if (filterOwner && filterOwner !== 'all' && filterOwner !== 'mine') {
        result = result.filter(function(e) {
          return e.ownerIds && e.ownerIds.indexOf(filterOwner) !== -1;
        });
      }
    }
    // When showEverything is true, we show all regardless of owner/archived

    // Filter by phase (always applies, even in Everything mode)
    if (filterPhase && filterPhase !== 'all') {
      result = result.filter(function(e) {
        return e.currentPhase === filterPhase;
      });
    }

    // Filter by stale (always applies, even in Everything mode)
    if (filterStale) {
      result = result.filter(function(e) {
        return e.isStale === true;
      });
    }

    // Filter by search query (always applies, even in Everything mode)
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(function(e) {
        const companyMatch = e.company && e.company.toLowerCase().indexOf(query) !== -1;
        const contactMatch = e.contactName && e.contactName.toLowerCase().indexOf(query) !== -1;
        return companyMatch || contactMatch;
      });
    }

    // Sort alphabetically by company name (A-Z, case-insensitive)
    result.sort(function(a, b) {
      const companyA = (a.company || '').toLowerCase();
      const companyB = (b.company || '').toLowerCase();
      return companyA.localeCompare(companyB);
    });

    return result;
  }, [engagements, showArchived, showEverything, filterOwner, filterPhase, filterStale, searchQuery, currentUser]);

  // Compute stale count (in current view mode)
  const staleCount = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    // When Everything is active, count stale across ALL engagements
    if (showEverything) {
      return engagements.filter(function(e) { return e.isStale === true; }).length;
    }
    
    let relevantEngagements = engagements.filter(function(e) {
      if (showArchived) return e.isArchived === true;
      return e.isArchived !== true;
    });

    if (filterOwner === 'mine' && currentUser) {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(currentUser.id) !== -1;
      });
    } else if (filterOwner && filterOwner !== 'all' && filterOwner !== 'mine') {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(filterOwner) !== -1;
      });
    }

    return relevantEngagements.filter(function(e) { return e.isStale === true; }).length;
  }, [engagements, showArchived, showEverything, filterOwner, currentUser]);

  // Total in view mode (before phase/stale/search filters)
  const totalInViewMode = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    // When Everything is active, total is all engagements
    if (showEverything) {
      return engagements.length;
    }
    
    let relevantEngagements = engagements.filter(function(e) {
      if (showArchived) return e.isArchived === true;
      return e.isArchived !== true;
    });

    if (filterOwner === 'mine' && currentUser) {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(currentUser.id) !== -1;
      });
    } else if (filterOwner && filterOwner !== 'all' && filterOwner !== 'mine') {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(filterOwner) !== -1;
      });
    }

    return relevantEngagements.length;
  }, [engagements, showArchived, showEverything, filterOwner, currentUser]);

  // In progress count in view mode
  const inProgressInViewMode = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    // When Everything is active, count in-progress across ALL engagements
    if (showEverything) {
      return engagements.filter(function(e) {
        const currentPhaseData = e.phases && e.phases[e.currentPhase];
        return currentPhaseData && currentPhaseData.status === 'IN_PROGRESS';
      }).length;
    }
    
    let relevantEngagements = engagements.filter(function(e) {
      if (showArchived) return e.isArchived === true;
      return e.isArchived !== true;
    });

    if (filterOwner === 'mine' && currentUser) {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(currentUser.id) !== -1;
      });
    } else if (filterOwner && filterOwner !== 'all' && filterOwner !== 'mine') {
      relevantEngagements = relevantEngagements.filter(function(e) {
        return e.ownerIds && e.ownerIds.indexOf(filterOwner) !== -1;
      });
    }

    return relevantEngagements.filter(function(e) {
      const currentPhaseData = e.phases && e.phases[e.currentPhase];
      return currentPhaseData && currentPhaseData.status === 'IN_PROGRESS';
    }).length;
  }, [engagements, showArchived, showEverything, filterOwner, currentUser]);

  // Get cascade info for delete modal
  const getCascadeInfo = useCallback(function(engagement) {
    if (!engagement) {
      return { phases: 0, activities: 0, comments: 0, changeLogs: 0, owners: 0, notes: 0 };
    }

    const phases = engagement.phases ? Object.keys(engagement.phases).length : 0;
    const activities = engagement.activities ? engagement.activities.length : 0;
    let comments = 0;
    if (engagement.activities) {
      engagement.activities.forEach(function(a) {
        if (a.comments) comments += a.comments.length;
      });
    }
    const changeLogs = engagement.changeLogs ? engagement.changeLogs.length : 0;
    const owners = engagement.ownerIds ? engagement.ownerIds.length : 0;
    const notes = engagement.phaseNotes ? engagement.phaseNotes.length : 0;

    return {
      phases: phases,
      activities: activities,
      comments: comments,
      changeLogs: changeLogs,
      owners: owners,
      notes: notes
    };
  }, []);

  /**
   * Build cascade summary string for deletion log
   * e.g., "5 activities, 8 comments, 3 notes"
   */
  const buildCascadeSummary = useCallback(function(cascadeInfo) {
    const parts = [];
    
    if (cascadeInfo.activities > 0) {
      parts.push(cascadeInfo.activities + ' activit' + (cascadeInfo.activities === 1 ? 'y' : 'ies'));
    }
    if (cascadeInfo.comments > 0) {
      parts.push(cascadeInfo.comments + ' comment' + (cascadeInfo.comments === 1 ? '' : 's'));
    }
    if (cascadeInfo.notes > 0) {
      parts.push(cascadeInfo.notes + ' note' + (cascadeInfo.notes === 1 ? '' : 's'));
    }
    
    if (parts.length === 0) {
      return 'No related data';
    }
    
    return parts.join(', ');
  }, []);

  /**
   * Get owner names as comma-separated string
   */
  const getOwnerNamesString = useCallback(function(engagement, getOwnerInfoFn) {
    if (!engagement.ownerIds || engagement.ownerIds.length === 0) {
      return '';
    }
    
    const names = engagement.ownerIds.map(function(ownerId) {
      const owner = getOwnerInfoFn(ownerId);
      return owner.name || 'Unknown';
    });
    
    return names.join(', ');
  }, []);

  /**
   * Helper to add a change log to the engagement's changeLogs array
   * @param {string} engagementId - The engagement ID
   * @param {Object} changeLog - The created change log record
   */
  const addChangeLogToState = function(engagementId, changeLog) {
    if (!changeLog) return;
    updateEngagementInState(engagementId, function(eng) {
      return Object.assign({}, eng, {
        changeLogs: [changeLog].concat(eng.changeLogs || [])
      });
    });
  };

  /**
   * Create new engagement
   * @param {Object} overrides - Optional overrides to merge with newEngagement (e.g., { dealSize: '$100K' })
   */
  const handleCreateEngagement = useCallback(async function(overrides) {
    // Merge overrides with newEngagement
    const engagementData = Object.assign({}, newEngagement, overrides || {});

    // Validate using merged data (supports both controlled form and direct data passing)
    if (!currentUser || !engagementData.company || !engagementData.contactName) {
      return;
    }

    try {
      const dataClient = typeof client === 'function' ? client() : client;
      const today = new Date().toISOString().split('T')[0];

      // Build the create payload - IMPORTANT: omit salesRepId if empty (GSI constraint)
      const createPayload = {
        company: engagementData.company,
        contactName: engagementData.contactName,
        contactEmail: engagementData.contactEmail || null,
        contactPhone: engagementData.contactPhone || null,
        industry: engagementData.industry || 'TECHNOLOGY',
        dealSize: engagementData.dealSize || null,
        currentPhase: 'DISCOVER',
        startDate: today,
        lastActivity: today,
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
      };

      // Only include salesRepId if it has a value (GSI doesn't allow null)
      if (engagementData.salesRepId) {
        createPayload.salesRepId = engagementData.salesRepId;
      }

      // Only include partnerName if it has a value
      if (engagementData.partnerName && engagementData.partnerName.trim()) {
        createPayload.partnerName = engagementData.partnerName.trim();
      }

      const result = await dataClient.models.Engagement.create(createPayload);

      const createdEngagement = result.data;

      if (!createdEngagement) {
        console.error('Failed to create engagement:', result.errors);
        return;
      }

      // Create phases
      const phases = {};
      for (let i = 0; i < phaseConfig.length; i++) {
        const phase = phaseConfig[i];
        const phaseResult = await dataClient.models.Phase.create({
          engagementId: createdEngagement.id,
          phaseType: phase.id,
          status: phase.id === 'DISCOVER' ? 'IN_PROGRESS' : 'PENDING',
          completedDate: null,
          notes: '',
          links: JSON.stringify([])
        });
        phases[phase.id] = Object.assign({}, phaseResult.data, { links: [] });
      }

      // Create ownership records for selected owners
      const ownerIds = engagementData.ownerIds && engagementData.ownerIds.length > 0 
        ? engagementData.ownerIds 
        : [currentUser.id];

      for (let j = 0; j < ownerIds.length; j++) {
        await dataClient.models.EngagementOwner.create({
          engagementId: createdEngagement.id,
          teamMemberId: ownerIds[j],
          role: j === 0 ? 'primary' : 'secondary',
          addedAt: new Date().toISOString()
        });
      }

      // Build enriched engagement
      const enrichedEngagement = Object.assign({}, createdEngagement, {
        phases: phases,
        activities: [],
        ownerIds: ownerIds,
        ownershipRecords: [],
        changeLogs: [],
        phaseNotes: [],
        notesByPhase: {},
        totalNotesCount: 0,
        unreadChanges: 0,
        isStale: false,
        daysSinceActivity: 0,
        hasSystemOwner: false,
        salesRepName: null,
        partnerName: engagementData.partnerName || null
      });

      setEngagements(function(prev) { return [enrichedEngagement].concat(prev); });

      if (logChangeAsync) {
        logChangeAsync(createdEngagement.id, 'CREATED', 'Created engagement for ' + engagementData.company);
      }

      // Reset form and navigate to new engagement detail
      setNewEngagement({
        company: '', contactName: '', contactEmail: '', contactPhone: '', 
        industry: 'TECHNOLOGY', dealSize: '', ownerIds: currentUser ? [currentUser.id] : [],
        salesRepId: '', partnerName: '',
        salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', 
        driveFolderName: '', driveFolderUrl: '',
        docsName: '', docsUrl: '',
        slidesName: '', slidesUrl: '',
        sheetsName: '', sheetsUrl: '',
        slackChannel: '', slackUrl: ''
      });
      navigateTo('detail', createdEngagement.id);
    } catch (error) {
      console.error('Error creating engagement:', error);
    }
  }, [currentUser, newEngagement, setNewEngagement, navigateTo, setEngagements, logChangeAsync, client]);

  // Toggle archive status
  // GROUP B: Updated to add changeLog to state immediately + recalculate isStale when restoring
  const handleToggleArchive = useCallback(async function(engagementId, shouldArchive) {
    try {
      const dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.Engagement.update({
        id: engagementId,
        isArchived: shouldArchive
      });

      // When restoring (unarchiving), we need to recalculate isStale
      // When archiving, isStale should be false (archived engagements are never stale)
      updateEngagementInState(engagementId, function(eng) {
        const stateUpdate = { isArchived: shouldArchive };
        
        if (shouldArchive) {
          // Archiving - set isStale to false
          stateUpdate.isStale = false;
        } else {
          // Restoring - recalculate isStale based on current engagement state
          const restoredEngagement = Object.assign({}, eng, { isArchived: false });
          stateUpdate.isStale = recalculateIsStale(restoredEngagement);
        }
        
        return Object.assign({}, eng, stateUpdate);
      });

      if (logChangeAsync) {
        const changeLog = await logChangeAsync(
          engagementId, 
          shouldArchive ? 'ARCHIVED' : 'RESTORED', 
          shouldArchive ? 'Archived engagement' : 'Restored engagement'
        );
        addChangeLogToState(engagementId, changeLog);
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, [client, updateEngagementInState, logChangeAsync]);

  // Delete engagement
  const handleDeleteEngagement = useCallback(async function(engagement, setDeleteModalEngagement, setIsDeleting, getOwnerInfoFn) {
    if (!engagement || !currentUser) return;

    setIsDeleting(true);

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      // Gather cascade info BEFORE deletion for the audit log
      const cascadeInfo = getCascadeInfo(engagement);
      const cascadeSummary = buildCascadeSummary(cascadeInfo);
      const ownerNames = getOwnerNamesString(engagement, getOwnerInfoFn || function() { return { name: 'Unknown' }; });

      // Delete all related records first
      // Delete phases
      const phases = await dataClient.models.Phase.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (let i = 0; i < phases.data.length; i++) {
        await dataClient.models.Phase.delete({ id: phases.data[i].id });
      }

      // Delete activities and comments
      const activities = await dataClient.models.Activity.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (let j = 0; j < activities.data.length; j++) {
        const comments = await dataClient.models.Comment.list({
          filter: { activityId: { eq: activities.data[j].id } }
        });
        for (let k = 0; k < comments.data.length; k++) {
          await dataClient.models.Comment.delete({ id: comments.data[k].id });
        }
        await dataClient.models.Activity.delete({ id: activities.data[j].id });
      }

      // Delete change logs
      const changeLogs = await dataClient.models.ChangeLog.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (let l = 0; l < changeLogs.data.length; l++) {
        await dataClient.models.ChangeLog.delete({ id: changeLogs.data[l].id });
      }

      // Delete ownership records
      const owners = await dataClient.models.EngagementOwner.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (let m = 0; m < owners.data.length; m++) {
        await dataClient.models.EngagementOwner.delete({ id: owners.data[m].id });
      }

      // Delete phase notes
      const notes = await dataClient.models.PhaseNote.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (let n = 0; n < notes.data.length; n++) {
        await dataClient.models.PhaseNote.delete({ id: notes.data[n].id });
      }

      // Finally delete the engagement
      await dataClient.models.Engagement.delete({ id: engagement.id });

      // Create DeletionLog entry AFTER successful deletion
      // Calculate expiresAt: current time + 365 days, as Unix timestamp in seconds
      const now = new Date();
      const expiresAt = Math.floor(now.getTime() / 1000) + (365 * 24 * 60 * 60);

      await dataClient.models.DeletionLog.create({
        deletedById: currentUser.id,
        deletedByName: currentUser.name,
        companyName: engagement.company,
        contactName: engagement.contactName,
        industry: engagement.industry || null,
        currentPhase: engagement.currentPhase ? (phaseLabels[engagement.currentPhase] || engagement.currentPhase) : null,
        ownerNames: ownerNames || null,
        cascadeSummary: cascadeSummary,
        engagementCreatedAt: engagement.startDate || null,
        expiresAt: expiresAt
      });

      setEngagements(function(prev) {
        return prev.filter(function(e) { return e.id !== engagement.id; });
      });

      setDeleteModalEngagement(null);
    } catch (error) {
      console.error('Error deleting engagement:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [client, setEngagements, currentUser, getCascadeInfo, buildCascadeSummary, getOwnerNamesString]);

  return {
    filteredEngagements: filteredEngagements,
    staleCount: staleCount,
    totalInViewMode: totalInViewMode,
    inProgressInViewMode: inProgressInViewMode,
    totalEverythingCount: totalEverythingCount,
    // Pipeline total stats
    pipelineTotal: pipelineStats.total,
    pipelineTotalFormatted: pipelineStats.formatted,
    pipelineDealsCount: pipelineStats.count,
    getCascadeInfo: getCascadeInfo,
    handleCreateEngagement: handleCreateEngagement,
    handleToggleArchive: handleToggleArchive,
    handleDeleteEngagement: handleDeleteEngagement
  };
};

export default useEngagementList;
