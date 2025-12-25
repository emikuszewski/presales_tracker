import { useState, useMemo, useCallback } from 'react';

var useEngagementList = function(engagements) {
  var list = engagements || [];
  
  var searchQueryState = useState('');
  var searchQuery = searchQueryState[0];
  var setSearchQuery = searchQueryState[1];
  
  var phaseFilterState = useState('ALL');
  var phaseFilter = phaseFilterState[0];
  var setPhaseFilter = phaseFilterState[1];
  
  var ownerFilterState = useState('ALL');
  var ownerFilter = ownerFilterState[0];
  var setOwnerFilter = ownerFilterState[1];
  
  var industryFilterState = useState('ALL');
  var industryFilter = industryFilterState[0];
  var setIndustryFilter = industryFilterState[1];
  
  var showArchivedState = useState(false);
  var showArchived = showArchivedState[0];
  var setShowArchived = showArchivedState[1];
  
  var showStaleOnlyState = useState(false);
  var showStaleOnly = showStaleOnlyState[0];
  var setShowStaleOnly = showStaleOnlyState[1];
  
  var sortFieldState = useState('lastActivity');
  var sortField = sortFieldState[0];
  var setSortField = sortFieldState[1];
  
  var sortDirectionState = useState('desc');
  var sortDirection = sortDirectionState[0];
  var setSortDirection = sortDirectionState[1];

  var clearFilters = useCallback(function() {
    setSearchQuery('');
    setPhaseFilter('ALL');
    setOwnerFilter('ALL');
    setIndustryFilter('ALL');
    setShowArchived(false);
    setShowStaleOnly(false);
  }, []);

  var handleSort = useCallback(function(field) {
    if (sortField === field) {
      setSortDirection(function(prev) { return prev === 'asc' ? 'desc' : 'asc'; });
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  var filteredEngagements = useMemo(function() {
    if (!list || !Array.isArray(list)) return [];
    var result = list.slice();

    if (!showArchived) {
      result = result.filter(function(e) { return !e.isArchived; });
    }

    if (showStaleOnly) {
      result = result.filter(function(e) { return e.isStale; });
    }

    if (searchQuery.trim()) {
      var query = searchQuery.toLowerCase();
      result = result.filter(function(e) {
        var companyMatch = e.company && e.company.toLowerCase().includes(query);
        var contactMatch = e.contactName && e.contactName.toLowerCase().includes(query);
        var emailMatch = e.contactEmail && e.contactEmail.toLowerCase().includes(query);
        return companyMatch || contactMatch || emailMatch;
      });
    }

    if (phaseFilter !== 'ALL') {
      result = result.filter(function(e) { return e.currentPhase === phaseFilter; });
    }

    if (ownerFilter !== 'ALL') {
      result = result.filter(function(e) {
        var hasOwner = e.ownerIds && e.ownerIds.includes(ownerFilter);
        return hasOwner || e.ownerId === ownerFilter;
      });
    }

    if (industryFilter !== 'ALL') {
      result = result.filter(function(e) { return e.industry === industryFilter; });
    }

    result.sort(function(a, b) {
      var aVal = a[sortField];
      var bVal = b[sortField];

      if (sortField === 'lastActivity' || sortField === 'startDate' || sortField === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [list, searchQuery, phaseFilter, ownerFilter, industryFilter, showArchived, showStaleOnly, sortField, sortDirection]);

  var activeFilterCount = useMemo(function() {
    var count = 0;
    if (searchQuery.trim()) count++;
    if (phaseFilter !== 'ALL') count++;
    if (ownerFilter !== 'ALL') count++;
    if (industryFilter !== 'ALL') count++;
    if (showArchived) count++;
    if (showStaleOnly) count++;
    return count;
  }, [searchQuery, phaseFilter, ownerFilter, industryFilter, showArchived, showStaleOnly]);

  var stats = useMemo(function() {
    if (!list || !Array.isArray(list)) {
      return {
        total: 0,
        stale: 0,
        byPhase: {
          DISCOVER: 0,
          DESIGN: 0,
          DEMONSTRATE: 0,
          VALIDATE: 0,
          ENABLE: 0
        }
      };
    }
    var active = list.filter(function(e) { return !e.isArchived; });
    return {
      total: active.length,
      stale: active.filter(function(e) { return e.isStale; }).length,
      byPhase: {
        DISCOVER: active.filter(function(e) { return e.currentPhase === 'DISCOVER'; }).length,
        DESIGN: active.filter(function(e) { return e.currentPhase === 'DESIGN'; }).length,
        DEMONSTRATE: active.filter(function(e) { return e.currentPhase === 'DEMONSTRATE'; }).length,
        VALIDATE: active.filter(function(e) { return e.currentPhase === 'VALIDATE'; }).length,
        ENABLE: active.filter(function(e) { return e.currentPhase === 'ENABLE'; }).length
      }
    };
  }, [list]);

  return {
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    phaseFilter: phaseFilter,
    setPhaseFilter: setPhaseFilter,
    ownerFilter: ownerFilter,
    setOwnerFilter: setOwnerFilter,
    industryFilter: industryFilter,
    setIndustryFilter: setIndustryFilter,
    showArchived: showArchived,
    setShowArchived: setShowArchived,
    showStaleOnly: showStaleOnly,
    setShowStaleOnly: setShowStaleOnly,
    sortField: sortField,
    sortDirection: sortDirection,
    handleSort: handleSort,
    filteredEngagements: filteredEngagements,
    activeFilterCount: activeFilterCount,
    stats: stats,
    clearFilters: clearFilters
  };
};

export default useEngagementList;
