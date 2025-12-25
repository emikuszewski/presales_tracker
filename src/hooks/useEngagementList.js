import { useMemo, useCallback } from 'react';
import { phaseConfig } from '../constants';

var useEngagementList = function(params) {
  var engagements = params.engagements;
  var setEngagements = params.setEngagements;
  var currentUser = params.currentUser;
  var newEngagement = params.newEngagement;
  var setNewEngagement = params.setNewEngagement;
  var setView = params.setView;
  var selectedEngagementId = params.selectedEngagementId;
  var setSelectedEngagementId = params.setSelectedEngagementId;
  var updateEngagementInState = params.updateEngagementInState;
  var fetchAllData = params.fetchAllData;
  var logChangeAsync = params.logChangeAsync;
  var client = params.client;
  var filters = params.filters || {};

  var filterPhase = filters.filterPhase;
  var filterOwner = filters.filterOwner;
  var filterStale = filters.filterStale;
  var showArchived = filters.showArchived;
  var searchQuery = filters.searchQuery;
  var engagementAdminFilter = filters.engagementAdminFilter;
  var engagementAdminSearch = filters.engagementAdminSearch;

  // Compute filtered engagements for list view
  var filteredEngagements = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return [];
    
    var result = engagements.slice();

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

    // Filter by phase
    if (filterPhase && filterPhase !== 'all') {
      result = result.filter(function(e) {
        return e.currentPhase === filterPhase;
      });
    }

    // Filter by stale
    if (filterStale) {
      result = result.filter(function(e) {
        return e.isStale === true;
      });
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      var query = searchQuery.toLowerCase().trim();
      result = result.filter(function(e) {
        var companyMatch = e.company && e.company.toLowerCase().indexOf(query) !== -1;
        var contactMatch = e.contactName && e.contactName.toLowerCase().indexOf(query) !== -1;
        return companyMatch || contactMatch;
      });
    }

    // Sort by last activity (newest first)
    result.sort(function(a, b) {
      var dateA = a.lastActivity || a.startDate || '';
      var dateB = b.lastActivity || b.startDate || '';
      return dateB.localeCompare(dateA);
    });

    return result;
  }, [engagements, showArchived, filterOwner, filterPhase, filterStale, searchQuery, currentUser]);

  // Compute filtered engagements for admin view
  var filteredEngagementsAdmin = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return [];
    
    var result = engagements.slice();

    // Filter by admin filter
    if (engagementAdminFilter === 'active') {
      result = result.filter(function(e) { return e.isArchived !== true; });
    } else if (engagementAdminFilter === 'archived') {
      result = result.filter(function(e) { return e.isArchived === true; });
    }

    // Filter by admin search
    if (engagementAdminSearch && engagementAdminSearch.trim()) {
      var query = engagementAdminSearch.toLowerCase().trim();
      result = result.filter(function(e) {
        var companyMatch = e.company && e.company.toLowerCase().indexOf(query) !== -1;
        var contactMatch = e.contactName && e.contactName.toLowerCase().indexOf(query) !== -1;
        return companyMatch || contactMatch;
      });
    }

    return result;
  }, [engagements, engagementAdminFilter, engagementAdminSearch]);

  // Compute stale count (in current view mode)
  var staleCount = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    var relevantEngagements = engagements.filter(function(e) {
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
  }, [engagements, showArchived, filterOwner, currentUser]);

  // Total in view mode (before phase/stale/search filters)
  var totalInViewMode = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    var relevantEngagements = engagements.filter(function(e) {
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
  }, [engagements, showArchived, filterOwner, currentUser]);

  // In progress count in view mode
  var inProgressInViewMode = useMemo(function() {
    if (!engagements || !Array.isArray(engagements)) return 0;
    
    var relevantEngagements = engagements.filter(function(e) {
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
      var currentPhaseData = e.phases && e.phases[e.currentPhase];
      return currentPhaseData && currentPhaseData.status === 'IN_PROGRESS';
    }).length;
  }, [engagements, showArchived, filterOwner, currentUser]);

  // Get cascade info for delete modal
  var getCascadeInfo = useCallback(function(engagement) {
    if (!engagement) {
      return { phases: 0, activities: 0, comments: 0, changeLogs: 0, owners: 0 };
    }

    var phases = engagement.phases ? Object.keys(engagement.phases).length : 0;
    var activities = engagement.activities ? engagement.activities.length : 0;
    var comments = 0;
    if (engagement.activities) {
      engagement.activities.forEach(function(a) {
        if (a.comments) comments += a.comments.length;
      });
    }
    var changeLogs = engagement.changeLogs ? engagement.changeLogs.length : 0;
    var owners = engagement.ownerIds ? engagement.ownerIds.length : 0;

    return {
      phases: phases,
      activities: activities,
      comments: comments,
      changeLogs: changeLogs,
      owners: owners
    };
  }, []);

  // Create new engagement
  var handleCreateEngagement = useCallback(async function() {
    if (!currentUser || !newEngagement.company || !newEngagement.contactName) {
      return;
    }

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      var today = new Date().toISOString().split('T')[0];

      var result = await dataClient.models.Engagement.create({
        company: newEngagement.company,
        contactName: newEngagement.contactName,
        contactEmail: newEngagement.contactEmail || null,
        contactPhone: newEngagement.contactPhone || null,
        industry: newEngagement.industry || 'TECHNOLOGY',
        dealSize: newEngagement.dealSize || null,
        currentPhase: 'DISCOVER',
        startDate: today,
        lastActivity: today,
        ownerId: currentUser.id,
        isArchived: false,
        salesforceId: newEngagement.salesforceId || null,
        salesforceUrl: newEngagement.salesforceUrl || null,
        jiraTicket: newEngagement.jiraTicket || null,
        jiraUrl: newEngagement.jiraUrl || null,
        slackChannel: newEngagement.slackChannel || null,
        slackUrl: newEngagement.slackUrl || null,
        driveFolderName: newEngagement.driveFolderName || null,
        driveFolderUrl: newEngagement.driveFolderUrl || null,
        docsName: newEngagement.docsName || null,
        docsUrl: newEngagement.docsUrl || null,
        slidesName: newEngagement.slidesName || null,
        slidesUrl: newEngagement.slidesUrl || null,
        sheetsName: newEngagement.sheetsName || null,
        sheetsUrl: newEngagement.sheetsUrl || null
      });

      var createdEngagement = result.data;

      // Create phases
      var phases = {};
      for (var i = 0; i < phaseConfig.length; i++) {
        var phase = phaseConfig[i];
        var phaseResult = await dataClient.models.Phase.create({
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
      var ownerIds = newEngagement.ownerIds && newEngagement.ownerIds.length > 0 
        ? newEngagement.ownerIds 
        : [currentUser.id];

      for (var j = 0; j < ownerIds.length; j++) {
        await dataClient.models.EngagementOwner.create({
          engagementId: createdEngagement.id,
          teamMemberId: ownerIds[j],
          role: j === 0 ? 'primary' : 'secondary',
          addedAt: new Date().toISOString()
        });
      }

      // Build enriched engagement
      var enrichedEngagement = Object.assign({}, createdEngagement, {
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
        hasSystemOwner: false
      });

      setEngagements(function(prev) { return [enrichedEngagement].concat(prev); });

      if (logChangeAsync) {
        logChangeAsync(createdEngagement.id, 'CREATED', 'Created engagement for ' + newEngagement.company);
      }

      // Reset form and navigate
      setNewEngagement({
        company: '', contactName: '', contactEmail: '', contactPhone: '', 
        industry: 'TECHNOLOGY', dealSize: '', ownerIds: currentUser ? [currentUser.id] : [],
        salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', 
        driveFolderName: '', driveFolderUrl: '',
        docsName: '', docsUrl: '',
        slidesName: '', slidesUrl: '',
        sheetsName: '', sheetsUrl: '',
        slackChannel: '', slackUrl: ''
      });
      setView('list');
    } catch (error) {
      console.error('Error creating engagement:', error);
    }
  }, [currentUser, newEngagement, setNewEngagement, setView, setEngagements, logChangeAsync, client]);

  // Toggle archive status
  var handleToggleArchive = useCallback(async function(engagementId, shouldArchive) {
    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.Engagement.update({
        id: engagementId,
        isArchived: shouldArchive
      });

      updateEngagementInState(engagementId, { isArchived: shouldArchive });

      if (logChangeAsync) {
        logChangeAsync(
          engagementId, 
          shouldArchive ? 'ARCHIVED' : 'RESTORED', 
          shouldArchive ? 'Archived engagement' : 'Restored engagement'
        );
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, [client, updateEngagementInState, logChangeAsync]);

  // Delete engagement
  var handleDeleteEngagement = useCallback(async function(engagement, setDeleteModalEngagement, setIsDeleting) {
    if (!engagement) return;

    setIsDeleting(true);

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Delete all related records first
      // Delete phases
      var phases = await dataClient.models.Phase.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (var i = 0; i < phases.data.length; i++) {
        await dataClient.models.Phase.delete({ id: phases.data[i].id });
      }

      // Delete activities and comments
      var activities = await dataClient.models.Activity.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (var j = 0; j < activities.data.length; j++) {
        var comments = await dataClient.models.Comment.list({
          filter: { activityId: { eq: activities.data[j].id } }
        });
        for (var k = 0; k < comments.data.length; k++) {
          await dataClient.models.Comment.delete({ id: comments.data[k].id });
        }
        await dataClient.models.Activity.delete({ id: activities.data[j].id });
      }

      // Delete change logs
      var changeLogs = await dataClient.models.ChangeLog.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (var l = 0; l < changeLogs.data.length; l++) {
        await dataClient.models.ChangeLog.delete({ id: changeLogs.data[l].id });
      }

      // Delete ownership records
      var owners = await dataClient.models.EngagementOwner.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (var m = 0; m < owners.data.length; m++) {
        await dataClient.models.EngagementOwner.delete({ id: owners.data[m].id });
      }

      // Delete phase notes
      var notes = await dataClient.models.PhaseNote.list({
        filter: { engagementId: { eq: engagement.id } }
      });
      for (var n = 0; n < notes.data.length; n++) {
        await dataClient.models.PhaseNote.delete({ id: notes.data[n].id });
      }

      // Finally delete the engagement
      await dataClient.models.Engagement.delete({ id: engagement.id });

      setEngagements(function(prev) {
        return prev.filter(function(e) { return e.id !== engagement.id; });
      });

      setDeleteModalEngagement(null);
    } catch (error) {
      console.error('Error deleting engagement:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [client, setEngagements]);

  return {
    filteredEngagements: filteredEngagements,
    filteredEngagementsAdmin: filteredEngagementsAdmin,
    staleCount: staleCount,
    totalInViewMode: totalInViewMode,
    inProgressInViewMode: inProgressInViewMode,
    getCascadeInfo: getCascadeInfo,
    handleCreateEngagement: handleCreateEngagement,
    handleToggleArchive: handleToggleArchive,
    handleDeleteEngagement: handleDeleteEngagement
  };
};

export default useEngagementList;
