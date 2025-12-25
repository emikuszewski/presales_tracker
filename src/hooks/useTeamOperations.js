import { useCallback } from 'react';

var useTeamOperations = function(params) {
  var currentUser = params.currentUser;
  var allTeamMembers = params.allTeamMembers;
  var setAllTeamMembers = params.setAllTeamMembers;
  var setTeamMembers = params.setTeamMembers;
  var fetchAllData = params.fetchAllData;
  var client = params.client;

  var handleToggleUserActive = useCallback(async function(memberId, isCurrentlyActive) {
    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.TeamMember.update({
        id: memberId,
        isActive: !isCurrentlyActive
      });

      // Update local state
      var updateMember = function(member) {
        if (member.id === memberId) {
          return Object.assign({}, member, { isActive: !isCurrentlyActive });
        }
        return member;
      };

      setAllTeamMembers(function(prev) {
        return prev.map(updateMember);
      });

      // Update active team members list
      if (isCurrentlyActive) {
        // User is being deactivated - remove from active list
        setTeamMembers(function(prev) {
          return prev.filter(function(m) { return m.id !== memberId; });
        });
      } else {
        // User is being reactivated - add back to active list
        var member = allTeamMembers.find(function(m) { return m.id === memberId; });
        if (member) {
          var updatedMember = Object.assign({}, member, { isActive: true });
          setTeamMembers(function(prev) {
            return prev.concat([updatedMember]);
          });
        }
      }
    } catch (error) {
      console.error('Error toggling user active status:', error);
    }
  }, [client, allTeamMembers, setAllTeamMembers, setTeamMembers]);

  var handleToggleUserAdmin = useCallback(async function(memberId, isCurrentlyAdmin) {
    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.TeamMember.update({
        id: memberId,
        isAdmin: !isCurrentlyAdmin
      });

      // Update local state
      var updateMember = function(member) {
        if (member.id === memberId) {
          return Object.assign({}, member, { isAdmin: !isCurrentlyAdmin });
        }
        return member;
      };

      setAllTeamMembers(function(prev) {
        return prev.map(updateMember);
      });

      setTeamMembers(function(prev) {
        return prev.map(updateMember);
      });
    } catch (error) {
      console.error('Error toggling user admin status:', error);
    }
  }, [client, setAllTeamMembers, setTeamMembers]);

  return {
    handleToggleUserActive: handleToggleUserActive,
    handleToggleUserAdmin: handleToggleUserAdmin
  };
};

export default useTeamOperations;
