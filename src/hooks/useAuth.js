import { useCallback } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { ADMIN_EMAIL } from '../constants';

const useAuth = function(params) {
  const user = params.user;
  const setCurrentUser = params.setCurrentUser;
  const setLoading = params.setLoading;
  const setNewEngagement = params.setNewEngagement;
  const fetchAllData = params.fetchAllData;
  const client = params.client;

  const initializeUser = useCallback(async function() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      const givenName = attributes.given_name || '';
      const familyName = attributes.family_name || '';
      const fullName = (givenName + ' ' + familyName).trim() || email.split('@')[0];

      // Get the client
      const dataClient = typeof client === 'function' ? client() : client;

      // Check if user exists in TeamMember table
      const existingResult = await dataClient.models.TeamMember.list({
        filter: { email: { eq: email } }
      });

      let teamMember;
      if (existingResult.data && existingResult.data.length > 0) {
        teamMember = existingResult.data[0];
      } else {
        // Create new team member
        let initials = '';
        if (givenName && familyName) {
          initials = (givenName[0] + familyName[0]).toUpperCase();
        } else {
          initials = email.substring(0, 2).toUpperCase();
        }

        const createResult = await dataClient.models.TeamMember.create({
          email: email,
          name: fullName,
          initials: initials,
          isAdmin: email === ADMIN_EMAIL,
          isActive: true,
          isSystemUser: false
        });
        teamMember = createResult.data;
      }

      setCurrentUser(teamMember);

      // Set default owner for new engagements
      if (setNewEngagement && teamMember) {
        setNewEngagement(function(prev) {
          return Object.assign({}, prev, { ownerIds: [teamMember.id] });
        });
      }

      // Fetch all data
      await fetchAllData(teamMember.id);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing user:', error);
      setLoading(false);
    }
  }, [user, setCurrentUser, setLoading, setNewEngagement, fetchAllData, client]);

  const handleSignOut = useCallback(async function() {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return {
    initializeUser: initializeUser,
    handleSignOut: handleSignOut
  };
};

export default useAuth;
