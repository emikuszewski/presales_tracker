import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
  // ROUTING - URL-derived state
  // ============================================
  const navigate = useNavigate();
  const location = useLocation();
  
  // Derive current view from URL pathname
  const view = useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/engagement/new') return 'new';
    if (pathname.startsWith('/engagement/')) return 'detail';
    if (pathname === '/admin/team') return 'admin';
    if (pathname === '/admin/engagements') return 'engagements-admin';
    if (pathname === '/admin/salesreps') return 'salesreps';
    return 'list';
  }, [location.pathname]);
  
  // Derive engagement ID from URL (for detail view)
  const engagementIdFromUrl = useMemo(() => {
    const match = location.pathname.match(/^\/engagement\/([^/]+)$/);
    if (match && match[1] !== 'new') return match[1];
    return null;
  }, [location.pathname]);
  
  // Track previous engagement ID for tab reset
  const prevEngagementIdRef = useRef(null);
  
  // ============================================
  // NAVIGATION HELPER (URL-based)
  // ============================================
  
  /**
   * Centralized navigation using React Router
   * @param {string} targetView - The view to navigate to
   * @param {string|null} engagementId - Optional engagement ID
   * @param {Object|null} options - Optional navigation options (e.g., { scrollToActivity: '123' })
   */
  const navigateTo = useCallback((targetView, engagementId = null, options = null) => {
    let url;
    switch(targetView) {
      case 'list':
        url = '/';
        break;
      case 'detail':
        url = `/engagement/${engagementId}`;
        if (options?.scrollToActivity) {
          url += `?scrollToActivity=${options.scrollToActivity}`;
        }
        break;
      case 'new':
        url = '/engagement/new';
        break;
      case 'admin':
        url = '/admin/team';
        break;
      case 'engagements-admin':
        url = '/admin/engagements';
        break;
      case 'salesreps':
        url = '/admin/salesreps';
        break;
      default:
        url = '/';
    }
    navigate(url);
  }, [navigate]);

  // ============================================
  // UI STATE (stays in component)
  // ============================================
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [filterStale, setFilterStale] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showEverything, setShowEverything] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [everythingManuallyDisabled, setEverythingManuallyDisabled] = useState(false);
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
  // Now receives engagement ID from URL
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
  } = usePresalesData(engagementIdFromUrl);

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
  // Now uses navigateTo instead of setView/setSelectedEngagementId
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
    navigateTo,
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
  // URL-BASED NAVIGATION EFFECTS
  // ============================================
  
  /**
   * Handle engagement change via URL
   * - Reset tab to 'progress' when navigating to a different engagement
   * - Track engagement view for "last viewed" badge
   */
  useEffect(() => {
    if (engagementIdFromUrl && engagementIdFromUrl !== prevEngagementIdRef.current) {
      // Reset tab to progress for new engagement
      setDetailActiveTab('progress');
      
      // Track view when navigating to detail
      if (detail?.view?.update) {
        detail.view.update(engagementIdFromUrl);
      }
    }
    prevEngagementIdRef.current = engagementIdFromUrl;
  }, [engagementIdFromUrl, detail]);

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
    setEverythingManuallyDisabled(false);
  };

  /**
   * Handle manual disable of Everything filter (via chip removal)
   * Sets the manual override flag so auto-enable doesn't re-trigger
   */
  const handleEverythingManualDisable = () => {
    setShowEverything(false);
    setEverythingManuallyDisabled(true);
  };

  /**
   * Handle manual enable of Everything filter (via FilterPanel button)
   * Clears the manual override flag
   */
  const handleEverythingManualEnable = () => {
    setShowEverything(true);
    setEverythingManuallyDisabled(false);
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, [user]);

  // Auto-enable Everything filter when search is active
  // Auto-disable when search is cleared (resets manual override)
  useEffect(() => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    
    if (hasSearchQuery) {
      // Only auto-enable if not manually disabled
      if (!everythingManuallyDisabled) {
        setShowEverything(true);
      }
    } else {
      // Search cleared - reset to default state
      setShowEverything(false);
      setEverythingManuallyDisabled(false);
    }
  }, [searchQuery, everythingManuallyDisabled]);

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

      {/* Main Content - Using Routes */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Routes>
          {/* List View - Home */}
          <Route path="/" element={
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
                clearAllFilters,
                handleEverythingManualDisable,
                handleEverythingManualEnable
              }}
              onSelectEngagement={(id) => navigateTo('detail', id)}
              onNavigateToActivity={(engagementId, activityId) => navigateTo('detail', engagementId, { scrollToActivity: activityId })}
              onNewEngagement={() => navigateTo('new')}
            />
          } />

          {/* New Engagement - Must come before :id route */}
          <Route path="/engagement/new" element={
            <NewEngagementView
              newEngagement={newEngagement}
              setNewEngagement={setNewEngagement}
              teamMembers={teamMembers}
              salesReps={salesReps}
              onSubmit={handleCreateEngagement}
              onBack={() => navigateTo('list')}
            />
          } />

          {/* Engagement Detail */}
          <Route path="/engagement/:id" element={
            selectedEngagement ? (
              <DetailView
                key={`detail-${engagementIdFromUrl}-${conflictResetCounter}`}
                engagement={selectedEngagement}
                teamMembers={teamMembers}
                salesReps={salesReps}
                currentUser={currentUser}
                getOwnerInfo={getOwnerInfo}
                detail={detail}
                onToggleArchive={handleToggleArchive}
                onBack={() => navigateTo('list')}
                onModalStateChange={setHasOpenModal}
                activeTab={detailActiveTab}
                onTabChange={setDetailActiveTab}
                onRefresh={() => refreshSingleEngagement(engagementIdFromUrl)}
              />
            ) : (
              // Engagement not found - redirect to list
              <Navigate to="/" replace />
            )
          } />

          {/* Admin Views */}
          <Route path="/admin/team" element={
            <AdminView
              currentUser={currentUser}
              allTeamMembers={allTeamMembers}
              engagements={engagements}
              onToggleActive={handleToggleUserActive}
              onToggleAdmin={handleToggleUserAdmin}
              onBack={() => navigateTo('list')}
            />
          } />

          <Route path="/admin/engagements" element={
            <EngagementsAdminView
              engagements={engagements}
              currentUser={currentUser}
              getOwnerInfo={getOwnerInfo}
              getCascadeInfo={getCascadeInfo}
              onDeleteEngagement={handleDeleteEngagement}
              onBack={() => navigateTo('list')}
            />
          } />

          <Route path="/admin/salesreps" element={
            <SalesRepsView
              salesReps={salesReps}
              onCreateSalesRep={createSalesRep}
              onUpdateSalesRep={updateSalesRep}
              onDeleteSalesRep={deleteSalesRep}
              getEngagementCount={getEngagementCount}
              onBack={() => navigateTo('list')}
            />
          } />

          {/* Catch-all - redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
