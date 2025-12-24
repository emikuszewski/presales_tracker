import { useCallback } from 'react';

/**
 * Hook for team member admin operations (activate/deactivate, admin toggle).
 * 
 * @param {Object} params - Hook parameters
 * @param {Object} params.currentUser - Current logged-in user
 * @param {Array} params.allTeamMembers - All team members (active and inactive)
 * @param {Function} params.setAllTeamMembers - Setter for all team members
 * @param {Function} params.setTeamMembers - Setter for active team members
 * @param {Function} params.fetchAllData - Function to refetch all data (for rollback)
 * @param {Object} params.client - Amplify data client
 * @returns {Object} Team operations
 */
const useTeamOperations = ({
  currentUser,
  allTeamMembers,
  setAllTeamMembers,
  setTeamMembers,
  fetchAllData,
  client
}) => {

  const handleToggleUserActive = useCallback(async (memberId, currentStatus) => {
    if (!currentUser?.isAdmin) return;
    
    if (memberId === currentUser.id) {
      alert('You cannot deactivate yourself.');
      return;
    }
    
    const newStatus = !currentStatus;
    
    // Optimistic update
    setAllTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isActive: newStatus } : m
    ));
    setTeamMembers(prev => 
      newStatus 
        ? [...prev, allTeamMembers.find(m => m.id === memberId)].filter(Boolean)
        : prev.filter(m => m.id !== memberId)
    );
    
    try {
      await client.models.TeamMember.update({
        id: memberId,
        isActive: newStatus
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      // Rollback on error
      setAllTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isActive: currentStatus } : m
      ));
      await fetchAllData(currentUser?.id);
    }
  }, [currentUser, allTeamMembers, setAllTeamMembers, setTeamMembers, fetchAllData, client]);

  const handleToggleUserAdmin = useCallback(async (memberId, currentStatus) => {
    if (!currentUser?.isAdmin) return;
    
    if (memberId === currentUser.id) {
      alert('You cannot remove your own admin status.');
      return;
    }
    
    const newStatus = !currentStatus;
    
    // Optimistic update
    setAllTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isAdmin: newStatus } : m
    ));
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, isAdmin: newStatus } : m
    ));
    
    try {
      await client.models.TeamMember.update({
        id: memberId,
        isAdmin: newStatus
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      // Rollback on error
      setAllTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isAdmin: currentStatus } : m
      ));
      setTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, isAdmin: currentStatus } : m
      ));
    }
  }, [currentUser, setAllTeamMembers, setTeamMembers, client]);

  return {
    handleToggleUserActive,
    handleToggleUserAdmin
  };
};

export default useTeamOperations;
