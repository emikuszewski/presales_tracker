import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { ADMIN_EMAIL, ALLOWED_DOMAIN } from '../constants';

const useAuth = (setCurrentUser, teamMembers = []) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const isAllowedDomain = useCallback((email) => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return domain === ALLOWED_DOMAIN;
  }, []);

  const isAdmin = useCallback((email) => {
    return email === ADMIN_EMAIL;
  }, []);

  const findOrCreateTeamMember = useCallback(async (email, name) => {
    try {
      const existingMember = teamMembers.find(m => m.email === email);
      if (existingMember) {
        return existingMember;
      }

      const client = generateClient();
      const { data: members } = await client.models.TeamMember.list({
        filter: { email: { eq: email } }
      });

      if (members && members.length > 0) {
        return members[0];
      }

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
      
      const teamMember = await findOrCreateTeamMember(email, attributes.name);
      if (teamMember && setCurrentUser) {
        setCurrentUser(teamMember);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAllowedDomain, findOrCreateTeamMember, setCurrentUser]);

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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
