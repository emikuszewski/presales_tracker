import { useCallback, useMemo } from 'react';
import { getTodayDate } from '../utils';
import { phaseConfig, industryLabels } from '../constants';

/**
 * Hook for engagement list operations (create, archive, delete) and filtering.
 * 
 * @param {Object} params - Hook parameters
 * @param {Array} params.engagements - All engagements
 * @param {Function} params.setEngagements - Setter for engagements
 * @param {Object} params.currentUser - Current logged-in user
 * @param {Object} params.newEngagement - New engagement form data
 * @param {Function} params.setNewEngagement - Setter for new engagement form
 * @param {Function} params.setView - Setter for current view
 * @param {string|null} params.selectedEngagementId - Currently selected engagement ID
 * @param {Function} params.setSelectedEngagementId - Setter for selected engagement ID
 * @param {Function} params.updateEngagementInState - Function to update single engagement
 * @param {Function} params.fetchAllData - Function to refetch all data
 * @param {Function} params.logChangeAsync - Function to log changes
 * @param {Object} params.client - Amplify data client
 * @param {Object} params.filters - Current filter state
 * @returns {Object} List operations and filtered data
 */
const useEngagementList = ({
  engagements,
  setEngagements,
  currentUser,
  newEngagement,
  setNewEngagement,
  setView,
  selectedEngagementId,
  setSelectedEngagementId,
  updateEngagementInState,
  fetchAllData,
  logChangeAsync,
  client,
  filters
}) => {
  const { 
    filterPhase, 
    filterOwner, 
    filterStale, 
    showArchived, 
    searchQuery,
    engagementAdminFilter,
    engagementAdminSearch
  } = filters;

  // MEMOIZED: Filtered engagements for main list view
  const filteredEngagements = useMemo(() => {
    return engagements
      .filter(e => {
        if (showArchived !== (e.isArchived || false)) return false;
        if (filterPhase !== 'all' && e.currentPhase !== filterPhase) return false;
        if (filterStale && !e.isStale) return false;
        
        if (filterOwner === 'mine') {
          const isOwner = e.ownerIds?.includes(currentUser?.id) || e.ownerId === currentUser?.id;
          if (!isOwner) return false;
        } else if (filterOwner !== 'all') {
          const isOwner = e.ownerIds?.includes(filterOwner) || e.ownerId === filterOwner;
          if (!isOwner) return false;
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesCompany = e.company.toLowerCase().includes(query);
          const matchesContact = e.contactName.toLowerCase().includes(query);
          const matchesIndustry = (industryLabels[e.industry] || '').toLowerCase().includes(query);
          if (!matchesCompany && !matchesContact && !matchesIndustry) return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.lastActivity || b.startDate) - new Date(a.lastActivity || a.startDate));
  }, [engagements, showArchived, filterPhase, filterStale, filterOwner, currentUser?.id, searchQuery]);

  // MEMOIZED: Filtered engagements for admin view
  const filteredEngagementsAdmin = useMemo(() => {
    return engagements
      .filter(e => {
        // Filter by status
        if (engagementAdminFilter === 'active' && e.isArchived) return false;
        if (engagementAdminFilter === 'archived' && !e.isArchived) return false;
        
        // Search filter
        if (engagementAdminSearch) {
          const query = engagementAdminSearch.toLowerCase();
          const matchesCompany = e.company.toLowerCase().includes(query);
          const matchesContact = e.contactName.toLowerCase().includes(query);
          if (!matchesCompany && !matchesContact) return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  }, [engagements, engagementAdminFilter, engagementAdminSearch]);

  // MEMOIZED: Stale count
  const staleCount = useMemo(() => {
    return engagements.filter(e => 
      !e.isArchived && e.isStale && 
      (filterOwner === 'all' || e.ownerIds?.includes(currentUser?.id) || e.ownerId === currentUser?.id)
    ).length;
  }, [engagements, filterOwner, currentUser?.id]);

  // Get cascade info for an engagement (for delete confirmation)
  const getCascadeInfo = useCallback((engagement) => {
    if (!engagement) return { phases: 0, activities: 0, comments: 0, changeLogs: 0, owners: 0 };
    
    const phaseCount = Object.keys(engagement.phases || {}).filter(k => engagement.phases[k]?.id).length;
    const activityCount = engagement.activities?.length || 0;
    const commentCount = engagement.activities?.reduce((sum, a) => sum + (a.comments?.length || 0), 0) || 0;
    const changeLogCount = engagement.changeLogs?.length || 0;
    const ownerCount = engagement.ownershipRecords?.length || engagement.ownerIds?.length || 0;
    
    return {
      phases: phaseCount,
      activities: activityCount,
      comments: commentCount,
      changeLogs: changeLogCount,
      owners: ownerCount
    };
  }, []);

  // Create engagement
  const handleCreateEngagement = useCallback(async () => {
    if (!newEngagement.company || !newEngagement.contactName) return;
    if (newEngagement.ownerIds.length === 0) return;
    
    try {
      const today = getTodayDate();
      
      const { data: engagement } = await client.models.Engagement.create({
        company: newEngagement.company,
        contactName: newEngagement.contactName,
        contactEmail: newEngagement.contactEmail || null,
        contactPhone: newEngagement.contactPhone || null,
        industry: newEngagement.industry,
        dealSize: newEngagement.dealSize || null,
        currentPhase: 'DISCOVER',
        startDate: today,
        lastActivity: today,
        ownerId: newEngagement.ownerIds[0],
        salesforceId: newEngagement.salesforceId || null,
        salesforceUrl: newEngagement.salesforceUrl || null,
        jiraTicket: newEngagement.jiraTicket || null,
        jiraUrl: newEngagement.jiraUrl || null,
        driveFolderName: newEngagement.driveFolderName || null,
        driveFolderUrl: newEngagement.driveFolderUrl || null,
        docsName: newEngagement.docsName || null,
        docsUrl: newEngagement.docsUrl || null,
        slidesName: newEngagement.slidesName || null,
        slidesUrl: newEngagement.slidesUrl || null,
        sheetsName: newEngagement.sheetsName || null,
        sheetsUrl: newEngagement.sheetsUrl || null,
        slackChannel: newEngagement.slackChannel || null,
        slackUrl: newEngagement.slackUrl || null,
        isArchived: false
      });
      
      for (const ownerId of newEngagement.ownerIds) {
        await client.models.EngagementOwner.create({
          engagementId: engagement.id,
          teamMemberId: ownerId,
          role: ownerId === newEngagement.ownerIds[0] ? 'primary' : 'secondary',
          addedAt: new Date().toISOString()
        });
      }
      
      for (const phase of phaseConfig) {
        await client.models.Phase.create({
          engagementId: engagement.id,
          phaseType: phase.id,
          status: phase.id === 'DISCOVER' ? 'IN_PROGRESS' : 'PENDING',
          completedDate: null,
          notes: null,
          links: null
        });
      }
      
      logChangeAsync(engagement.id, 'CREATED', `Created engagement for ${newEngagement.company}`);
      
      await fetchAllData(currentUser?.id);
      
      setNewEngagement({
        company: '', contactName: '', contactEmail: '', contactPhone: '',
        industry: 'TECHNOLOGY', dealSize: '', ownerIds: [currentUser?.id],
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
  }, [newEngagement, currentUser, setNewEngagement, setView, fetchAllData, logChangeAsync, client]);

  // Toggle archive status
  const handleToggleArchive = useCallback(async (engagementId, archive) => {
    const engagement = engagements.find(e => e.id === engagementId);
    if (!engagement) return;
    
    const previousValue = engagement.isArchived;
    
    // Optimistic update
    updateEngagementInState(engagementId, { isArchived: archive });
    
    if (selectedEngagementId === engagementId) {
      setSelectedEngagementId(null);
      setView('list');
    }
    
    try {
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: archive
      });
      
      logChangeAsync(
        engagementId, 
        archive ? 'ARCHIVED' : 'RESTORED', 
        archive ? 'Engagement archived' : 'Engagement restored'
      );
      
    } catch (error) {
      console.error('Error archiving engagement:', error);
      // Rollback
      updateEngagementInState(engagementId, { isArchived: previousValue });
    }
  }, [engagements, selectedEngagementId, setSelectedEngagementId, setView, updateEngagementInState, logChangeAsync, client]);

  // Delete engagement with cascade
  const handleDeleteEngagement = useCallback(async (deleteModalEngagement, setDeleteModalEngagement, setIsDeleting) => {
    if (!deleteModalEngagement || !currentUser?.isAdmin) return;
    
    setIsDeleting(true);
    
    try {
      const engagementId = deleteModalEngagement.id;
      
      // 1. Delete all comments for all activities
      for (const activity of (deleteModalEngagement.activities || [])) {
        for (const comment of (activity.comments || [])) {
          await client.models.Comment.delete({ id: comment.id });
        }
      }
      
      // 2. Delete all activities
      for (const activity of (deleteModalEngagement.activities || [])) {
        await client.models.Activity.delete({ id: activity.id });
      }
      
      // 3. Delete all phases
      for (const phaseKey of Object.keys(deleteModalEngagement.phases || {})) {
        const phase = deleteModalEngagement.phases[phaseKey];
        if (phase?.id) {
          await client.models.Phase.delete({ id: phase.id });
        }
      }
      
      // 4. Delete all ownership records
      for (const ownership of (deleteModalEngagement.ownershipRecords || [])) {
        await client.models.EngagementOwner.delete({ id: ownership.id });
      }
      
      // 5. Delete all change logs
      for (const log of (deleteModalEngagement.changeLogs || [])) {
        await client.models.ChangeLog.delete({ id: log.id });
      }
      
      // 6. Delete engagement views
      const { data: views } = await client.models.EngagementView.list({
        filter: { engagementId: { eq: engagementId } }
      });
      for (const view of views) {
        await client.models.EngagementView.delete({ id: view.id });
      }
      
      // 7. Finally, delete the engagement itself
      await client.models.Engagement.delete({ id: engagementId });
      
      // Update local state
      setEngagements(prev => prev.filter(e => e.id !== engagementId));
      setDeleteModalEngagement(null);
      
    } catch (error) {
      console.error('Error deleting engagement:', error);
      alert('Error deleting engagement: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  }, [currentUser, setEngagements, client]);

  return {
    // Filtered/computed data
    filteredEngagements,
    filteredEngagementsAdmin,
    staleCount,
    
    // Operations
    getCascadeInfo,
    handleCreateEngagement,
    handleToggleArchive,
    handleDeleteEngagement
  };
};

export default useEngagementList;
