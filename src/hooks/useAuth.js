import { useCallback } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { ADMIN_EMAIL } from '../constants';

var useAuth = function(params) {
  var user = params.user;
  var setCurrentUser = params.setCurrentUser;
  var setLoading = params.setLoading;
  var setNewEngagement = params.setNewEngagement;
  var fetchAllData = params.fetchAllData;
  var client = params.client;

  var initializeUser = useCallback(async function() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      var attributes = await fetchUserAttributes();
      var email = attributes.email;
      var givenName = attributes.given_name || '';
      var familyName = attributes.family_name || '';
      var fullName = (givenName + ' ' + familyName).trim() || email.split('@')[0];

      // Get the client
      var dataClient = typeof client === 'function' ? client() : client;

      // Check if user exists in TeamMember table
      var existingResult = await dataClient.models.TeamMember.list({
        filter: { email: { eq: email } }
      });

      var teamMember;
      if (existingResult.data && existingResult.data.length > 0) {
        teamMember = existingResult.data[0];
      } else {
        // Create new team member
        var initials = '';
        if (givenName && familyName) {
          initials = (givenName[0] + familyName[0]).toUpperCase();
        } else {
          initials = email.substring(0, 2).toUpperCase();
        }

        var createResult = await dataClient.models.TeamMember.create({
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

  var handleSignOut = useCallback(async function() {
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
