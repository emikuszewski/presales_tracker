import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for engagement list filtering, sorting, and selection
 * 
 * @param {Array} engagements - Full list of engagements
 * @returns {Object} List state and operations
 */
const useEngagementList = (engagements = []) => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [showStaleOnly, setShowStaleOnly] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState('lastActivity');
  const [sortDirection, setSortDirection] = useState('desc');

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setPhaseFilter('ALL');
    setOwnerFilter('ALL');
    setIndustryFilter('ALL');
    setShowArchived(false);
    setShowStaleOnly(false);
  }, []);

  /**
   * Toggle sort direction or change sort field
   */
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  /**
   * Filtered engagements based on all criteria
   */
  const filteredEngagements = useMemo(() => {
    let result = [...engagements];

    // Filter by archived status
    if (!showArchived) {
      result = result.filter(e => !e.isArchived);
    }

    // Filter by stale status
    if (showStaleOnly) {
      result = result.filter(e => e.isStale);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.company?.toLowerCase().includes(query) ||
        e.contactName?.toLowerCase().includes(query) ||
        e.contactEmail?.toLowerCase().includes(query)
      );
    }

    // Filter by phase
    if (phaseFilter !== 'ALL') {
      result = result.filter(e => e.currentPhase === phaseFilter);
    }

    // Filter by owner
    if (ownerFilter !== 'ALL') {
      result = result.filter(e => 
        e.ownerIds?.includes(ownerFilter) || e.ownerId === ownerFilter
      );
    }

    // Filter by industry
    if (industryFilter !== 'ALL') {
      result = result.filter(e => e.industry === industryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle dates
      if (sortField === 'lastActivity' || sortField === 'startDate' || sortField === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    engagements,
    searchQuery,
    phaseFilter,
    ownerFilter,
    industryFilter,
    showArchived,
    showStaleOnly,
    sortField,
    sortDirection
  ]);

  /**
   * Count of active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (phaseFilter !== 'ALL') count++;
    if (ownerFilter !== 'ALL') count++;
    if (industryFilter !== 'ALL') count++;
    if (showArchived) count++;
    if (showStaleOnly) count++;
    return count;
  }, [searchQuery, phaseFilter, ownerFilter, industryFilter, showArchived, showStaleOnly]);

  /**
   * Aggregated stats for dashboard
   */
  const stats = useMemo(() => {
    const active = engagements.filter(e => !e.isArchived);
    return {
      total: active.length,
      stale: active.filter(e => e.isStale).length,
      byPhase: {
        DISCOVER: active.filter(e => e.currentPhase === 'DISCOVER').length,
        DESIGN: active.filter(e => e.currentPhase === 'DESIGN').length,
        DEMONSTRATE: active.filter(e => e.currentPhase === 'DEMONSTRATE').length,
        VALIDATE: active.filter(e => e.currentPhase === 'VALIDATE').length,
        ENABLE: active.filter(e => e.currentPhase === 'ENABLE').length
      }
    };
  }, [engagements]);

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    phaseFilter,
    setPhaseFilter,
    ownerFilter,
    setOwnerFilter,
    industryFilter,
    setIndustryFilter,
    showArchived,
    setShowArchived,
    showStaleOnly,
    setShowStaleOnly,
    
    // Sort state
    sortField,
    sortDirection,
    handleSort,
    
    // Derived data
    filteredEngagements,
    activeFilterCount,
    stats,
    
    // Actions
    clearFilters
  };
};

export default useEngagementList;
