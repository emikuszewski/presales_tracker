import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getInitials } from '../utils';

const useTeamOperations = ({ setTeamMembers, setAllTeamMembers, currentUser }) => {

  const addTeamMember = useCallback(async (memberData) => {
    try {
      const client = generateClient();
      const initials = memberData.initials || getInitials(memberData.name);
      
      const { data: newMember } = await client.models.TeamMember.create({
        email: memberData.email,
        name: memberData.name,
        initials,
        isAdmin: memberData.isAdmin || false,
        isActive: true,
        isSystemUser: false
      });

      setAllTeamMembers(prev => [...prev, newMember]);
      setTeamMembers(prev => [...prev, newMember]);

      return { success: true, member: newMember };
    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error };
    }
  }, [setTeamMembers, setAllTeamMembers]);

  const updateTeamMember = useCallback(async (memberId, updates) => {
    try {
      const client = generateClient();
      const { data: updatedMember } = await client.models.TeamMember.update({
        id: memberId,
        ...updates
      });

      const updateInList = (list) => list.map(m => 
        m.id === memberId ? { ...m, ...updatedMember } : m
      );

      setAllTeamMembers(updateInList);
      setTeamMembers(prev => {
        const updated = updateInList(prev);
        if (updates.isActive === false) {
          return updated.filter(m => m.id !== memberId);
        }
        return updated;
      });

      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error updating team member:', error);
      return { success: false, error };
    }
  }, [setTeamMembers, setAllTeamMembers]);

  const deactivateTeamMember = useCallback(async (memberId) => {
    return updateTeamMember(memberId, { isActive: false });
  }, [updateTeamMember]);

  const reactivateTeamMember = useCallback(async (memberId) => {
    return updateTeamMember(memberId, { isActive: true });
  }, [updateTeamMember]);

  const toggleAdmin = useCallback(async (memberId, isAdmin) => {
    return updateTeamMember(memberId, { isAdmin });
  }, [updateTeamMember]);

  return {
    addTeamMember,
    updateTeamMember,
    deactivateTeamMember,
    reactivateTeamMember,
    toggleAdmin
  };
};

export default useTeamOperations;
