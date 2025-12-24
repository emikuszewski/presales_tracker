import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';

// Generate typed client
const client = generateClient();

// Helper function to group array items by a key (for batch processing)
const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const keyValue = item[key];
  if (keyValue) {
    (acc[keyValue] = acc[keyValue] || []).push(item);
  }
  return acc;
}, {});

// Utility function to safely parse links from Amplify JSON field
const parseLinks = (links) => {
  if (!links) return [];
  if (Array.isArray(links)) return links;
  if (typeof links === 'string') {
    try {
      const parsed = JSON.parse(links);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing links:', e);
      return [];
    }
  }
  return [];
};

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

const changeTypeLabels = {
  CREATED: 'Created engagement',
  PHASE_UPDATE: 'Updated phase',
  ACTIVITY_ADDED: 'Added activity',
  OWNER_ADDED: 'Added owner',
  OWNER_REMOVED: 'Removed owner',
  COMMENT_ADDED: 'Added comment',
  LINK_ADDED: 'Added link',
  INTEGRATION_UPDATE: 'Updated integrations',
  ARCHIVED: 'Archived',
  RESTORED: 'Restored'
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

// Phase 3: Stale threshold in business days
const STALE_THRESHOLD_BUSINESS_DAYS = 14;

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

// Phase 3: Calculate business days between two dates
const getBusinessDaysDiff = (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  let count = 0;
  const current = new Date(from);
  
  while (current < to) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
};

// Phase 3: Check if engagement is stale
const isEngagementStale = (engagement) => {
  if (engagement.isArchived) return false;
  const lastDate = engagement.lastActivity || engagement.startDate;
  if (!lastDate) return false;
  const businessDays = getBusinessDaysDiff(lastDate, new Date());
  return businessDays >= STALE_THRESHOLD_BUSINESS_DAYS;
};

// Phase 3: Get days since last activity
const getDaysSinceActivity = (engagement) => {
  const lastDate = engagement.lastActivity || engagement.startDate;
  if (!lastDate) return 0;
  return getBusinessDaysDiff(lastDate, new Date());
};

// Helper to generate a temporary ID for optimistic updates
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ========== MEMOIZED COMPONENTS ==========

// Memoized OwnersDisplay component
const OwnersDisplay = React.memo(({ ownerIds, size = 'md', getOwnerInfo, currentUserId }) => {
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const overlapClass = size === 'sm' ? '-ml-2' : '-ml-3';
  
  return (
    <div className="flex items-center">
      {ownerIds?.slice(0, 3).map((ownerId, index) => {
        const owner = getOwnerInfo(ownerId);
        const isCurrentUser = ownerId === currentUserId;
        const isInactive = owner.isActive === false;
        return (
          <div
            key={ownerId}
            className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white ${
              isInactive ? 'bg-gray-300 text-gray-500' :
              isCurrentUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            } ${index > 0 ? overlapClass : ''}`}
            title={`${owner.name}${isInactive ? ' (Inactive)' : ''}`}
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
});

// Memoized StaleBadge component
const StaleBadge = React.memo(({ daysSinceActivity }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {daysSinceActivity}d stale
  </span>
));

// Memoized NotificationBadge component
const NotificationBadge = React.memo(({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  );
});

// ========== AVATAR MENU COMPONENT ==========
const AvatarMenu = ({ currentUser, onTeamClick, onEngagementsClick, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape to close
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
          {currentUser?.initials}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
          style={{ animation: 'avatarMenuFadeIn 0.15s ease-out' }}
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                {currentUser?.initials}
              </div>
              <p className="font-medium text-gray-900">{currentUser?.name}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Team Management - Only for Admins */}
            {currentUser?.isAdmin && (
              <>
                <button
                  onClick={() => {
                    onTeamClick();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Team Management</p>
                    <p className="text-xs text-gray-500">Manage users & permissions</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onEngagementsClick();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Engagement Management</p>
                    <p className="text-xs text-gray-500">Delete engagements</p>
                  </div>
                </button>
              </>
            )}

            {/* Divider before Sign Out */}
            <div className="my-1 border-t border-gray-100" />

            {/* Sign Out */}
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Sign Out</p>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes avatarMenuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ========== LINK MODAL COMPONENT ==========
const LinkModal = ({ isOpen, phaseId, phaseLabel, onClose, onAdd }) => {
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('LinkModal handleSubmit:', { phaseId, title, url });
    if (title.trim() && url.trim() && phaseId) {
      onAdd(phaseId, { title: title.trim(), url: url.trim() });
    } else {
      console.log('Missing data:', { phaseId, title: title.trim(), url: url.trim() });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <form 
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 className="text-xl font-medium text-gray-900 mb-6">
          Add Link to {phaseLabel}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="link-title-input" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="link-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Architecture Diagram"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="link-url-input" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              id="link-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://..."
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >Cancel</button>
          <button 
            type="submit"
            disabled={!title.trim() || !url.trim()}
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >Add Link</button>
        </div>
      </form>
    </div>
  );
};

// ========== DELETE CONFIRMATION MODAL ==========
const DeleteEngagementModal = ({ isOpen, engagement, cascadeInfo, onClose, onConfirm, isDeleting }) => {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!isOpen || !engagement) return null;

  const canDelete = confirmText.toLowerCase() === engagement.company.toLowerCase();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900">Delete Engagement</h3>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to permanently delete <strong>{engagement.company}</strong>. This action cannot be undone.
        </p>

        {/* Cascade Impact */}
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-red-800 mb-2">The following will be permanently deleted:</p>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• {cascadeInfo.phases} phase record{cascadeInfo.phases !== 1 ? 's' : ''}</li>
            <li>• {cascadeInfo.activities} activit{cascadeInfo.activities !== 1 ? 'ies' : 'y'}</li>
            <li>• {cascadeInfo.comments} comment{cascadeInfo.comments !== 1 ? 's' : ''}</li>
            <li>• {cascadeInfo.changeLogs} change log entr{cascadeInfo.changeLogs !== 1 ? 'ies' : 'y'}</li>
            <li>• {cascadeInfo.owners} owner assignment{cascadeInfo.owners !== 1 ? 's' : ''}</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <strong>{engagement.company}</strong> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Type company name..."
          />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component (inside Authenticator)
function PresalesTracker() {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [view, setView] = useState('list');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [filterStale, setFilterStale] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ date: getTodayDate(), type: 'MEETING', description: '' });
  const [newComment, setNewComment] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [engagementViews, setEngagementViews] = useState({});
  const [adminShowInactive, setAdminShowInactive] = useState(false);
  // Engagement Management state
  const [engagementAdminFilter, setEngagementAdminFilter] = useState('all');
  const [engagementAdminSearch, setEngagementAdminSearch] = useState('');
  const [deleteModalEngagement, setDeleteModalEngagement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Local form state for phase modal
  const [phaseFormData, setPhaseFormData] = useState({ status: 'PENDING', notes: '' });
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'TECHNOLOGY', dealSize: '', ownerIds: [],
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
  });

  // Initialize user and fetch data
  useEffect(() => {
    initializeUser();
  }, [user]);

  // Initialize phase form data ONLY when modal opens (not when selectedEngagement changes)
  useEffect(() => {
    if (showPhaseModal && selectedEngagement) {
      const phaseData = selectedEngagement.phases[showPhaseModal];
      setPhaseFormData({
        status: phaseData?.status || 'PENDING',
        notes: phaseData?.notes || ''
      });
    }
  }, [showPhaseModal]); // Only trigger when modal opens/closes, NOT on selectedEngagement changes

  // Helper to update a single engagement in state
  const updateEngagementInState = useCallback((engagementId, updater) => {
    setEngagements(prev => prev.map(e => 
      e.id === engagementId ? (typeof updater === 'function' ? updater(e) : { ...e, ...updater }) : e
    ));
    
    // Also update selectedEngagement if it's the same one
    setSelectedEngagement(prev => {
      if (prev?.id === engagementId) {
        return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      }
      return prev;
    });
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      const givenName = attributes.given_name || '';
      const familyName = attributes.family_name || '';
      const fullName = `${givenName} ${familyName}`.trim() || email.split('@')[0];
      
      const { data: existingMembers } = await client.models.TeamMember.list({
        filter: { email: { eq: email } }
      });
      
      let member;
      if (existingMembers.length > 0) {
        member = existingMembers[0];
      } else {
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
      
      await fetchAllData(member.id);
      
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  // OPTIMIZED: Batch fetch all data in parallel to solve N+1 query problem
  const fetchAllData = async (userId) => {
    try {
      // Parallel fetch ALL data in one batch - this is the key optimization
      const [
        membersResult,
        engagementsResult,
        phasesResult,
        activitiesResult,
        ownershipResult,
        commentsResult,
        changeLogsResult,
        viewsResult
      ] = await Promise.all([
        client.models.TeamMember.list(),
        client.models.Engagement.list(),
        client.models.Phase.list(),
        client.models.Activity.list(),
        client.models.EngagementOwner.list(),
        client.models.Comment.list(),
        client.models.ChangeLog.list(),
        userId 
          ? client.models.EngagementView.list({ filter: { visitorId: { eq: userId } } })
              .catch(() => ({ data: [] })) // Handle if EngagementView not available
          : Promise.resolve({ data: [] })
      ]);

      const allMembers = membersResult.data;
      const engagementData = engagementsResult.data;
      const allPhases = phasesResult.data;
      const allActivities = activitiesResult.data;
      const allOwnershipRecords = ownershipResult.data;
      const allComments = commentsResult.data;
      const allChangeLogs = changeLogsResult.data;
      const allViews = viewsResult.data;

      // Create lookup maps for O(1) access instead of filtering per engagement
      const phasesByEngagement = groupBy(allPhases, 'engagementId');
      const activitiesByEngagement = groupBy(allActivities, 'engagementId');
      const ownershipByEngagement = groupBy(allOwnershipRecords, 'engagementId');
      const commentsByActivity = groupBy(allComments, 'activityId');
      const changeLogsByEngagement = groupBy(allChangeLogs, 'engagementId');
      
      // Create views map
      const viewsMap = {};
      allViews.forEach(v => {
        viewsMap[v.engagementId] = v;
      });
      setEngagementViews(viewsMap);

      // Set team members
      setAllTeamMembers(allMembers);
      const activeMembers = allMembers.filter(m => m.isActive !== false);
      setTeamMembers(activeMembers);

      // Enrich engagements WITHOUT additional queries - all data is already loaded
      const enrichedEngagements = engagementData.map((eng) => {
        // Get phases for this engagement from our lookup map
        const phases = phasesByEngagement[eng.id] || [];
        
        // Get activities for this engagement from our lookup map
        const activities = activitiesByEngagement[eng.id] || [];
        
        // Get ownership records for this engagement from our lookup map
        const ownershipRecords = ownershipByEngagement[eng.id] || [];
        
        // Get change logs for this engagement from our lookup map
        const changeLogs = (changeLogsByEngagement[eng.id] || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Enrich activities with their comments from our lookup map
        const activitiesWithComments = activities
          .map((activity) => ({
            ...activity,
            comments: (commentsByActivity[activity.id] || [])
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Build phases object
        const phasesObj = {};
        phaseConfig.forEach(p => {
          const existingPhase = phases.find(ph => ph.phaseType === p.id);
          if (existingPhase) {
            const parsedLinks = parseLinks(existingPhase.links);
            phasesObj[p.id] = {
              ...existingPhase,
              links: parsedLinks
            };
          } else {
            phasesObj[p.id] = {
              phaseType: p.id,
              status: 'PENDING',
              completedDate: null,
              notes: '',
              links: []
            };
          }
        });

        // Build owner IDs list
        const ownerIds = ownershipRecords.map(o => o.teamMemberId);
        if (ownerIds.length === 0 && eng.ownerId) {
          ownerIds.push(eng.ownerId);
        }

        // Calculate unread changes
        const userView = viewsMap[eng.id];
        let unreadChanges = 0;
        if (userView && userId) {
          const lastViewed = new Date(userView.lastViewedAt);
          unreadChanges = changeLogs.filter(log => 
            new Date(log.createdAt) > lastViewed && log.userId !== userId
          ).length;
        } else if (changeLogs.length > 0 && userId) {
          unreadChanges = changeLogs.filter(log => log.userId !== userId).length;
        }

        return {
          ...eng,
          phases: phasesObj,
          activities: activitiesWithComments,
          ownerIds: ownerIds,
          ownershipRecords: ownershipRecords,
          changeLogs: changeLogs,
          unreadChanges: unreadChanges,
          isStale: isEngagementStale(eng),
          daysSinceActivity: getDaysSinceActivity(eng)
        };
      });

      setEngagements(enrichedEngagements);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Background log - doesn't block UI
  const logChangeAsync = (engagementId, changeType, description, previousValue = null, newValue = null) => {
    if (!currentUser) return;
    
    client.models.ChangeLog.create({
      engagementId: engagementId,
      userId: currentUser.id,
      changeType: changeType,
      description: description,
      previousValue: previousValue,
      newValue: newValue
    }).catch(e => console.error('Error logging change:', e));
  };

  const updateEngagementView = async (engagementId) => {
    if (!currentUser) return;
    
    try {
      const existingView = engagementViews[engagementId];
      
      if (existingView) {
        await client.models.EngagementView.update({
          id: existingView.id,
          lastViewedAt: new Date().toISOString()
        });
      } else {
        await client.models.EngagementView.create({
          engagementId: engagementId,
          visitorId: currentUser.id,
          lastViewedAt: new Date().toISOString()
        });
      }
      
      setEngagementViews(prev => ({
        ...prev,
        [engagementId]: { ...prev[engagementId], lastViewedAt: new Date().toISOString() }
      }));
      
      updateEngagementInState(engagementId, { unreadChanges: 0 });
    } catch (e) {
      console.error('Error updating view:', e);
    }
  };

  const handleToggleUserActive = async (memberId, currentStatus) => {
    if (!currentUser?.isAdmin) return;
    
    if (memberId === currentUser.id) {
      alert('You cannot deactivate yourself.');
      return;
    }
    
    const newStatus = !currentStatus;
    
    // Optimistic update
    setAllTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isActive: newStatus } : m
    ));
    setTeamMembers(prev => 
      newStatus 
        ? [...prev, allTeamMembers.find(m => m.id === memberId)].filter(Boolean)
        : prev.filter(m => m.id !== memberId)
    );
    
    try {
      await client.models.TeamMember.update({
        id: memberId,
        isActive: newStatus
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      // Rollback on error
      setAllTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isActive: currentStatus } : m
      ));
      await fetchAllData(currentUser?.id);
    }
  };

  const handleToggleUserAdmin = async (memberId, currentStatus) => {
    if (!currentUser?.isAdmin) return;
    
    if (memberId === currentUser.id) {
      alert('You cannot remove your own admin status.');
      return;
    }
    
    const newStatus = !currentStatus;
    
    // Optimistic update
    setAllTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isAdmin: newStatus } : m
    ));
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isAdmin: newStatus } : m
    ));
    
    try {
      await client.models.TeamMember.update({
        id: memberId,
        isAdmin: newStatus
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      // Rollback on error
      setAllTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isAdmin: currentStatus } : m
      ));
      setTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isAdmin: currentStatus } : m
      ));
    }
  };

  // Memoized owner info lookup function
  const getOwnerInfo = useCallback((ownerId) => {
    const member = allTeamMembers.find(m => m.id === ownerId);
    return member || { name: 'Unknown', initials: '?' };
  }, [allTeamMembers]);

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

  const isCurrentUserOwner = (engagement) => {
    return engagement.ownerIds?.includes(currentUser?.id) || engagement.ownerId === currentUser?.id;
  };

  // MEMOIZED: Filtered engagements - only recalculates when dependencies change
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

  // MEMOIZED: Stale count - only recalculates when dependencies change
  const staleCount = useMemo(() => {
    return engagements.filter(e => 
      !e.isArchived && e.isStale && 
      (filterOwner === 'all' || e.ownerIds?.includes(currentUser?.id) || e.ownerId === currentUser?.id)
    ).length;
  }, [engagements, filterOwner, currentUser?.id]);

  // Get cascade info for an engagement
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

  // Delete engagement with cascade
  const handleDeleteEngagement = async () => {
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
  };

  // Create engagement still uses fetchAllData since we need server-generated IDs
  const handleCreateEngagement = async () => {
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
        slackChannel: newEngagement.slackChannel || null,
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
        salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
      });
      setView('list');
      
    } catch (error) {
      console.error('Error creating engagement:', error);
    }
  };

  const handleAddOwner = async (teamMemberId) => {
    if (!selectedEngagement || selectedEngagement.ownerIds?.includes(teamMemberId)) return;
    
    const tempId = generateTempId();
    const addedMember = getOwnerInfo(teamMemberId);
    
    // Optimistic update
    const newOwnerIds = [...(selectedEngagement.ownerIds || []), teamMemberId];
    const tempOwnershipRecord = {
      id: tempId,
      engagementId: selectedEngagement.id,
      teamMemberId: teamMemberId,
      role: 'secondary',
      addedAt: new Date().toISOString()
    };
    
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      ownerIds: newOwnerIds,
      ownershipRecords: [...(eng.ownershipRecords || []), tempOwnershipRecord]
    }));
    
    try {
      const { data: newRecord } = await client.models.EngagementOwner.create({
        engagementId: selectedEngagement.id,
        teamMemberId: teamMemberId,
        role: 'secondary',
        addedAt: new Date().toISOString()
      });
      
      // Replace temp record with real one
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownershipRecords: eng.ownershipRecords.map(r => 
          r.id === tempId ? newRecord : r
        )
      }));
      
      logChangeAsync(selectedEngagement.id, 'OWNER_ADDED', `Added ${addedMember.name} as owner`);
      
    } catch (error) {
      console.error('Error adding owner:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownerIds: eng.ownerIds.filter(id => id !== teamMemberId),
        ownershipRecords: eng.ownershipRecords.filter(r => r.id !== tempId)
      }));
    }
  };

  const handleRemoveOwner = async (teamMemberId) => {
    if (!selectedEngagement) return;
    
    if (selectedEngagement.ownerIds?.length <= 1) {
      alert('Cannot remove the last owner. Add another owner first.');
      return;
    }
    
    const removedMember = getOwnerInfo(teamMemberId);
    const ownershipRecord = selectedEngagement.ownershipRecords?.find(
      o => o.teamMemberId === teamMemberId
    );
    
    // Store for rollback
    const previousOwnerIds = [...selectedEngagement.ownerIds];
    const previousOwnershipRecords = [...(selectedEngagement.ownershipRecords || [])];
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      ownerIds: eng.ownerIds.filter(id => id !== teamMemberId),
      ownershipRecords: eng.ownershipRecords?.filter(r => r.teamMemberId !== teamMemberId) || []
    }));
    
    try {
      if (ownershipRecord) {
        await client.models.EngagementOwner.delete({ id: ownershipRecord.id });
      }
      
      logChangeAsync(selectedEngagement.id, 'OWNER_REMOVED', `Removed ${removedMember.name} as owner`);
      
    } catch (error) {
      console.error('Error removing owner:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        ownerIds: previousOwnerIds,
        ownershipRecords: previousOwnershipRecords
      }));
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.date || !newActivity.description || !selectedEngagement) return;
    
    const tempId = generateTempId();
    const tempActivity = {
      id: tempId,
      engagementId: selectedEngagement.id,
      date: newActivity.date,
      type: newActivity.type,
      description: newActivity.description,
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: [tempActivity, ...eng.activities],
      lastActivity: newActivity.date,
      isStale: false,
      daysSinceActivity: 0
    }));
    
    setNewActivity({ date: getTodayDate(), type: 'MEETING', description: '' });
    setShowActivityModal(false);
    
    try {
      const { data: createdActivity } = await client.models.Activity.create({
        engagementId: selectedEngagement.id,
        date: newActivity.date,
        type: newActivity.type,
        description: newActivity.description
      });
      
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        lastActivity: newActivity.date
      });
      
      // Replace temp with real
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === tempId ? { ...createdActivity, comments: [] } : a
        )
      }));
      
      logChangeAsync(
        selectedEngagement.id, 
        'ACTIVITY_ADDED', 
        `Added ${activityTypeLabels[newActivity.type]}: ${newActivity.description.substring(0, 50)}${newActivity.description.length > 50 ? '...' : ''}`
      );
      
    } catch (error) {
      console.error('Error adding activity:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.filter(a => a.id !== tempId)
      }));
    }
  };

  const handleAddComment = async (activityId) => {
    const commentText = newComment[activityId];
    if (!commentText?.trim() || !currentUser) return;
    
    const tempId = generateTempId();
    const tempComment = {
      id: tempId,
      activityId: activityId,
      authorId: currentUser.id,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: eng.activities.map(a => 
        a.id === activityId 
          ? { ...a, comments: [...(a.comments || []), tempComment] }
          : a
      )
    }));
    
    setNewComment(prev => ({ ...prev, [activityId]: '' }));
    
    try {
      const { data: createdComment } = await client.models.Comment.create({
        activityId: activityId,
        authorId: currentUser.id,
        text: commentText.trim()
      });
      
      // Replace temp with real
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === activityId 
            ? { ...a, comments: a.comments.map(c => c.id === tempId ? createdComment : c) }
            : a
        )
      }));
      
      logChangeAsync(
        selectedEngagement.id, 
        'COMMENT_ADDED', 
        `Added comment: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`
      );
      
    } catch (error) {
      console.error('Error adding comment:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === activityId 
            ? { ...a, comments: a.comments.filter(c => c.id !== tempId) }
            : a
        )
      }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedEngagement) return;
    
    // Find the activity and comment for rollback
    let targetActivity = null;
    let deletedComment = null;
    
    for (const activity of selectedEngagement.activities) {
      const comment = activity.comments?.find(c => c.id === commentId);
      if (comment) {
        targetActivity = activity;
        deletedComment = comment;
        break;
      }
    }
    
    if (!targetActivity || !deletedComment) return;
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      activities: eng.activities.map(a => 
        a.id === targetActivity.id 
          ? { ...a, comments: a.comments.filter(c => c.id !== commentId) }
          : a
      )
    }));
    
    try {
      await client.models.Comment.delete({ id: commentId });
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        activities: eng.activities.map(a => 
          a.id === targetActivity.id 
            ? { ...a, comments: [...a.comments, deletedComment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) }
            : a
        )
      }));
    }
  };

  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  // Save phase changes
  const handleSavePhase = async () => {
    if (!selectedEngagement || !showPhaseModal) return;
    
    const phaseId = showPhaseModal;
    const updates = { status: phaseFormData.status, notes: phaseFormData.notes };
    const engagementId = selectedEngagement.id;
    
    const existingPhase = selectedEngagement.phases[phaseId];
    const previousStatus = existingPhase?.status || 'PENDING';
    const previousNotes = existingPhase?.notes || '';
    
    // Calculate new current phase if completing
    let newCurrentPhase = selectedEngagement.currentPhase;
    if (updates.status === 'COMPLETE') {
      const phaseIndex = phaseConfig.findIndex(p => p.id === phaseId);
      if (phaseIndex < phaseConfig.length - 1) {
        newCurrentPhase = phaseConfig[phaseIndex + 1].id;
      }
    }
    
    // Optimistic update
    updateEngagementInState(engagementId, (eng) => ({
      ...eng,
      currentPhase: newCurrentPhase,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          status: updates.status,
          notes: updates.notes,
          completedDate: updates.status === 'COMPLETE' ? getTodayDate() : eng.phases[phaseId]?.completedDate
        }
      }
    }));
    
    setShowPhaseModal(null);
    
    try {
      if (existingPhase && existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          status: updates.status,
          notes: updates.notes,
          completedDate: updates.status === 'COMPLETE' ? getTodayDate() : existingPhase.completedDate
        });
      } else {
        await client.models.Phase.create({
          engagementId: engagementId,
          phaseType: phaseId,
          status: updates.status || 'PENDING',
          completedDate: updates.status === 'COMPLETE' ? getTodayDate() : null,
          notes: updates.notes || null,
          links: null
        });
      }
      
      if (newCurrentPhase !== selectedEngagement.currentPhase) {
        await client.models.Engagement.update({
          id: engagementId,
          currentPhase: newCurrentPhase
        });
      }
      
      if (updates.status !== previousStatus) {
        logChangeAsync(
          engagementId,
          'PHASE_UPDATE',
          `${phaseLabels[phaseId]} phase changed to ${updates.status.toLowerCase().replace('_', ' ')}`,
          previousStatus,
          updates.status
        );
      }
      
    } catch (error) {
      console.error('Error updating phase:', error);
      // Rollback
      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        currentPhase: selectedEngagement.currentPhase,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            status: previousStatus,
            notes: previousNotes
          }
        }
      }));
    }
  };

  const handleAddLink = async (phaseId, linkData) => {
    if (!linkData?.title || !linkData?.url || !selectedEngagement || !phaseId) {
      return;
    }
    
    const engagementId = selectedEngagement.id;
    const linkToAdd = { title: linkData.title, url: linkData.url };
    const existingPhase = selectedEngagement.phases[phaseId];
    const currentLinks = parseLinks(existingPhase?.links);
    
    // Optimistic update
    updateEngagementInState(engagementId, (eng) => ({
      ...eng,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          links: [...currentLinks, linkToAdd]
        }
      }
    }));
    
    setShowLinkModal(null);
    
    try {
      // Fetch fresh phase data from database
      const { data: freshPhases } = await client.models.Phase.list({
        filter: { engagementId: { eq: engagementId } }
      });
      const freshPhase = freshPhases.find(p => p.phaseType === phaseId);
      
      const freshLinks = parseLinks(freshPhase?.links);
      const updatedLinks = [...freshLinks, linkToAdd];
      
      if (freshPhase && freshPhase.id) {
        await client.models.Phase.update({
          id: freshPhase.id,
          links: JSON.stringify(updatedLinks)
        });
      } else {
        await client.models.Phase.create({
          engagementId: engagementId,
          phaseType: phaseId,
          status: 'PENDING',
          completedDate: null,
          notes: null,
          links: JSON.stringify(updatedLinks)
        });
      }
      
      logChangeAsync(
        engagementId,
        'LINK_ADDED',
        `Added link "${linkToAdd.title}" to ${phaseLabels[phaseId]} phase`
      );
      
    } catch (error) {
      console.error('Error adding link:', error);
      // Rollback
      updateEngagementInState(engagementId, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            links: currentLinks
          }
        }
      }));
      alert('Error saving link: ' + error.message);
    }
  };

  const handleRemoveLink = async (phaseId, linkIndex) => {
    if (!selectedEngagement) return;
    
    const existingPhase = selectedEngagement.phases[phaseId];
    const currentLinks = parseLinks(existingPhase?.links);
    const removedLink = currentLinks[linkIndex];
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, (eng) => ({
      ...eng,
      phases: {
        ...eng.phases,
        [phaseId]: {
          ...eng.phases[phaseId],
          links: currentLinks.filter((_, i) => i !== linkIndex)
        }
      }
    }));
    
    try {
      const updatedLinks = currentLinks.filter((_, i) => i !== linkIndex);
      
      if (existingPhase.id) {
        await client.models.Phase.update({
          id: existingPhase.id,
          links: JSON.stringify(updatedLinks)
        });
      }
      
    } catch (error) {
      console.error('Error removing link:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, (eng) => ({
        ...eng,
        phases: {
          ...eng.phases,
          [phaseId]: {
            ...eng.phases[phaseId],
            links: currentLinks
          }
        }
      }));
    }
  };

  const handleUpdateIntegrations = async (updates) => {
    if (!selectedEngagement) return;
    
    const previousValues = {
      salesforceId: selectedEngagement.salesforceId,
      salesforceUrl: selectedEngagement.salesforceUrl,
      jiraTicket: selectedEngagement.jiraTicket,
      jiraUrl: selectedEngagement.jiraUrl,
      slackChannel: selectedEngagement.slackChannel
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, updates);
    setShowIntegrationsModal(false);
    
    try {
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        ...updates
      });
      
      logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', 'Updated integration links');
      
    } catch (error) {
      console.error('Error updating integrations:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, previousValues);
    }
  };

  const handleUpdateDetails = async (updates) => {
    if (!selectedEngagement) return;
    
    const previousValues = {
      company: selectedEngagement.company,
      contactName: selectedEngagement.contactName,
      contactEmail: selectedEngagement.contactEmail,
      contactPhone: selectedEngagement.contactPhone,
      industry: selectedEngagement.industry,
      dealSize: selectedEngagement.dealSize
    };
    
    // Optimistic update
    updateEngagementInState(selectedEngagement.id, updates);
    setShowEditDetailsModal(false);
    
    try {
      await client.models.Engagement.update({
        id: selectedEngagement.id,
        ...updates
      });
      
      // Log changes for significant updates
      const changes = [];
      if (updates.company !== previousValues.company) changes.push(`company to "${updates.company}"`);
      if (updates.contactName !== previousValues.contactName) changes.push(`contact to "${updates.contactName}"`);
      if (updates.industry !== previousValues.industry) changes.push(`industry to ${industryLabels[updates.industry]}`);
      if (updates.dealSize !== previousValues.dealSize) changes.push(`deal size to "${updates.dealSize || 'N/A'}"`);
      
      if (changes.length > 0) {
        logChangeAsync(selectedEngagement.id, 'INTEGRATION_UPDATE', `Updated ${changes.join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error updating details:', error);
      // Rollback
      updateEngagementInState(selectedEngagement.id, previousValues);
    }
  };

  const handleToggleArchive = async (engagementId, archive) => {
    const engagement = engagements.find(e => e.id === engagementId);
    if (!engagement) return;
    
    const previousValue = engagement.isArchived;
    
    // Optimistic update
    updateEngagementInState(engagementId, { isArchived: archive });
    
    if (selectedEngagement?.id === engagementId) {
      setSelectedEngagement(null);
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
  };

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
          
          {/* Avatar Menu */}
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

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by company or contact..."
                value={engagementAdminSearch}
                onChange={(e) => setEngagementAdminSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Filters */}
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

            {/* Table */}
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
                    setSelectedEngagement(engagement); 
                    setView('detail'); 
                    updateEngagementView(engagement.id);
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
                                  onClick={(e) => { e.stopPropagation(); handleRemoveLink(phase.id, linkIndex); }}
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
                                          <button onClick={() => handleDeleteComment(comment.id)}
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
                    >Cancel</button>
                    <button 
                      onClick={handleAddActivity}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                    >Save Activity</button>
                  </div>
                </div>
              </div>
            )}

            {/* FIXED Phase Edit Modal - Now uses local form state */}
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
                        value={phaseFormData.status}
                        onChange={e => setPhaseFormData(prev => ({ ...prev, status: e.target.value }))}
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
                        value={phaseFormData.notes}
                        onChange={e => setPhaseFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                        placeholder="Key findings, decisions, blockers..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setShowPhaseModal(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >Cancel</button>
                    <button 
                      onClick={handleSavePhase}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                    >Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Link Modal - Using separate component */}
            <LinkModal
              isOpen={showLinkModal !== null}
              phaseId={showLinkModal}
              phaseLabel={phaseConfig.find(p => p.id === showLinkModal)?.label || ''}
              onClose={() => setShowLinkModal(null)}
              onAdd={(phaseId, linkData) => handleAddLink(phaseId, linkData)}
            />

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
                        <input type="text" name="salesforceId" defaultValue={selectedEngagement.salesforceId || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="006Dn000004XXXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
                        <input type="url" name="salesforceUrl" defaultValue={selectedEngagement.salesforceUrl || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="https://plainid.lightning.force.com/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
                        <input type="text" name="jiraTicket" defaultValue={selectedEngagement.jiraTicket || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="SE-1234" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                        <input type="url" name="jiraUrl" defaultValue={selectedEngagement.jiraUrl || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="https://plainid.atlassian.net/browse/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
                        <input type="text" name="slackChannel" defaultValue={selectedEngagement.slackChannel || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="#customer-poc" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setShowIntegrationsModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                      >Cancel</button>
                      <button type="submit"
                        className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                      >Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Details Modal */}
            {showEditDetailsModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditDetailsModal(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Edit Engagement Details</h3>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleUpdateDetails({
                      company: formData.get('company') || selectedEngagement.company,
                      contactName: formData.get('contactName') || selectedEngagement.contactName,
                      contactEmail: formData.get('contactEmail') || null,
                      contactPhone: formData.get('contactPhone') || null,
                      industry: formData.get('industry') || selectedEngagement.industry,
                      dealSize: formData.get('dealSize') || null
                    });
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                        <input type="text" name="company" defaultValue={selectedEngagement.company}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Acme Corporation" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                        <input type="text" name="contactName" defaultValue={selectedEngagement.contactName}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="John Smith" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        <input type="email" name="contactEmail" defaultValue={selectedEngagement.contactEmail || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="john@acme.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input type="tel" name="contactPhone" defaultValue={selectedEngagement.contactPhone || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="+1 (555) 123-4567" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <select name="industry" defaultValue={selectedEngagement.industry}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                          {industries.map(ind => (
                            <option key={ind} value={ind}>{industryLabels[ind]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
                        <input type="text" name="dealSize" defaultValue={selectedEngagement.dealSize || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="$100K" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setShowEditDetailsModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                      >Cancel</button>
                      <button type="submit"
                        className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                      >Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Owners Modal */}
            {showOwnersModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowOwnersModal(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Manage Owners</h3>
                  
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Current Owners</p>
                    <div className="space-y-2">
                      {selectedEngagement.ownerIds?.map(ownerId => {
                        const owner = getOwnerInfo(ownerId);
                        const isOnlyOwner = selectedEngagement.ownerIds?.length === 1;
                        const isInactive = owner.isActive === false;
                        
                        return (
                          <div key={ownerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isInactive ? 'bg-gray-300 text-gray-500' :
                                ownerId === currentUser?.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>{owner.initials}</div>
                              <div>
                                <span className="font-medium text-gray-900">{owner.name}</span>
                                {isInactive && <span className="ml-2 text-xs text-gray-500">(Inactive)</span>}
                              </div>
                            </div>
                            {!isOnlyOwner && (
                              <button onClick={() => handleRemoveOwner(ownerId)}
                                className="text-sm text-red-500 hover:text-red-700">Remove</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
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
                            <button onClick={() => handleAddOwner(member.id)}
                              className="text-sm text-blue-600 hover:text-blue-800">Add</button>
                          </div>
                        ))
                      }
                      {teamMembers.filter(m => !selectedEngagement.ownerIds?.includes(m.id)).length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">All active team members are already owners</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowOwnersModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                    >Done</button>
                  </div>
                </div>
              </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHistoryModal(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Change History</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {selectedEngagement.changeLogs?.length > 0 ? (
                      selectedEngagement.changeLogs.map((log) => {
                        const author = getOwnerInfo(log.userId);
                        const isOwnChange = log.userId === currentUser?.id;
                        
                        return (
                          <div key={log.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              isOwnChange ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>{author.initials}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{author.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  {changeTypeLabels[log.changeType] || log.changeType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 text-center py-8">No change history yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <button onClick={() => setShowHistoryModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                    >Close</button>
                  </div>
                </div>
              </div>
            )}
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

      {/* Delete Engagement Modal */}
      <DeleteEngagementModal
        isOpen={deleteModalEngagement !== null}
        engagement={deleteModalEngagement}
        cascadeInfo={getCascadeInfo(deleteModalEngagement)}
        onClose={() => setDeleteModalEngagement(null)}
        onConfirm={handleDeleteEngagement}
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
