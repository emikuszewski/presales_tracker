import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getInitials } from '../utils';

const useTeamOperations = function(params) {
  var setTeamMembers = params.setTeamMembers;
  var setAllTeamMembers = params.setAllTeamMembers;

  var addTeamMember = useCallback(async function(memberData) {
    try {
      var client = generateClient();
      var initials = memberData.initials || getInitials(memberData.name);
      
      var result = await client.models.TeamMember.create({
        email: memberData.email,
        name: memberData.name,
        initials: initials,
        isAdmin: memberData.isAdmin || false,
        isActive: true,
        isSystemUser: false
      });

      var newMember = result.data;
      setAllTeamMembers(function(prev) { return [...prev, newMember]; });
      setTeamMembers(function(prev) { return [...prev, newMember]; });

      return { success: true, member: newMember };
    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error: error };
    }
  }, [setTeamMembers, setAllTeamMembers]);

  var updateTeamMember = useCallback(async function(memberId, updates) {
    try {
      var client = generateClient();
      var result = await client.models.TeamMember.update({
        id: memberId,
        ...updates
      });

      var updatedMember = result.data;

      var updateInList = function(list) {
        return list.map(function(m) {
          return m.id === memberId ? { ...m, ...updatedMember } : m;
        });
      };

      setAllTeamMembers(updateInList);
      setTeamMembers(function(prev) {
        var updated = updateInList(prev);
        if (updates.isActive === false) {
          return updated.filter(function(m) { return m.id !== memberId; });
        }
        return updated;
      });

      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error updating team member:', error);
      return { success: false, error: error };
    }
  }, [setTeamMembers, setAllTeamMembers]);

  var deactivateTeamMember = useCallback(async function(memberId) {
    return updateTeamMember(memberId, { isActive: false });
  }, [updateTeamMember]);

  var reactivateTeamMember = useCallback(async function(memberId) {
    return updateTeamMember(memberId, { isActive: true });
  }, [updateTeamMember]);

  var toggleAdmin = useCallback(async function(memberId, isAdmin) {
    return updateTeamMember(memberId, { isAdmin: isAdmin });
  }, [updateTeamMember]);

  return {
    addTeamMember: addTeamMember,
    updateTeamMember: updateTeamMember,
    deactivateTeamMember: deactivateTeamMember,
    reactivateTeamMember: reactivateTeamMember,
    toggleAdmin: toggleAdmin
  };
};

export default useTeamOperations;
