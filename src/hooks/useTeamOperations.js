import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getInitials } from '../utils';

const client = generateClient();

/**
 * Hook for team member CRUD operations
 * 
 * @param {Object} params - Hook parameters
 * @param {Function} params.setTeamMembers - Setter for active team members
 * @param {Function} params.setAllTeamMembers - Setter for all team members
 * @param {Object} params.currentUser - Current logged-in user
 * @returns {Object} Team operations
 */
const useTeamOperations = ({ setTeamMembers, setAllTeamMembers, currentUser }) => {

  /**
   * Add a new team member
   */
  const addTeamMember = useCallback(async (memberData) => {
    try {
      const initials = memberData.initials || getInitials(memberData.name);
      
      const { data: newMember } = await client.models.TeamMember.create({
        email: memberData.email,
        name: memberData.name,
        initials,
        isAdmin: memberData.isAdmin || false,
        isActive: true,
        isSystemUser: false
      });

      // Update local state
      setAllTeamMembers(prev => [...prev, newMember]);
      setTeamMembers(prev => [...prev, newMember]);

      return { success: true, member: newMember };
    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error };
    }
  }, [setTeamMembers, setAllTeamMembers]);

  /**
   * Update a team member
   */
  const updateTeamMember = useCallback(async (memberId, updates) => {
    try {
      const { data: updatedMember } = await client.models.TeamMember.update({
        id: memberId,
        ...updates
      });

      // Update local state
      const updateInList = (list) => list.map(m => 
        m.id === memberId ? { ...m, ...updatedMember } : m
      );

      setAllTeamMembers(updateInList);
      setTeamMembers(prev => {
        const updated = updateInList(prev);
        // If member is now inactive, remove from active list
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

  /**
   * Deactivate a team member (soft delete)
   */
  const deactivateTeamMember = useCallback(async (memberId) => {
    return updateTeamMember(memberId, { isActive: false });
  }, [updateTeamMember]);

  /**
   * Reactivate a team member
   */
  const reactivateTeamMember = useCallback(async (memberId) => {
    return updateTeamMember(memberId, { isActive: true });
  }, [updateTeamMember]);

  /**
   * Toggle admin status
   */
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
