import React, { useState, useEffect } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';

// Import constants
import { ALLOWED_DOMAIN } from './constants';

// Import components
import { AvatarMenu } from './components';

// Import views
import {
  AdminView,
  EngagementsAdminView,
  ListView,
  DetailView,
  NewEngagementView
} from './views';

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
  const [navigationOptions, setNavigationOptions] = useState(null);
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [filterStale, setFilterStale] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [engagementAdminFilter, setEngagementAdminFilter] = useState('all');
  const [engagementAdminSearch, setEngagementAdminSearch] = useState('');
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'TECHNOLOGY', dealSize: '', ownerIds: [],
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', 
    driveFolderName: '', driveFolderUrl: '',
    slackChannel: '', slackUrl: ''
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
    selectedEngagement,
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
  // NAVIGATION HELPER
  // ============================================
  
  /**
   * Centralized navigation to prevent bugs from forgetting to clear selection
   * @param {string} targetView - The view to navigate to
   * @param {string|null} engagementId - Optional engagement ID
   * @param {Object|null} options - Optional navigation options (e.g., { scrollToActivityId: '123' })
   */
  const navigateTo = (targetView, engagementId = null, options = null) => {
    setView(targetView);
    setSelectedEngagementId(engagementId);
    setNavigationOptions(options);
    
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

        {view === 'list' && (
          <ListView
            engagements={filteredEngagements}
            teamMembers={teamMembers}
            currentUser={currentUser}
            staleCount={staleCount}
            getOwnerInfo={getOwnerInfo}
            filters={{
              filterPhase,
              filterOwner,
              filterStale,
              showArchived,
              searchQuery
            }}
            filterActions={{
              setFilterPhase,
              setFilterOwner,
              setFilterStale,
              setShowArchived,
              setSearchQuery
            }}
            onSelectEngagement={(id) => navigateTo('detail', id)}
            onNavigateToActivity={(engagementId, activityId) => navigateTo('detail', engagementId, { scrollToActivityId: activityId })}
            onNewEngagement={() => navigateTo('new')}
          />
        )}

        {view === 'detail' && selectedEngagement && (
          <DetailView
            engagement={selectedEngagement}
            teamMembers={teamMembers}
            currentUser={currentUser}
            getOwnerInfo={getOwnerInfo}
            detail={detail}
            navigationOptions={navigationOptions}
            onClearNavigationOptions={clearNavigationOptions}
            onToggleArchive={handleToggleArchive}
            onBack={() => navigateTo('list')}
          />
        )}

        {view === 'new' && (
          <NewEngagementView
            newEngagement={newEngagement}
            setNewEngagement={setNewEngagement}
            teamMembers={teamMembers}
            onSubmit={handleCreateEngagement}
            onBack={() => navigateTo('list')}
          />
        )}
      </main>
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
