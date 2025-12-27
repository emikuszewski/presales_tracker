import { useCallback } from 'react';

/**
 * Hook for Sales Rep CRUD operations
 * Handles create, delete (with cleanup), and state management
 */
var useSalesRepsOperations = function(params) {
  var salesReps = params.salesReps;
  var setSalesReps = params.setSalesReps;
  var engagements = params.engagements;
  var setEngagements = params.setEngagements;
  var client = params.client;

  /**
   * Generate initials from a name
   * "Greg Berg" → "GB", "Madonna" → "M"
   */
  var generateInitials = function(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  /**
   * Create a new sales rep
   * @param {string} name - The sales rep's name
   * @returns {Promise<Object|null>} The created sales rep or null on error
   */
  var createSalesRep = useCallback(async function(name) {
    if (!name || !name.trim()) {
      console.error('[SalesReps] Cannot create: name is empty');
      return null;
    }

    var trimmedName = name.trim();
    var initials = generateInitials(trimmedName);
    console.log('[SalesReps] Creating sales rep:', trimmedName, 'initials:', initials);

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      if (!dataClient || !dataClient.models || !dataClient.models.SalesRep) {
        console.error('[SalesReps] Error: SalesRep model not available. Have you deployed the schema?');
        alert('Error: SalesRep model not available. Please deploy your Amplify schema first.');
        return null;
      }
      
      var inputData = { 
        name: trimmedName,
        initials: initials
      };
      console.log('[SalesReps] Input data:', JSON.stringify(inputData));
      
      var result = await dataClient.models.SalesRep.create(inputData);

      console.log('[SalesReps] Create result:', result);

      if (result.data) {
        setSalesReps(function(prev) {
          return prev.concat([result.data]).sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          });
        });
        return result.data;
      }
      
      if (result.errors) {
        console.error('[SalesReps] API errors:', result.errors);
        alert('Error creating sales rep: ' + JSON.stringify(result.errors));
      }
      
      return null;
    } catch (error) {
      console.error('[SalesReps] Error creating sales rep:', error);
      alert('Error creating sales rep: ' + error.message);
      return null;
    }
  }, [client, setSalesReps]);

  /**
   * Update a sales rep's details
   * @param {string} salesRepId - The ID of the sales rep to update
   * @param {Object} updates - { name?, email? }
   * @returns {Promise<Object|null>} The updated sales rep or null on error
   */
  var updateSalesRep = useCallback(async function(salesRepId, updates) {
    if (!salesRepId) return null;

    try {
      var dataClient = typeof client === 'function' ? client() : client;
      
      var updateData = { id: salesRepId };
      
      if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
        updateData.initials = generateInitials(updates.name);
      }
      if (updates.email !== undefined) {
        updateData.email = updates.email.trim() || null;
      }

      console.log('[SalesReps] Updating sales rep:', updateData);
      
      var result = await dataClient.models.SalesRep.update(updateData);

      if (result.data) {
        setSalesReps(function(prev) {
          return prev.map(function(rep) {
            if (rep.id === salesRepId) {
              return result.data;
            }
            return rep;
          }).sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          });
        });
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('[SalesReps] Error updating sales rep:', error);
      return null;
    }
  }, [client, setSalesReps]);

  /**
   * Delete a sales rep and clean up references
   * Sets salesRepId to null on all affected engagements before deleting
   * @param {string} salesRepId - The ID of the sales rep to delete
   * @returns {Promise<boolean>} True if successful
   */
  var deleteSalesRep = useCallback(async function(salesRepId) {
    if (!salesRepId) return false;

    try {
      var dataClient = typeof client === 'function' ? client() : client;

      // Find all engagements with this sales rep
      var affectedEngagements = engagements.filter(function(e) {
        return e.salesRepId === salesRepId;
      });

      // Update each affected engagement to remove the sales rep reference
      for (var i = 0; i < affectedEngagements.length; i++) {
        await dataClient.models.Engagement.update({
          id: affectedEngagements[i].id,
          salesRepId: null
        });
      }

      // Delete the sales rep
      await dataClient.models.SalesRep.delete({ id: salesRepId });

      // Update local state - remove sales rep
      setSalesReps(function(prev) {
        return prev.filter(function(rep) { return rep.id !== salesRepId; });
      });

      // Update local state - clear salesRepId from affected engagements
      if (affectedEngagements.length > 0) {
        setEngagements(function(prev) {
          return prev.map(function(eng) {
            if (eng.salesRepId === salesRepId) {
              return Object.assign({}, eng, { salesRepId: null, salesRepName: null });
            }
            return eng;
          });
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting sales rep:', error);
      return false;
    }
  }, [client, engagements, setSalesReps, setEngagements]);

  /**
   * Get engagement count for a sales rep
   * @param {string} salesRepId - The sales rep ID
   * @returns {number} Count of engagements assigned to this rep
   */
  var getEngagementCount = useCallback(function(salesRepId) {
    if (!salesRepId || !engagements) return 0;
    return engagements.filter(function(e) {
      return e.salesRepId === salesRepId;
    }).length;
  }, [engagements]);

  return {
    createSalesRep: createSalesRep,
    updateSalesRep: updateSalesRep,
    deleteSalesRep: deleteSalesRep,
    getEngagementCount: getEngagementCount
  };
};

export default useSalesRepsOperations;
