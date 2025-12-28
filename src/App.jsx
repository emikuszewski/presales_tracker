import React, { useState, useEffect, useCallback } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';

// Import constants
import { ALLOWED_DOMAIN } from './constants';

// Import components
import { AvatarMenu, ConflictModal } from './components';

// Import views
import {
  AdminView,
  EngagementsAdminView,
  ListView,
  DetailView,
  NewEngagementView,
  SalesRepsView
} from './views';

// Import custom hooks
import {
  usePresalesData,
  useAuth,
  useTeamOperations,
  useEngagementList,
  useEngagementDetail,
  useVisibilityRefresh,
  useSalesRepsOperations
} from './hooks';

// Main App Component (inside Authenticator)
function PresalesTracker() {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // ============================================
  // UI STATE (stays in component)
  // ============================================
  const [selectedEngagementId, setSelectedEngagementId] = useState(null);
  const [view, setView] = useState('list');
  const [navigationOptions, setNavigationOptions] = useState(null);
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [filterStale, setFilterStale] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showEverything, setShowEverything] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'TECHNOLOGY', dealSize: '', ownerIds: [],
    salesRepId: '',
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', 
    driveFolderName: '', driveFolderUrl: '',
    docsName: '', docsUrl: '',
    slidesName: '', slidesUrl: '',
    sheetsName: '', sheetsUrl: '',
    slackChannel: '', slackUrl: ''
  });

  // ============================================
  // LAYER 2: CONFLICT MODAL STATE
  // ============================================
  const [conflictInfo, setConflictInfo] = useState(null);
  const [conflictResetCounter, setConflictResetCounter] = useState(0);
  const [detailActiveTab, setDetailActiveTab] = useState('progress'); // Lifted from DetailView for conflict refresh persistence
  
  // ============================================
  // MODAL STATE TRACKING (for Layer 1)
  // Tracks whether DetailView has any modal open
  // ============================================
  const [hasOpenModal, setHasOpenModal] = useState(false);

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
    salesReps,
    setSalesReps,
    engagementViews,
    setEngagementViews,
    loading,
    setLoading,
    selectedEngagement,
    updateEngagementInState,
    getOwnerInfo,
    logChangeAsync,
    fetchAllData,
    refreshSingleEngagement,
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

  // Sales reps operations
  const { createSalesRep, updateSalesRep, deleteSalesRep, getEngagementCount } = useSalesRepsOperations({
    salesReps,
    setSalesReps,
    engagements,
    setEngagements,
    client
  });

  // Engagement list operations
  const {
    filteredEngagements,
    staleCount,
    totalInViewMode,
    inProgressInViewMode,
    totalEverythingCount,
    // Pipeline stats
    pipelineTotal,
    pipelineTotalFormatted,
    pipelineDealsCount,
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
      showEverything,
      searchQuery
    }
  });

  // ============================================
  // LAYER 2: CONFLICT HANDLER
  // ============================================
  
  /**
   * Called by useEngagementDetail when a conditional write fails
   * @param {Object} info - { recordType: string }
   */
  const handleConflict = useCallback((info) => {
    console.log('[App] Conflict detected:', info);
    setConflictInfo(info);
  }, []);

  /**
   * Handle refresh from conflict modal
   * Triggers full data refresh and closes modal
   */
  const handleConflictRefresh = useCallback(() => {
    if (currentUser?.id) {
      fetchAllData(currentUser.id);
    }
    setConflictResetCounter(c => c + 1); // Force DetailView remount to close any edit forms
    setConflictInfo(null);
  }, [fetchAllData, currentUser?.id]);

  /**
   * Handle dismiss from conflict modal
   * Just closes modal, user stays on stale data
   */
  const handleConflictDismiss = useCallback(() => {
    setConflictInfo(null);
  }, []);

  // Engagement detail operations (namespaced)
  // Pass onConflict callback for Layer 2 optimistic locking
  // Pass refreshSingleEngagement for targeted refresh after mutations
  const detail = useEngagementDetail({
    selectedEngagement,
    updateEngagementInState,
    currentUser,
    engagementViews,
    setEngagementViews,
    logChangeAsync,
    getOwnerInfo,
    client,
    onConflict: handleConflict,
    refreshSingleEngagement: refreshSingleEngagement
  });

  // ============================================
  // LAYER 1: VISIBILITY-BASED REFRESH
  // ============================================
  
  /**
   * Callback for visibility refresh
   * Wraps fetchAllData with current user ID
   */
  const handleVisibilityRefresh = useCallback(() => {
    if (currentUser?.id) {
      console.log('[App] Visibility refresh triggered');
      fetchAllData(currentUser.id);
    }
  }, [fetchAllData, currentUser?.id]);

  // Set up visibility-based refresh (Layer 1)
  useVisibilityRefresh({
    onRefresh: handleVisibilityRefresh,
    hasOpenModal,
    currentView: view
  });

  // ============================================
  // FILTER OPERATIONS
  // ============================================

  /**
   * Clear all active filters (phase, stale, search) and reset owner to 'mine'
   * Keeps archived mode as-is
   */
  const clearAllFilters = () => {
    setFilterPhase('all');
    setFilterStale(false);
    setSearchQuery('');
    setFilterOwner('mine');
    setShowEverything(false);
  };

  // ============================================
  // NAVIGATION HELPER
  // ============================================
  
  /**
   * Centralized navigation to prevent bugs from forgetting to clear selection
   * @param {string} targetView - The view to navigate to
   * @param {string|null} engagementId - Optional engagement ID
   * @param {Object|null} options - Optional navigation options (e.g., { scrollToActivity: '123' })
   */
  const navigateTo = (targetView, engagementId = null, options = null) => {
    setView(targetView);
    setSelectedEngagementId(engagementId);
    setNavigationOptions(options);
    
    // Reset tab to progress when navigating to a different engagement
    if (targetView === 'detail' && engagementId !== selectedEngagementId) {
      setDetailActiveTab('progress');
    }
    
    // Track view when navigating to detail
    if (targetView === 'detail' && engagementId) {
      detail.view.update(engagementId);
    }
  };

  /**
   * Clear navigation options after they've been consumed
   */
  const clearNavigationOptions = () => {
    setNavigationOptions(null);
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [user]);

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
            <p className="text-sm font-medium text-gray-400 tracking-widest uppercase">PLAINID SALES ENGINEERING</p>
            <span className="text-gray-300">|</span>
            <p className="font-medium text-gray-900">SE Tracker</p>
          </div>
          
          <AvatarMenu 
            currentUser={currentUser}
            onTeamClick={() => navigateTo('admin')}
            onEngagementsClick={() => navigateTo('engagements-admin')}
            onSalesRepsClick={() => navigateTo('salesreps')}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {view === 'admin' && (
          <AdminView
            currentUser={currentUser}
            allTeamMembers={allTeamMembers}
            engagements={engagements}
            onToggleActive={handleToggleUserActive}
            onToggleAdmin={handleToggleUserAdmin}
            onBack={() => navigateTo('list')}
          />
        )}

        {view === 'engagements-admin' && (
          <EngagementsAdminView
            engagements={engagements}
            currentUser={currentUser}
            getOwnerInfo={getOwnerInfo}
            getCascadeInfo={getCascadeInfo}
            onDeleteEngagement={handleDeleteEngagement}
            onBack={() => navigateTo('list')}
          />
        )}

        {view === 'salesreps' && (
          <SalesRepsView
            salesReps={salesReps}
            onCreateSalesRep={createSalesRep}
            onUpdateSalesRep={updateSalesRep}
            onDeleteSalesRep={deleteSalesRep}
            getEngagementCount={getEngagementCount}
            onBack={() => navigateTo('list')}
          />
        )}

        {view === 'list' && (
          <ListView
            engagements={filteredEngagements}
            teamMembers={teamMembers}
            currentUser={currentUser}
            staleCount={staleCount}
            totalInViewMode={totalInViewMode}
            inProgressInViewMode={inProgressInViewMode}
            totalEverythingCount={totalEverythingCount}
            pipelineTotalFormatted={pipelineTotalFormatted}
            pipelineDealsCount={pipelineDealsCount}
            getOwnerInfo={getOwnerInfo}
            filters={{
              filterPhase,
              filterOwner,
              filterStale,
              showArchived,
              showEverything,
              searchQuery
            }}
            filterActions={{
              setFilterPhase,
              setFilterOwner,
              setFilterStale,
              setShowArchived,
              setShowEverything,
              setSearchQuery,
              clearAllFilters
            }}
            onSelectEngagement={(id) => navigateTo('detail', id)}
            onNavigateToActivity={(engagementId, activityId) => navigateTo('detail', engagementId, { scrollToActivity: activityId })}
            onNewEngagement={() => navigateTo('new')}
          />
        )}

        {view === 'detail' && selectedEngagement && (
          <DetailView
            key={`detail-${selectedEngagement.id}-${conflictResetCounter}`}
            engagement={selectedEngagement}
            teamMembers={teamMembers}
            salesReps={salesReps}
            currentUser={currentUser}
            getOwnerInfo={getOwnerInfo}
            detail={detail}
            navigationOptions={navigationOptions}
            onClearNavigationOptions={clearNavigationOptions}
            onToggleArchive={handleToggleArchive}
            onBack={() => navigateTo('list')}
            onModalStateChange={setHasOpenModal}
            activeTab={detailActiveTab}
            onTabChange={setDetailActiveTab}
          />
        )}

        {view === 'new' && (
          <NewEngagementView
            newEngagement={newEngagement}
            setNewEngagement={setNewEngagement}
            teamMembers={teamMembers}
            salesReps={salesReps}
            onSubmit={handleCreateEngagement}
            onBack={() => navigateTo('list')}
          />
        )}
      </main>

      {/* Layer 2: Conflict Modal */}
      <ConflictModal
        isOpen={conflictInfo !== null}
        recordType={conflictInfo?.recordType || 'record'}
        onRefresh={handleConflictRefresh}
        onDismiss={handleConflictDismiss}
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
              <h1 className="text-2xl font-medium text-gray-900">SE Tracker</h1>
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
