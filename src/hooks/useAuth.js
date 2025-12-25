import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { ADMIN_EMAIL, ALLOWED_DOMAIN } from '../constants';

const client = generateClient();

/**
 * Authentication hook that manages user state and auth operations
 * 
 * @param {Function} setCurrentUser - Setter for current user in parent state
 * @param {Array} teamMembers - List of team members to find current user
 * @returns {Object} Auth state and operations
 */
const useAuth = (setCurrentUser, teamMembers = []) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  /**
   * Check if email domain is allowed
   */
  const isAllowedDomain = useCallback((email) => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return domain === ALLOWED_DOMAIN;
  }, []);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback((email) => {
    return email === ADMIN_EMAIL;
  }, []);

  /**
   * Find or create team member for authenticated user
   */
  const findOrCreateTeamMember = useCallback(async (email, name) => {
    try {
      // First, try to find existing team member
      const existingMember = teamMembers.find(m => m.email === email);
      if (existingMember) {
        return existingMember;
      }

      // If not found in local state, query the database
      const { data: members } = await client.models.TeamMember.list({
        filter: { email: { eq: email } }
      });

      if (members && members.length > 0) {
        return members[0];
      }

      // Create new team member if doesn't exist
      const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : email.substring(0, 2).toUpperCase();

      const { data: newMember } = await client.models.TeamMember.create({
        email,
        name: name || email.split('@')[0],
        initials,
        isAdmin: isAdmin(email),
        isActive: true,
        isSystemUser: false
      });

      return newMember;
    } catch (error) {
      console.error('Error finding/creating team member:', error);
      return null;
    }
  }, [teamMembers, isAdmin]);

  /**
   * Initialize auth state on mount
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const email = attributes.email;
      setUserEmail(email);

      if (!isAllowedDomain(email)) {
        setAuthError('Unauthorized domain');
        setIsAuthenticated(false);
        await signOut();
        return;
      }

      setIsAuthenticated(true);
      
      // Find or create team member
      const teamMember = await findOrCreateTeamMember(email, attributes.name);
      if (teamMember && setCurrentUser) {
        setCurrentUser(teamMember);
      }
    } catch (error) {
      // Not authenticated
      setIsAuthenticated(false);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAllowedDomain, findOrCreateTeamMember, setCurrentUser]);

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      if (setCurrentUser) {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [setCurrentUser]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Re-check when team members load (to set current user)
  useEffect(() => {
    if (isAuthenticated && userEmail && teamMembers.length > 0) {
      const member = teamMembers.find(m => m.email === userEmail);
      if (member && setCurrentUser) {
        setCurrentUser(member);
      }
    }
  }, [isAuthenticated, userEmail, teamMembers, setCurrentUser]);

  return {
    isAuthenticated,
    isLoading,
    authError,
    userEmail,
    isAdmin: isAdmin(userEmail),
    checkAuth,
    signOut: handleSignOut
  };
};

export default useAuth;
