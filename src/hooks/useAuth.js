import { useCallback } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { generateInitials } from '../utils';
import { ADMIN_EMAIL } from '../constants';

/**
 * Authentication hook for user initialization and sign out.
 * 
 * @param {Object} params - Hook parameters
 * @param {Object} params.user - Amplify user object from useAuthenticator
 * @param {Function} params.setCurrentUser - Setter for current user
 * @param {Function} params.setLoading - Setter for loading state
 * @param {Function} params.setNewEngagement - Setter for new engagement form
 * @param {Function} params.fetchAllData - Function to fetch all data
 * @param {Object} params.client - Amplify data client
 * @returns {Object} Auth operations
 */
const useAuth = ({
  user,
  setCurrentUser,
  setLoading,
  setNewEngagement,
  fetchAllData,
  client
}) => {
  
  const initializeUser = useCallback(async () => {
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
  }, [user, setCurrentUser, setLoading, setNewEngagement, fetchAllData, client]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return {
    initializeUser,
    handleSignOut
  };
};

export default useAuth;
