import React, { useState, useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';

// Generate typed client
const client = generateClient();

// Industry display mapping
const industryLabels = {
  FINANCIAL_SERVICES: 'Financial Services',
  HEALTHCARE: 'Healthcare',
  TECHNOLOGY: 'Technology',
  RETAIL: 'Retail',
  MANUFACTURING: 'Manufacturing',
  GOVERNMENT: 'Government'
};

const phaseLabels = {
  DISCOVER: 'Discover',
  DESIGN: 'Design',
  DEMONSTRATE: 'Demonstrate',
  VALIDATE: 'Validate',
  ENABLE: 'Enable'
};

const activityTypeLabels = {
  MEETING: 'Meeting',
  DEMO: 'Demo',
  DOCUMENT: 'Document',
  EMAIL: 'Email',
  SUPPORT: 'Support',
  WORKSHOP: 'Workshop',
  CALL: 'Call'
};

const phaseConfig = [
  { id: "DISCOVER", label: "Discover", description: "Technical qualification & requirements gathering" },
  { id: "DESIGN", label: "Design", description: "Solution architecture & POC scoping" },
  { id: "DEMONSTRATE", label: "Demonstrate", description: "Demos, workshops & technical deep-dives" },
  { id: "VALIDATE", label: "Validate", description: "POC execution & technical proof" },
  { id: "ENABLE", label: "Enable", description: "Handoff, training & success planning" }
];

const activityTypes = ['MEETING', 'DEMO', 'DOCUMENT', 'EMAIL', 'SUPPORT', 'WORKSHOP', 'CALL'];
const industries = ['FINANCIAL_SERVICES', 'HEALTHCARE', 'TECHNOLOGY', 'RETAIL', 'MANUFACTURING', 'GOVERNMENT'];

// Admin email - hardcoded for Phase 1
const ADMIN_EMAIL = 'edward.mikuszewski@plainid.com';
const ALLOWED_DOMAIN = 'plainid.com';

// Helper to generate initials from name
const generateInitials = (name) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Main App Component (inside Authenticator)
function PresalesTracker() {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [view, setView] = useState('list');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ date: getTodayDate(), type: 'MEETING', description: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newComment, setNewComment] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'TECHNOLOGY', dealSize: '', ownerIds: [],
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
  });

  // Initialize user and fetch data
  useEffect(() => {
    initializeUser();
  }, [user]);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Get user attributes
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      const givenName = attributes.given_name || '';
      const familyName = attributes.family_name || '';
      const fullName = `${givenName} ${familyName}`.trim() || email.split('@')[0];
      
      // Check if team member exists
      const { data: existingMembers } = await client.models.TeamMember.list({
        filter: { email: { eq: email } }
      });
      
      let member;
      if (existingMembers.length > 0) {
        member = existingMembers[0];
      } else {
        // Create new team member
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const { data: newMember } = await client.models.TeamMember.create({
          email: email,
          name: fullName,
          initials: generateInitials(fullName),
          isAdmin: isAdmin,
          isActive: true
        });
        member = newMember;
      }
      
      setCurrentUser(member);
      setNewEngagement(prev => ({ ...prev, ownerIds: [member.id] }));
      
      // Fetch all data
      await fetchAllData();
      
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch team members
      const { data: members } = await client.models.TeamMember.list({
        filter: { isActive: { eq: true } }
      });
      setTeamMembers(members);
      
      // Fetch all engagements with related data
      const { data: engagementData } = await client.models.Engagement.list();
      
      // Fetch phases, activities, owners, and comments for each engagement
      const enrichedEngagements = await Promise.all(
        engagementData.map(async (eng) => {
          const { data: phases } = await client.models.Phase.list({
            filter: { engagementId: { eq: eng.id } }
          });
          const { data: activities } = await client.models.Activity.list({
            filter: { engagementId: { eq: eng.id } }
          });
          
          // Fetch owners (Phase 2)
          const { data: ownershipRecords } = await client.models.EngagementOwner.list({
            filter: { engagementId: { eq: eng.id } }
          });
          
          // Fetch comments for each activity (Phase 2)
          const activitiesWithComments = await Promise.all(
            activities.map(async (activity) => {
              const { data: comments } = await client.models.Comment.list({
                filter: { activityId: { eq: activity.id } }
              });
              return {
                ...activity,
                comments: comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              };
            })
          );
          
          // Convert phases array to object keyed by phaseType
          const phasesObj = {};
          phaseConfig.forEach(p => {
            const existingPhase = phases.find(ph => ph.phaseType === p.id);
            phasesObj[p.id] = existingPhase || {
              phaseType: p.id,
              status: 'PENDING',
              completedDate: null,
              notes: '',
              links: []
            };
          });
          
          // Get owner IDs from ownership records
          const ownerIds = ownershipRecords.map(o => o.teamMemberId);
          
          // Backwards compatibility: include legacy ownerId if no ownership records
          if (ownerIds.length === 0 && eng.ownerId) {
            ownerIds.push(eng.ownerId);
          }
          
          return {
            ...eng,
            phases: phasesObj,
            activities: activitiesWithComments.sort((a, b) => new Date(b.date) - new Date(a.date)),
            ownerIds: ownerIds,
            ownershipRecords: ownershipRecords
          };
        })
      );
      
      setEngagements(enrichedEngagements);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getOwnerInfo = (ownerId) => {
    const member = teamMembers.find(m => m.id === ownerId);
    return member || { name: 'Unknown', initials: '?' };
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETE': return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Complete' };
      case 'IN_PROGRESS': return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Pending' };
    }
  };

  // Check if current user is an owner of the engagement
  const isCurrentUserOwner = (engagement) => {
    return engagement.ownerIds?.includes(currentUser?.id) || engagement.ownerId === currentUser?.id;
  };

  // Filter engagements
  const filteredEngagements = engagements
    .filter(e => {
      // Archive filter
      if (showArchived !== (e.isArchived || false)) return false;
      
      // Phase filter
      if (filterPhase !== 'all' && e.currentPhase !== filterPhase) return false;
      
      // Owner filter - check ownerIds array for co-owners
      if (filterOwner === 'mine') {
        const isOwner = e.ownerIds?.includes(currentUser?.id) || e.ownerId === currentUser?.id;
        if (!isOwner) return false;
      } else if (filterOwner !== 'all') {
        const isOwner = e.ownerIds?.includes(filterOwner) || e.ownerId === filterOwner;
        if (!isOwner) return false;
      }
      
      // Search filter
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

  // Create new engagement with co-owners
  const handleCreateEngagement = async () => {
    if (!newEngagement.company || !newEngagement.contactName) return;
    if (newEngagement.ownerIds.length === 0) return;
    
    try {
      const today = getTodayDate();
      
      // Create engagement (use first owner as legacy ownerId for backwards compatibility)
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
        ownerId: newEngagement.ownerIds[0], // Legacy field
        salesforceId: newEngagement.salesforceId || null,
        salesforceUrl: newEngagement.salesforceUrl || null,
        jiraTicket: newEngagement.jiraTicket || null,
        jiraUrl: newEngagement.jiraUrl || null,
        slackChannel: newEngagement.slackChannel || null,
        isArchived: false
      });
      
      // Create ownership records for all owners (Phase 2)
      for (const ownerId of newEngagement.ownerIds) {
        await client.models.EngagementOwner.create({
          engagementId: engagement.id,
          teamMemberId: ownerId,
          role: ownerId === newEngagement.ownerIds[0] ? 'primary' : 'secondary',
          addedAt: new Date().toISOString()
        });
      }
      
      // Create initial phases
      for (const phase of phaseConfig) {
        await client.models.Phase.create({
          engagementId: engagement.id,
          phaseType: phase.id,
          status: phase.id === 'DISCOVER' ? 'IN_PROGRESS' : 'PENDING',
          completedDate: null,
          notes: '',
          links: []
        });
      }
      
      // Refresh data
      await fetchAllData();
      
      // Reset form
      setNewEngagement({
        company: '', contactName: '', contactEmail: '', contactPhone: '',
        industry: 'TECHNOLOGY', dealSize: '', ownerIds: [currentUser?.id],
        salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
      });
      setView('list');
      
    } catch (error) {
      console.error('Error creating engagement:', error);
    }
  };

  // Add owner to engagement
  const handleAddOwner = async (teamMemberId) => {
    if (!selectedEngagement || selectedEngagement.ownerIds?.includes(teamMemberId)) return;
    
    try {
      await client.models.EngagementOwner.create({
        engagementId: selectedEngagement.id,
        teamMemberId: teamMemberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });
      
      await fetchAllData();
      
      // Update selected engagement
      setSelectedEngagement(prev => ({
        ...prev,
        ownerIds: [...(prev.ownerIds || []), teamMemberId]
      }));
      
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  };

  // Remove owner from engagement
  const handleRemoveOwner = async (teamMemberId) => {
    if (!selectedEngagement) return;
    
    // Don't allow removing the last owner
    if (selectedEngagement.ownerIds?.length <= 1) {
      alert('Cannot remove the last owner. Add another owner first.');
      return;
    }
    
    try {
      // Find the ownership record
      const ownershipRecord = selectedEngagement.ownershipRecords?.find(
        o => o.teamMemberId === teamMemberId
      );
      
      if (ownershipRecord) {
        await client.models.EngagementOwner.delete({ id: ownershipRecord.id });
      }
      
      await fetchAllData();
      
      // Update selected engagement
      setSelectedEngagement(prev => ({
        ...prev,
        ownerIds: prev.ownerIds?.filter(id => id !== teamMemberId) || []
      }));
      
    } catch (error) {
      console.error('Error removing owner:', error);
    }
  };

  // Add activity
  const handleAddActivity = async () => {
    if (!newActivity.date || !newActivity.description || !selectedEngagement) return;
    
    try {
      await client.models.Activity.create({
        engagementId: selectedEngagement.id,
        date: newActivity.date,
        type: newActivity.type,
        description: newActivity.description
      });
      
      // Update last activity on engagement
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: newActivity.date
      });
      
      await fetchAllData();
      
      // Update selected engagement
      const updated = engagements.find(e => e.id === selectedEngagement.id);
      if (updated) {
        setSelectedEngagement(updated);
      }
      
      setNewActivity({ date: getTodayDate(), type: 'MEETING', description: '' });
      setShowActivityModal(false);
      
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  // Add comment to activity (Phase 2)
  const handleAddComment = async (activityId) => {
    const commentText = newComment[activityId];
    if (!commentText?.trim() || !currentUser) return;
    
    try {
      await client.models.Comment.create({
        activityId: activityId,
        authorId: currentUser.id,
        text: commentText.trim()
      });
      
      await fetchAllData();
      
      // Clear comment input
      setNewComment(prev => ({ ...prev, [activityId]: '' }));
      
      // Refresh selected engagement
      const updated = engagements.find(e => e.id === selectedEngagement?.id);
      if (updated) {
        setSelectedEngagement(updated);
      }
      
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Delete comment (Phase 2)
  const handleDeleteComment = async (commentId) => {
    try {
      await client.models.Comment.delete({ id: commentId });
      await fetchAllData();
      
      // Refresh selected engagement
      const updated = engagements.find(e => e.id === selectedEngagement?.id);
      if (updated) {
        setSelectedEngagement(updated);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Toggle activity expansion for comments
  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  // Update phase
  const handleUpdatePhase = async (phaseId, updates) => {
    if (!selectedEngagement) return;
    
    try {
      const existingPhase = selectedEngagement.phases[phaseId];
      
      if (existingPhase.id) {
        // Update existing phase
        await client.models.Phase.update({
          id: existingPhase.id,
          ...updates,
          completedDate: updates.status === 'COMPLETE' ? getTodayDate() : existingPhase.completedDate
        });
      } else {
        // Create new phase record
        await client.models.Phase.create({
          engagementId: selectedEngagement.id,
          phaseType: phaseId,
          status: updates.status || 'PENDING',
          completedDate: updates.status === 'COMPLETE' ? getTodayDate() : null,
          notes: updates.notes || '',
          links: updates.links || []
        });
      }
      
      // Update current phase on engagement if completed
      if (updates.status === 'COMPLETE') {
        const phaseIndex = phaseConfig.findIndex(p => p.id === phaseId);
        if (phaseIndex < phaseConfig.length - 1) {
          await client.models.Engagement.update({
            id: selectedEngagement.id,
            currentPhase: phaseConfig[phaseIndex + 1].id
          });
        }
      }
      
      await fetchAllData();
      
      // Refresh selected engagement
      const refreshed = engagements.find(e => e.id === selectedEngagement.id);
      if (refreshed) {
        setSelectedEngagement(refreshed);
      }
      
      setShowPhaseModal(null);
      
    } catch (error) {
      console.error('Error updating phase:', error);
    }
  };

  // Add link to phase
  const handleAddLink = async (phaseId) => {
    if (!newLink.title || !newLink.url || !selectedEngagement) return;
    
    try {
      const existingPhase = selectedEngagement.phases[phaseId];
      const currentLinks = Array.isArray(existingPhase.links) ? existingPhase.links : [];
      const updatedLinks = [...currentLinks, { title: newLink.title, url: newLink.url }];
      
      if (existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          links: updatedLinks
        });
      } else {
        await client.models.Phase.create({
          engagementId: selectedEngagement.id,
          phaseType: phaseId,
          status: 'PENDING',
          completedDate: null,
          notes: '',
          links: updatedLinks
        });
      }
      
      await fetchAllData();
      
      setNewLink({ title: '', url: '' });
      setShowLinkModal(null);
      
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  // Remove link from phase
  const handleRemoveLink = async (phaseId, linkIndex) => {
    if (!selectedEngagement) return;
    
    try {
      const existingPhase = selectedEngagement.phases[phaseId];
      const currentLinks = Array.isArray(existingPhase.links) ? existingPhase.links : [];
      const updatedLinks = currentLinks.filter((_, i) => i !== linkIndex);
      
      if (existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          links: updatedLinks
        });
      }
      
      await fetchAllData();
      
    } catch (error) {
      console.error('Error removing link:', error);
    }
  };

  // Update integrations
  const handleUpdateIntegrations = async (updates) => {
    if (!selectedEngagement) return;
    
    try {
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        ...updates
      });
      
      await fetchAllData();
      setShowIntegrationsModal(false);
      
    } catch (error) {
      console.error('Error updating integrations:', error);
    }
  };

  // Archive/Restore engagement
  const handleToggleArchive = async (engagementId, archive) => {
    try {
      await client.models.Engagement.update({
        id: engagementId,
        isArchived: archive
      });
      
      await fetchAllData();
      
      if (selectedEngagement?.id === engagementId) {
        setSelectedEngagement(null);
        setView('list');
      }
      
    } catch (error) {
      console.error('Error archiving engagement:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ========== OWNERS DISPLAY COMPONENT ==========
  const OwnersDisplay = ({ ownerIds, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    const overlapClass = size === 'sm' ? '-ml-2' : '-ml-3';
    
    return (
      <div className="flex items-center">
        {ownerIds?.slice(0, 3).map((ownerId, index) => {
          const owner = getOwnerInfo(ownerId);
          const isCurrentUser = ownerId === currentUser?.id;
          return (
            <div
              key={ownerId}
              className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white ${
                isCurrentUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              } ${index > 0 ? overlapClass : ''}`}
              title={owner.name}
              style={{ zIndex: 10 - index }}
            >
              {owner.initials}
            </div>
          );
        })}
        {ownerIds?.length > 3 && (
          <div className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white bg-gray-200 text-gray-600 ${overlapClass}`}>
            +{ownerIds.length - 3}
          </div>
        )}
      </div>
    );
  };

  // ========== LIST VIEW ==========
  const ListView = () => (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {showArchived ? 'Archived Engagements' : 
              filterOwner === 'mine' ? 'My Engagements' : 
              filterOwner === 'all' ? 'All Team Engagements' : 
              `${getOwnerInfo(filterOwner).name}'s Engagements`}
          </h2>
          <p className="text-gray-500 mt-1">
            {filteredEngagements.length} engagement{filteredEngagements.length !== 1 ? 's' : ''}
            {!showArchived && ` · ${filteredEngagements.filter(e => e.phases[e.currentPhase]?.status === 'IN_PROGRESS').length} in progress`}
          </p>
        </div>
        {!showArchived && (
          <button 
            onClick={() => setView('new')}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            + New Engagement
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by company, contact, or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Active/Archived Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !showArchived ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showArchived ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {!showArchived && (
        <>
          {/* Team Filter */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">View</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterOwner('mine')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterOwner === 'mine' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                My Engagements
              </button>
              <button
                onClick={() => setFilterOwner('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterOwner === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Team
              </button>
              <div className="w-px bg-gray-200 mx-2" />
              {teamMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => setFilterOwner(member.id)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    filterOwner === member.id 
                      ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={member.name}
                >
                  {member.initials}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilterPhase('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterPhase === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Phases
            </button>
            {phaseConfig.map(phase => (
              <button
                key={phase.id}
                onClick={() => setFilterPhase(phase.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterPhase === phase.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Engagement List */}
      <div className="space-y-3">
        {filteredEngagements.map(engagement => (
          <div
            key={engagement.id}
            onClick={() => { setSelectedEngagement(engagement); setView('detail'); }}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <OwnersDisplay ownerIds={engagement.ownerIds} size="md" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{engagement.company}</h3>
                  <p className="text-sm text-gray-500">{engagement.contactName} · {industryLabels[engagement.industry] || engagement.industry}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">{engagement.dealSize || '—'}</p>
                <p className="text-xs text-gray-400">Last activity: {engagement.lastActivity || engagement.startDate}</p>
              </div>
            </div>
            
            {/* Integration badges */}
            {(engagement.salesforceId || engagement.jiraTicket) && (
              <div className="flex gap-2 mb-3">
                {engagement.salesforceId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    SF
                  </span>
                )}
                {engagement.jiraTicket && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {engagement.jiraTicket}
                  </span>
                )}
              </div>
            )}
            
            {/* Phase Progress */}
            <div className="flex items-center gap-1">
              {phaseConfig.map((phase, index) => {
                const phaseData = engagement.phases[phase.id];
                const status = phaseData?.status || 'PENDING';
                return (
                  <React.Fragment key={phase.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <span className={`text-xs font-medium ${
                        status === 'COMPLETE' ? 'text-emerald-700' : 
                        status === 'IN_PROGRESS' ? 'text-blue-700' : 'text-gray-400'
                      }`}>
                        {phase.label}
                      </span>
                    </div>
                    {index < phaseConfig.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${
                        status === 'COMPLETE' ? 'bg-emerald-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
        
        {filteredEngagements.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {showArchived ? 'No archived engagements' : 'No engagements found with current filters'}
          </div>
        )}
      </div>
    </div>
  );

  // ========== DETAIL VIEW ==========
  const DetailView = () => {
    if (!selectedEngagement) return null;
    
    // Refresh selected engagement from state when engagements update
    useEffect(() => {
      const updated = engagements.find(e => e.id === selectedEngagement.id);
      if (updated) {
        setSelectedEngagement(updated);
      }
    }, [engagements]);
    
    return (
      <div>
        {/* Back Button & Header */}
        <button 
          onClick={() => { setView('list'); setSelectedEngagement(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Engagements
        </button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <OwnersDisplay ownerIds={selectedEngagement.ownerIds} size="md" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-medium text-gray-900">{selectedEngagement.company}</h2>
                {selectedEngagement.isArchived && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">Archived</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-500">
                  {industryLabels[selectedEngagement.industry] || selectedEngagement.industry} · Started {selectedEngagement.startDate}
                </p>
                <span className="text-gray-300">·</span>
                <button
                  onClick={() => setShowOwnersModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Manage Owners ({selectedEngagement.ownerIds?.length || 1})
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-gray-900">{selectedEngagement.dealSize || '—'}</p>
            <button
              onClick={() => handleToggleArchive(selectedEngagement.id, !selectedEngagement.isArchived)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-900"
            >
              {selectedEngagement.isArchived ? 'Restore' : 'Archive'}
            </button>
          </div>
        </div>

        {/* Contact & Integrations Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">Primary Contact</p>
            <p className="font-medium text-gray-900">{selectedEngagement.contactName}</p>
            {selectedEngagement.contactEmail && (
              <p className="text-sm text-gray-600">{selectedEngagement.contactEmail}</p>
            )}
            {selectedEngagement.contactPhone && (
              <p className="text-sm text-gray-600">{selectedEngagement.contactPhone}</p>
            )}
          </div>

          {/* Integrations */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Integrations</p>
              <button 
                onClick={() => setShowIntegrationsModal(true)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Edit
              </button>
            </div>
            <div className="space-y-1">
              {selectedEngagement.salesforceId ? (
                <a 
                  href={selectedEngagement.salesforceUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Salesforce: {selectedEngagement.salesforceId}
                </a>
              ) : (
                <p className="text-sm text-gray-400">No Salesforce linked</p>
              )}
              {selectedEngagement.jiraTicket ? (
                <a 
                  href={selectedEngagement.jiraUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Jira: {selectedEngagement.jiraTicket}
                </a>
              ) : (
                <p className="text-sm text-gray-400">No Jira ticket linked</p>
              )}
              {selectedEngagement.slackChannel && (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  {selectedEngagement.slackChannel}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Phase Tracker */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Engagement Progress</h3>
          <div className="space-y-2">
            {phaseConfig.map((phase, index) => {
              const phaseData = selectedEngagement.phases[phase.id] || { status: 'PENDING', notes: '', links: [] };
              const statusBadge = getStatusBadge(phaseData.status);
              const links = Array.isArray(phaseData.links) ? phaseData.links : [];
              
              return (
                <div 
                  key={phase.id}
                  className={`border rounded-xl p-5 transition-all ${
                    phaseData.status === 'IN_PROGRESS' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between mb-2 cursor-pointer"
                    onClick={() => setShowPhaseModal(phase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        phaseData.status === 'COMPLETE' ? 'bg-emerald-100 text-emerald-700' :
                        phaseData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {phaseData.status === 'COMPLETE' ? '✓' : index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{phase.label}</h4>
                        <p className="text-sm text-gray-500">{phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {phaseData.completedDate && (
                        <span className="text-xs text-gray-400">{phaseData.completedDate}</span>
                      )}
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                  
                  {phaseData.notes && (
                    <p className="text-sm text-gray-600 mt-3 pl-11">{phaseData.notes}</p>
                  )}
                  
                  {/* Links Section */}
                  <div className="mt-3 pl-11">
                    {links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {links.map((link, linkIndex) => (
                          <div key={linkIndex} className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {link.title}
                            </a>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRemoveLink(phase.id, linkIndex); }}
                              className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowLinkModal(phase.id); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity Log</h3>
            <button 
              onClick={() => setShowActivityModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              + Add Activity
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedEngagement.activities.map((activity) => {
              const isExpanded = expandedActivities[activity.id];
              const commentCount = activity.comments?.length || 0;
              
              return (
                <div key={activity.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="text-sm text-gray-400 w-24 flex-shrink-0">{activity.date}</div>
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-1">
                        {activityTypeLabels[activity.type] || activity.type}
                      </span>
                      <p className="text-gray-900">{activity.description}</p>
                      
                      {/* Comments toggle */}
                      <button
                        onClick={() => toggleActivityExpansion(activity.id)}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {commentCount} comment{commentCount !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      {/* Existing comments */}
                      {activity.comments?.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {activity.comments.map((comment) => {
                            const author = getOwnerInfo(comment.authorId);
                            const isOwnComment = comment.authorId === currentUser?.id;
                            
                            return (
                              <div key={comment.id} className="flex gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isOwnComment ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {author.initials}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{author.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                    {isOwnComment && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-xs text-gray-400 hover:text-red-500"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Add comment input */}
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {currentUser?.initials}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={newComment[activity.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [activity.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(activity.id);
                              }
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleAddComment(activity.id)}
                            disabled={!newComment[activity.id]?.trim()}
                            className="px-3 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {selectedEngagement.activities.length === 0 && (
              <p className="text-gray-400 text-center py-8">No activities logged yet</p>
            )}
          </div>
        </div>

        {/* Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowActivityModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Log Activity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={e => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newActivity.type}
                    onChange={e => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {activityTypes.map(type => (
                      <option key={type} value={type}>{activityTypeLabels[type]}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newActivity.description}
                    onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="What happened?"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddActivity}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Save Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase Edit Modal */}
        {showPhaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPhaseModal(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Update {phaseConfig.find(p => p.id === showPhaseModal)?.label} Phase
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedEngagement.phases[showPhaseModal]?.status || 'PENDING'}
                    onChange={e => handleUpdatePhase(showPhaseModal, { status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETE">Complete</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    defaultValue={selectedEngagement.phases[showPhaseModal]?.notes || ''}
                    onBlur={e => handleUpdatePhase(showPhaseModal, { notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Key findings, decisions, blockers..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPhaseModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkModal(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Add Link to {phaseConfig.find(p => p.id === showLinkModal)?.label}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={e => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Architecture Diagram"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setShowLinkModal(null); setNewLink({ title: '', url: '' }); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddLink(showLinkModal)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Modal */}
        {showIntegrationsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowIntegrationsModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Edit Integrations</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateIntegrations({
                  salesforceId: formData.get('salesforceId') || null,
                  salesforceUrl: formData.get('salesforceUrl') || null,
                  jiraTicket: formData.get('jiraTicket') || null,
                  jiraUrl: formData.get('jiraUrl') || null,
                  slackChannel: formData.get('slackChannel') || null
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Opportunity ID</label>
                    <input
                      type="text"
                      name="salesforceId"
                      defaultValue={selectedEngagement.salesforceId || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="006Dn000004XXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
                    <input
                      type="url"
                      name="salesforceUrl"
                      defaultValue={selectedEngagement.salesforceUrl || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="https://plainid.lightning.force.com/..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
                    <input
                      type="text"
                      name="jiraTicket"
                      defaultValue={selectedEngagement.jiraTicket || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="SE-1234"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                    <input
                      type="url"
                      name="jiraUrl"
                      defaultValue={selectedEngagement.jiraUrl || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="https://plainid.atlassian.net/browse/..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
                    <input
                      type="text"
                      name="slackChannel"
                      defaultValue={selectedEngagement.slackChannel || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="#customer-poc"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowIntegrationsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Owners Modal (Phase 2) */}
        {showOwnersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowOwnersModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Manage Owners</h3>
              
              {/* Current Owners */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Current Owners</p>
                <div className="space-y-2">
                  {selectedEngagement.ownerIds?.map(ownerId => {
                    const owner = getOwnerInfo(ownerId);
                    const isOnlyOwner = selectedEngagement.ownerIds?.length === 1;
                    
                    return (
                      <div key={ownerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            ownerId === currentUser?.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {owner.initials}
                          </div>
                          <span className="font-medium text-gray-900">{owner.name}</span>
                        </div>
                        {!isOnlyOwner && (
                          <button
                            onClick={() => handleRemoveOwner(ownerId)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Add Owner */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Add Owner</p>
                <div className="space-y-2">
                  {teamMembers
                    .filter(m => !selectedEngagement.ownerIds?.includes(m.id))
                    .map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium">
                            {member.initials}
                          </div>
                          <span className="text-gray-900">{member.name}</span>
                        </div>
                        <button
                          onClick={() => handleAddOwner(member.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  }
                  {teamMembers.filter(m => !selectedEngagement.ownerIds?.includes(m.id)).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">All team members are already owners</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowOwnersModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========== NEW ENGAGEMENT VIEW ==========
  const NewEngagementView = () => (
    <div>
      <button 
        onClick={() => setView('list')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cancel
      </button>

      <h2 className="text-2xl font-medium text-gray-900 mb-8">New Engagement</h2>

      <div className="max-w-xl space-y-6">
        {/* Company & Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Company & Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={newEngagement.company}
                onChange={e => setNewEngagement(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Acme Corporation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input
                type="text"
                value={newEngagement.contactName}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={newEngagement.contactEmail}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="john@acme.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newEngagement.contactPhone}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={newEngagement.industry}
                onChange={e => setNewEngagement(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{industryLabels[ind]}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
              <input
                type="text"
                value={newEngagement.dealSize}
                onChange={e => setNewEngagement(prev => ({ ...prev, dealSize: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="$100K"
              />
            </div>
          </div>
        </div>

        {/* Owners (Phase 2) */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Owners</h3>
          <div className="space-y-2">
            {teamMembers.map(member => {
              const isSelected = newEngagement.ownerIds.includes(member.id);
              return (
                <label 
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-900 text-white' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSelected ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {member.initials}
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewEngagement(prev => ({ ...prev, ownerIds: [...prev.ownerIds, member.id] }));
                      } else {
                        // Don't allow unchecking if it's the last owner
                        if (newEngagement.ownerIds.length > 1) {
                          setNewEngagement(prev => ({ ...prev, ownerIds: prev.ownerIds.filter(id => id !== member.id) }));
                        }
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-white bg-white' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {newEngagement.ownerIds.length === 0 && (
            <p className="text-sm text-red-500 mt-2">At least one owner is required</p>
          )}
        </div>

        {/* Integrations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Opportunity ID</label>
              <input
                type="text"
                value={newEngagement.salesforceId}
                onChange={e => setNewEngagement(prev => ({ ...prev, salesforceId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="006Dn000004XXXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
              <input
                type="url"
                value={newEngagement.salesforceUrl}
                onChange={e => setNewEngagement(prev => ({ ...prev, salesforceUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
              <input
                type="text"
                value={newEngagement.jiraTicket}
                onChange={e => setNewEngagement(prev => ({ ...prev, jiraTicket: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="SE-1234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
              <input
                type="url"
                value={newEngagement.jiraUrl}
                onChange={e => setNewEngagement(prev => ({ ...prev, jiraUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
              <input
                type="text"
                value={newEngagement.slackChannel}
                onChange={e => setNewEngagement(prev => ({ ...prev, slackChannel: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="#customer-poc"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreateEngagement}
          disabled={!newEngagement.company || !newEngagement.contactName || newEngagement.ownerIds.length === 0}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Engagement
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-400 tracking-widest uppercase">Pre-Sales Engineering</p>
            <span className="text-gray-300">|</span>
            <p className="font-medium text-gray-900">Engagement Tracker</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{currentUser?.name}</span>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
              {currentUser?.initials}
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {view === 'list' && <ListView />}
        {view === 'detail' && <DetailView />}
        {view === 'new' && <NewEngagementView />}
      </main>
    </div>
  );
}

// Custom Sign Up form components to enforce domain restriction
const signUpFormFields = {
  signUp: {
    given_name: {
      label: 'First Name',
      placeholder: 'Enter your first name',
      isRequired: true,
      order: 1
    },
    family_name: {
      label: 'Last Name',
      placeholder: 'Enter your last name',
      isRequired: true,
      order: 2
    },
    email: {
      label: 'Email',
      placeholder: 'Enter your @plainid.com email',
      isRequired: true,
      order: 3
    },
    password: {
      label: 'Password',
      placeholder: 'Create a password',
      isRequired: true,
      order: 4
    },
    confirm_password: {
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      isRequired: true,
      order: 5
    }
  }
};

// Auth wrapper component with domain validation
function App() {
  return (
    <Authenticator
      formFields={signUpFormFields}
      services={{
        async validateCustomSignUp(formData) {
          const email = formData.email || '';
          if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
            return {
              email: `Only @${ALLOWED_DOMAIN} email addresses are allowed`
            };
          }
        }
      }}
      components={{
        Header() {
          return (
            <div className="text-center py-8">
              <h1 className="text-2xl font-medium text-gray-900">Pre-Sales Engagement Tracker</h1>
              <p className="text-gray-500 mt-2">Sign in with your PlainID email</p>
            </div>
          );
        }
      }}
    >
      <PresalesTracker />
    </Authenticator>
  );
}

export default App;
