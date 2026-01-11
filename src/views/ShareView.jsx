import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import DetailView from './DetailView';
import { useShareLinks } from '../hooks';
import {
  groupBy,
  parseLinks,
  safeJsonParse
} from '../utils';
import { phaseConfig } from '../constants';

/**
 * ShareView - Handles share link validation and read-only engagement display
 * 
 * This component:
 * 1. Validates the share token
 * 2. Loads the engagement data
 * 3. Redirects owners/admins to the full view
 * 4. Renders DetailView in read-only mode for other authenticated users
 */
const ShareView = ({ currentUser, allTeamMembers, salesReps }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [activeTab, setActiveTab] = useState('progress');
  
  // Get tab from URL if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['progress', 'activity', 'notes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Create client for data fetching
  const client = useMemo(() => {
    return generateClient({ authMode: 'userPool' });
  }, []);
  
  // Share links hook for validation
  const { validateToken } = useShareLinks({ client });
  
  // Build team members map for owner info lookup
  const teamMembersMap = useMemo(() => {
    const map = {};
    if (allTeamMembers) {
      allTeamMembers.forEach((member) => {
        map[member.id] = member;
      });
    }
    return map;
  }, [allTeamMembers]);
  
  // Build sales reps map
  const salesRepsMap = useMemo(() => {
    const map = {};
    if (salesReps) {
      salesReps.forEach((rep) => {
        map[rep.id] = rep;
      });
    }
    return map;
  }, [salesReps]);
  
  // Get owner info helper
  const getOwnerInfo = useCallback((ownerId) => {
    if (!ownerId) return null;
    return teamMembersMap[ownerId] || null;
  }, [teamMembersMap]);
  
  // Load engagement data
  const loadEngagement = useCallback(async (engagementId) => {
    try {
      // Fetch engagement
      const engResult = await client.models.Engagement.get({ id: engagementId });
      if (!engResult.data) {
        throw new Error('Engagement not found');
      }
      
      const eng = engResult.data;
      
      // Fetch related data
      const [phasesResult, activitiesResult, ownersResult, notesResult] = await Promise.all([
        client.models.Phase.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.Activity.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.EngagementOwner.list({ filter: { engagementId: { eq: engagementId } } }),
        client.models.PhaseNote.list({ filter: { engagementId: { eq: engagementId } } })
      ]);
      
      const phases = phasesResult.data || [];
      const activities = activitiesResult.data || [];
      const owners = ownersResult.data || [];
      const phaseNotes = notesResult.data || [];
      
      // Fetch comments for activities
      const commentsByActivity = {};
      if (activities.length > 0) {
        const activityIds = activities.map(a => a.id);
        for (const activityId of activityIds) {
          const commentsResult = await client.models.Comment.list({
            filter: { activityId: { eq: activityId } }
          });
          commentsByActivity[activityId] = commentsResult.data || [];
        }
      }
      
      // Build phases object
      const phasesObj = {};
      phaseConfig.forEach((p) => {
        const existingPhase = phases.find((ph) => ph.phaseType === p.id);
        if (existingPhase) {
          const parsedLinks = parseLinks(existingPhase.links);
          phasesObj[p.id] = { ...existingPhase, links: parsedLinks };
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
      
      // Build activities with comments
      const activitiesWithComments = activities
        .map((activity) => ({
          ...activity,
          comments: (commentsByActivity[activity.id] || [])
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Get owner IDs
      const ownerIds = owners.map((o) => o.teamMemberId);
      if (ownerIds.length === 0 && eng.ownerId) {
        ownerIds.push(eng.ownerId);
      }
      
      // Parse competitors
      const competitors = safeJsonParse(eng.competitors, []);
      
      // Get sales rep name
      let salesRepName = null;
      if (eng.salesRepId && salesRepsMap[eng.salesRepId]) {
        salesRepName = salesRepsMap[eng.salesRepId].name;
      }
      
      // Build notes by phase
      const notesByPhase = {};
      phaseConfig.forEach((p) => {
        notesByPhase[p.id] = phaseNotes
          .filter((n) => n.phaseType === p.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      const totalNotesCount = phaseNotes.length;
      
      // Build enriched engagement
      const enrichedEngagement = {
        ...eng,
        phases: phasesObj,
        activities: activitiesWithComments,
        ownerIds: ownerIds,
        competitors: competitors,
        salesRepName: salesRepName,
        notesByPhase: notesByPhase,
        totalNotesCount: totalNotesCount,
        engagementStatus: eng.engagementStatus || 'ACTIVE'
      };
      
      return enrichedEngagement;
    } catch (err) {
      console.error('[ShareView] Error loading engagement:', err);
      throw err;
    }
  }, [client, salesRepsMap]);
  
  // Validate token and load engagement
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Validate the token
        const validation = await validateToken(token);
        
        if (!isMounted) return;
        
        if (!validation.isValid) {
          setError(validation.reason || 'This link is no longer valid');
          setLoading(false);
          return;
        }
        
        const engagementId = validation.engagementId;
        
        // Load the engagement
        const loadedEngagement = await loadEngagement(engagementId);
        
        if (!isMounted) return;
        
        // Check if current user is owner or admin - redirect to full view
        if (currentUser) {
          const isOwner = loadedEngagement.ownerIds.includes(currentUser.id);
          const isAdmin = currentUser.isAdmin;
          
          if (isOwner || isAdmin) {
            // Redirect to full view
            navigate(`/engagement/${engagementId}`, { replace: true });
            return;
          }
        }
        
        setEngagement(loadedEngagement);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('[ShareView] Error:', err);
        setError('Unable to load engagement');
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, [token, validateToken, loadEngagement, currentUser, navigate]);
  
  // Set document title
  useEffect(() => {
    document.title = 'Shared Engagement - SE Tracker';
    return () => {
      document.title = 'SE Tracker';
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading shared engagement...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            {error}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This share link may have expired or been revoked.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // No engagement loaded
  if (!engagement) {
    return null;
  }
  
  // Active team members for the UI
  const activeTeamMembers = allTeamMembers ? allTeamMembers.filter((m) => m.isActive) : [];
  
  return (
    <DetailView
      engagement={engagement}
      teamMembers={activeTeamMembers}
      salesReps={salesReps}
      currentUser={currentUser}
      getOwnerInfo={getOwnerInfo}
      detail={null}
      onToggleArchive={() => {}}
      onBack={() => navigate('/')}
      onModalStateChange={() => {}}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={null}
      readOnly={true}
      client={client}
      logChangeAsync={null}
    />
  );
};

export default ShareView;
