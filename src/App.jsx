import React, { useState, useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';

// Import constants
import {
  industryLabels,
  phaseLabels,
  activityTypeLabels,
  changeTypeLabels,
  phaseConfig,
  activityTypes,
  industries,
  ALLOWED_DOMAIN
} from './constants';

// Import utilities
import { parseLinks } from './utils';

// Import components
import {
  OwnersDisplay,
  StaleBadge,
  NotificationBadge,
  AvatarMenu,
  LinkModal,
  DeleteEngagementModal,
  ActivityModal,
  PhaseEditModal,
  IntegrationsModal,
  EditDetailsModal,
  OwnersModal,
  HistoryModal
} from './components';

// Import custom hooks
import {
  usePresalesData,
  useAuth,
  useTeamOperations,
  useEngagementList,
  useEngagementDetail
} from './hooks';

// Main App Component (inside Authenticator)
function PresalesTracker() {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // ============================================
  // UI STATE (stays in component)
  // ============================================
  const [selectedEngagementId, setSelectedEngagementId] = useState(null);
  const [view, setView] = useState('list');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [filterStale, setFilterStale] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [newComment, setNewComment] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [adminShowInactive, setAdminShowInactive] = useState(false);
  const [engagementAdminFilter, setEngagementAdminFilter] = useState('all');
  const [engagementAdminSearch, setEngagementAdminSearch] = useState('');
  const [deleteModalEngagement, setDeleteModalEngagement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'TECHNOLOGY', dealSize: '', ownerIds: [],
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
  });

  // ============================================
  // HOOKS - Data and Operations
  // ============================================
  
  // Core data hook - owns all data state
  const {
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
    selectedEngagement, // Derived from selectedEngagementId
    updateEngagementInState,
    getOwnerInfo,
    logChangeAsync,
    fetchAllData,
    client
  } = usePresalesData(selectedEngagementId);

  // Auth operations
  const { initializeUser, handleSignOut } = useAuth({
    user,
    setCurrentUser,
    setLoading,
    setNewEngagement,
    fetchAllData,
    client
  });

  // Team admin operations
  const { handleToggleUserActive, handleToggleUserAdmin } = useTeamOperations({
    currentUser,
    allTeamMembers,
    setAllTeamMembers,
    setTeamMembers,
    fetchAllData,
    client
  });

  // Engagement list operations
  const {
    filteredEngagements,
    filteredEngagementsAdmin,
    staleCount,
    getCascadeInfo,
    handleCreateEngagement,
    handleToggleArchive,
    handleDeleteEngagement
  } = useEngagementList({
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
    filters: {
      filterPhase,
      filterOwner,
      filterStale,
      showArchived,
      searchQuery,
      engagementAdminFilter,
      engagementAdminSearch
    }
  });

  // Engagement detail operations (namespaced)
  const detail = useEngagementDetail({
    selectedEngagement,
    updateEngagementInState,
    currentUser,
    engagementViews,
    setEngagementViews,
    logChangeAsync,
    getOwnerInfo,
    client
  });

  // ============================================
  // EFFECTS
  // ============================================

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [user]);

  // ============================================
  // LOCAL HANDLERS (UI-specific, not data operations)
  // ============================================

  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
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

  // Wrapper handlers that connect modals to hook operations
  const handleAddActivity = async (activityData) => {
    const success = await detail.activity.add(activityData);
    if (success) {
      setShowActivityModal(false);
    }
  };

  const handleSavePhase = async (phaseData) => {
    await detail.phase.save(showPhaseModal, phaseData);
    setShowPhaseModal(null);
  };

  const handleAddLink = async (linkData) => {
    await detail.phase.addLink(showLinkModal, linkData);
    setShowLinkModal(null);
  };

  const handleUpdateIntegrations = async (updates) => {
    await detail.integrations.update(updates);
    setShowIntegrationsModal(false);
  };

  const handleUpdateDetails = async (updates) => {
    await detail.details.update(updates);
    setShowEditDetailsModal(false);
  };

  const handleAddComment = async (activityId) => {
    const commentText = newComment[activityId];
    const success = await detail.activity.addComment(activityId, commentText);
    if (success) {
      setNewComment(prev => ({ ...prev, [activityId]: '' }));
    }
  };

  const onDeleteEngagement = async () => {
    await handleDeleteEngagement(deleteModalEngagement, setDeleteModalEngagement, setIsDeleting);
  };

  // ============================================
  // LOADING STATE
  // ============================================

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

  // ============================================
  // RENDER
  // ============================================

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
          
          <AvatarMenu 
            currentUser={currentUser}
            onTeamClick={() => setView('admin')}
            onEngagementsClick={() => setView('engagements-admin')}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* ADMIN VIEW */}
        {view === 'admin' && (
          <div>
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Engagements
            </button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-medium text-gray-900">Team Management</h2>
                <p className="text-gray-500 mt-1">
                  {allTeamMembers.filter(m => m.isActive !== false).length} active · {allTeamMembers.filter(m => m.isActive === false).length} inactive
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdminShowInactive(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    !adminShowInactive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Active Users
                </button>
                <button
                  onClick={() => setAdminShowInactive(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    adminShowInactive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Users
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(adminShowInactive ? allTeamMembers : allTeamMembers.filter(m => m.isActive !== false)).map(member => {
                const isInactive = member.isActive === false;
                const isSelf = member.id === currentUser?.id;
                const ownedEngagements = engagements.filter(e => 
                  e.ownerIds?.includes(member.id) || e.ownerId === member.id
                ).length;
                
                return (
                  <div
                    key={member.id}
                    className={`bg-white border rounded-xl p-5 ${
                      isInactive ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                          isInactive ? 'bg-gray-300 text-gray-500' :
                          isSelf ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-medium ${isInactive ? 'text-gray-500' : 'text-gray-900'}`}>
                              {member.name}
                            </h3>
                            {member.isAdmin && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>
                            )}
                            {isInactive && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded">Inactive</span>
                            )}
                            {isSelf && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">You</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400 mt-1">{ownedEngagements} engagement{ownedEngagements !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      
                      {!isSelf && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserAdmin(member.id, member.isAdmin)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              member.isAdmin 
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {member.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleToggleUserActive(member.id, member.isActive !== false)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              isInactive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {isInactive ? 'Reactivate' : 'Deactivate'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <h4 className="text-sm font-medium text-blue-900 mb-2">About User Management</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Deactivated users</strong> cannot be assigned as owners but their existing engagements remain.</li>
                <li>• <strong>Admins</strong> can manage team members and access this panel.</li>
                <li>• Users automatically join when they sign up with a @plainid.com email.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ENGAGEMENT MANAGEMENT VIEW */}
        {view === 'engagements-admin' && (
          <div>
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Engagements
            </button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-medium text-gray-900">Engagement Management</h2>
                <p className="text-gray-500 mt-1">
                  {engagements.filter(e => !e.isArchived).length} active · {engagements.filter(e => e.isArchived).length} archived · {engagements.length} total
                </p>
              </div>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by company or contact..."
                value={engagementAdminSearch}
                onChange={(e) => setEngagementAdminSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setEngagementAdminFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    engagementAdminFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({engagements.length})
                </button>
                <button
                  onClick={() => setEngagementAdminFilter('active')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    engagementAdminFilter === 'active' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Active ({engagements.filter(e => !e.isArchived).length})
                </button>
                <button
                  onClick={() => setEngagementAdminFilter('archived')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    engagementAdminFilter === 'archived' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Archived ({engagements.filter(e => e.isArchived).length})
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owners</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phase</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Activities</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEngagementsAdmin.map(engagement => (
                    <tr key={engagement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{engagement.company}</p>
                          <p className="text-sm text-gray-500">{engagement.contactName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <OwnersDisplay 
                          ownerIds={engagement.ownerIds} 
                          size="sm" 
                          getOwnerInfo={getOwnerInfo} 
                          currentUserId={currentUser?.id} 
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">
                          {phaseLabels[engagement.currentPhase] || engagement.currentPhase}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-gray-700">{engagement.activities?.length || 0}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{engagement.startDate}</span>
                      </td>
                      <td className="px-4 py-4">
                        {engagement.isArchived ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            Archived
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setDeleteModalEngagement(engagement)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEngagementsAdmin.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No engagements found
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-red-50 rounded-xl">
              <h4 className="text-sm font-medium text-red-900 mb-2">About Engagement Deletion</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• <strong>Deletion is permanent</strong> and cannot be undone.</li>
                <li>• All related data (phases, activities, comments, change logs) will be removed.</li>
                <li>• Consider archiving engagements instead if you may need the data later.</li>
              </ul>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
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
                  {!showArchived && staleCount > 0 && (
                    <span className="text-amber-600"> · {staleCount} need attention</span>
                  )}
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

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by company, contact, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

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

                <div className="flex gap-2 mb-4 flex-wrap">
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

                <div className="mb-6">
                  <button
                    onClick={() => setFilterStale(!filterStale)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                      filterStale ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Needs Attention ({staleCount})
                  </button>
                </div>
              </>
            )}

            <div className="space-y-3">
              {filteredEngagements.map(engagement => (
                <div
                  key={engagement.id}
                  onClick={() => { 
                    setSelectedEngagementId(engagement.id); 
                    setView('detail'); 
                    detail.view.update(engagement.id);
                  }}
                  className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all cursor-pointer ${
                    engagement.isStale ? 'border-amber-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <OwnersDisplay ownerIds={engagement.ownerIds} size="md" getOwnerInfo={getOwnerInfo} currentUserId={currentUser?.id} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{engagement.company}</h3>
                          {engagement.unreadChanges > 0 && (
                            <NotificationBadge count={engagement.unreadChanges} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{engagement.contactName} · {industryLabels[engagement.industry] || engagement.industry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">{engagement.dealSize || '—'}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {engagement.isStale && (
                          <StaleBadge daysSinceActivity={engagement.daysSinceActivity} />
                        )}
                        {!engagement.isStale && (
                          <p className="text-xs text-gray-400">Last activity: {engagement.lastActivity || engagement.startDate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(engagement.salesforceId || engagement.jiraTicket) && (
                    <div className="flex gap-2 mb-3">
                      {engagement.salesforceId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">SF</span>
                      )}
                      {engagement.jiraTicket && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">{engagement.jiraTicket}</span>
                      )}
                    </div>
                  )}
                  
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
                  {showArchived ? 'No archived engagements' : 
                    filterStale ? 'No stale engagements - great job!' :
                    'No engagements found with current filters'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedEngagement && (
          <div>
            <button 
              onClick={() => { setView('list'); setSelectedEngagementId(null); }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Engagements
            </button>

            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                <OwnersDisplay ownerIds={selectedEngagement.ownerIds} size="md" getOwnerInfo={getOwnerInfo} currentUserId={currentUser?.id} />
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-medium text-gray-900">{selectedEngagement.company}</h2>
                    {selectedEngagement.isArchived && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">Archived</span>
                    )}
                    {selectedEngagement.isStale && !selectedEngagement.isArchived && (
                      <StaleBadge daysSinceActivity={selectedEngagement.daysSinceActivity} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-gray-500">
                      {industryLabels[selectedEngagement.industry] || selectedEngagement.industry} · Started {selectedEngagement.startDate}
                    </p>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => setShowEditDetailsModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit Details
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => setShowOwnersModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Manage Owners ({selectedEngagement.ownerIds?.length || 1})
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
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

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Primary Contact</p>
                  <button 
                    onClick={() => setShowEditDetailsModal(true)}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </div>
                <p className="font-medium text-gray-900">{selectedEngagement.contactName}</p>
                {selectedEngagement.contactEmail && (
                  <p className="text-sm text-gray-600">{selectedEngagement.contactEmail}</p>
                )}
                {selectedEngagement.contactPhone && (
                  <p className="text-sm text-gray-600">{selectedEngagement.contactPhone}</p>
                )}
              </div>

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
                    <a href={selectedEngagement.salesforceUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      Salesforce: {selectedEngagement.salesforceId}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">No Salesforce linked</p>
                  )}
                  {selectedEngagement.jiraTicket ? (
                    <a href={selectedEngagement.jiraUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      Jira: {selectedEngagement.jiraTicket}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">No Jira ticket linked</p>
                  )}
                  {selectedEngagement.slackChannel && (
                    <p className="flex items-center gap-2 text-sm text-gray-700">{selectedEngagement.slackChannel}</p>
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
                  const links = parseLinks(phaseData.links);
                  
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
                      
                      <div className="mt-3 pl-11">
                        {links.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {links.map((link, linkIndex) => (
                              <div key={linkIndex} className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-700 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                                  {link.title}
                                </a>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); detail.phase.removeLink(phase.id, linkIndex); }}
                                  className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowLinkModal(phase.id); }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >+ Add Link</button>
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
                >+ Add Activity</button>
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
                      
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          {activity.comments?.length > 0 && (
                            <div className="space-y-3 mb-4">
                              {activity.comments.map((comment) => {
                                const author = getOwnerInfo(comment.authorId);
                                const isOwnComment = comment.authorId === currentUser?.id;
                                
                                return (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                      isOwnComment ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>{author.initials}</div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">{author.name}</span>
                                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        {isOwnComment && (
                                          <button onClick={() => detail.activity.deleteComment(comment.id)}
                                            className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
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
                              >Post</button>
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

            {/* Modals */}
            <ActivityModal
              isOpen={showActivityModal}
              onClose={() => setShowActivityModal(false)}
              onSave={handleAddActivity}
            />

            <PhaseEditModal
              isOpen={showPhaseModal !== null}
              onClose={() => setShowPhaseModal(null)}
              phaseId={showPhaseModal}
              initialStatus={selectedEngagement.phases[showPhaseModal]?.status}
              initialNotes={selectedEngagement.phases[showPhaseModal]?.notes}
              onSave={handleSavePhase}
            />

            <LinkModal
              isOpen={showLinkModal !== null}
              onClose={() => setShowLinkModal(null)}
              phaseLabel={phaseConfig.find(p => p.id === showLinkModal)?.label || ''}
              onAdd={handleAddLink}
            />

            <IntegrationsModal
              isOpen={showIntegrationsModal}
              onClose={() => setShowIntegrationsModal(false)}
              initialData={selectedEngagement}
              onSave={handleUpdateIntegrations}
            />

            <EditDetailsModal
              isOpen={showEditDetailsModal}
              onClose={() => setShowEditDetailsModal(false)}
              initialData={selectedEngagement}
              onSave={handleUpdateDetails}
            />

            <OwnersModal
              isOpen={showOwnersModal}
              onClose={() => setShowOwnersModal(false)}
              currentOwnerIds={selectedEngagement.ownerIds}
              teamMembers={teamMembers}
              currentUserId={currentUser?.id}
              getOwnerInfo={getOwnerInfo}
              onAddOwner={detail.owner.add}
              onRemoveOwner={detail.owner.remove}
            />

            <HistoryModal
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
              changeLogs={selectedEngagement.changeLogs}
              currentUserId={currentUser?.id}
              getOwnerInfo={getOwnerInfo}
            />
          </div>
        )}

        {/* NEW ENGAGEMENT VIEW */}
        {view === 'new' && (
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
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Company & Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" value={newEngagement.company}
                      onChange={e => setNewEngagement(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Acme Corporation" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                    <input type="text" value={newEngagement.contactName}
                      onChange={e => setNewEngagement(prev => ({ ...prev, contactName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="John Smith" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input type="email" value={newEngagement.contactEmail}
                      onChange={e => setNewEngagement(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="john@acme.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input type="tel" value={newEngagement.contactPhone}
                      onChange={e => setNewEngagement(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="+1 (555) 123-4567" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select value={newEngagement.industry}
                      onChange={e => setNewEngagement(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                      {industries.map(ind => (
                        <option key={ind} value={ind}>{industryLabels[ind]}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
                    <input type="text" value={newEngagement.dealSize}
                      onChange={e => setNewEngagement(prev => ({ ...prev, dealSize: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="$100K" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Owners</h3>
                <div className="space-y-2">
                  {teamMembers.map(member => {
                    const isSelected = newEngagement.ownerIds.includes(member.id);
                    return (
                      <label key={member.id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-gray-900 text-white' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isSelected ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-600'
                          }`}>{member.initials}</div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <input type="checkbox" checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEngagement(prev => ({ ...prev, ownerIds: [...prev.ownerIds, member.id] }));
                            } else {
                              if (newEngagement.ownerIds.length > 1) {
                                setNewEngagement(prev => ({ ...prev, ownerIds: prev.ownerIds.filter(id => id !== member.id) }));
                              }
                            }
                          }}
                          className="sr-only" />
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

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Opportunity ID</label>
                    <input type="text" value={newEngagement.salesforceId}
                      onChange={e => setNewEngagement(prev => ({ ...prev, salesforceId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="006Dn000004XXXX" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
                    <input type="url" value={newEngagement.salesforceUrl}
                      onChange={e => setNewEngagement(prev => ({ ...prev, salesforceUrl: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="https://..." />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
                    <input type="text" value={newEngagement.jiraTicket}
                      onChange={e => setNewEngagement(prev => ({ ...prev, jiraTicket: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="SE-1234" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                    <input type="url" value={newEngagement.jiraUrl}
                      onChange={e => setNewEngagement(prev => ({ ...prev, jiraUrl: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="https://..." />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
                    <input type="text" value={newEngagement.slackChannel}
                      onChange={e => setNewEngagement(prev => ({ ...prev, slackChannel: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="#customer-poc" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateEngagement}
                disabled={!newEngagement.company || !newEngagement.contactName || newEngagement.ownerIds.length === 0}
                className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >Create Engagement</button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Engagement Modal - outside main content since it's used in admin view */}
      <DeleteEngagementModal
        isOpen={deleteModalEngagement !== null}
        engagement={deleteModalEngagement}
        cascadeInfo={getCascadeInfo(deleteModalEngagement)}
        onClose={() => setDeleteModalEngagement(null)}
        onConfirm={onDeleteEngagement}
        isDeleting={isDeleting}
      />
    </div>
  );
}

// Custom Sign Up form components
const signUpFormFields = {
  signUp: {
    given_name: { label: 'First Name', placeholder: 'Enter your first name', isRequired: true, order: 1 },
    family_name: { label: 'Last Name', placeholder: 'Enter your last name', isRequired: true, order: 2 },
    email: { label: 'Email', placeholder: 'Enter your @plainid.com email', isRequired: true, order: 3 },
    password: { label: 'Password', placeholder: 'Create a password', isRequired: true, order: 4 },
    confirm_password: { label: 'Confirm Password', placeholder: 'Confirm your password', isRequired: true, order: 5 }
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
            return { email: `Only @${ALLOWED_DOMAIN} email addresses are allowed` };
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
