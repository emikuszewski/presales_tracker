import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { ADMIN_EMAIL, ALLOWED_DOMAIN } from '../constants';

const useAuth = (setCurrentUser, teamMembers) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const members = teamMembers || [];

  const isAllowedDomain = useCallback(function(email) {
    if (!email) return false;
    var domain = email.split('@')[1];
    return domain === ALLOWED_DOMAIN;
  }, []);

  const isAdmin = useCallback(function(email) {
    return email === ADMIN_EMAIL;
  }, []);

  const findOrCreateTeamMember = useCallback(async function(email, name) {
    try {
      var existingMember = members.find(function(m) { return m.email === email; });
      if (existingMember) {
        return existingMember;
      }

      var client = generateClient();
      var result = await client.models.TeamMember.list({
        filter: { email: { eq: email } }
      });

      if (result.data && result.data.length > 0) {
        return result.data[0];
      }

      var initials = name
        ? name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2)
        : email.substring(0, 2).toUpperCase();

      var createResult = await client.models.TeamMember.create({
        email: email,
        name: name || email.split('@')[0],
        initials: initials,
        isAdmin: isAdmin(email),
        isActive: true,
        isSystemUser: false
      });

      return createResult.data;
    } catch (error) {
      console.error('Error finding/creating team member:', error);
      return null;
    }
  }, [members, isAdmin]);

  const checkAuth = useCallback(async function() {
    try {
      setIsLoading(true);
      await getCurrentUser();
      var attributes = await fetchUserAttributes();
      
      var email = attributes.email;
      setUserEmail(email);

      if (!isAllowedDomain(email)) {
        setAuthError('Unauthorized domain');
        setIsAuthenticated(false);
        await signOut();
        return;
      }

      setIsAuthenticated(true);
      
      var teamMember = await findOrCreateTeamMember(email, attributes.name);
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

  const handleSignOut = useCallback(async function() {
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

  useEffect(function() {
    checkAuth();
  }, [checkAuth]);

  useEffect(function() {
    if (isAuthenticated && userEmail && members.length > 0) {
      var member = members.find(function(m) { return m.email === userEmail; });
      if (member && setCurrentUser) {
        setCurrentUser(member);
      }
    }
  }, [isAuthenticated, userEmail, members, setCurrentUser]);

  return {
    isAuthenticated: isAuthenticated,
    isLoading: isLoading,
    authError: authError,
    userEmail: userEmail,
    isAdmin: isAdmin(userEmail),
    checkAuth: checkAuth,
    signOut: handleSignOut
  };
};

export default useAuth;
