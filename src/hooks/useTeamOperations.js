import { useCallback } from 'react';

const useTeamOperations = function(params) {
  const currentUser = params.currentUser;
  const allTeamMembers = params.allTeamMembers;
  const setAllTeamMembers = params.setAllTeamMembers;
  const setTeamMembers = params.setTeamMembers;
  const fetchAllData = params.fetchAllData;
  const client = params.client;

  const handleToggleUserActive = useCallback(async function(memberId, isCurrentlyActive) {
    try {
      const dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.TeamMember.update({
        id: memberId,
        isActive: !isCurrentlyActive
      });

      // Update local state
      const updateMember = function(member) {
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
        const member = allTeamMembers.find(function(m) { return m.id === memberId; });
        if (member) {
          const updatedMember = Object.assign({}, member, { isActive: true });
          setTeamMembers(function(prev) {
            return prev.concat([updatedMember]);
          });
        }
      }
    } catch (error) {
      console.error('Error toggling user active status:', error);
    }
  }, [client, allTeamMembers, setAllTeamMembers, setTeamMembers]);

  const handleToggleUserAdmin = useCallback(async function(memberId, isCurrentlyAdmin) {
    try {
      const dataClient = typeof client === 'function' ? client() : client;
      
      await dataClient.models.TeamMember.update({
        id: memberId,
        isAdmin: !isCurrentlyAdmin
      });

      // Update local state
      const updateMember = function(member) {
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
