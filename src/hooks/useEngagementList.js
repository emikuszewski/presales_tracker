import { useState, useMemo, useCallback } from 'react';

const useEngagementList = (engagements = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [sortField, setSortField] = useState('lastActivity');
  const [sortDirection, setSortDirection] = useState('desc');

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setPhaseFilter('ALL');
    setOwnerFilter('ALL');
    setIndustryFilter('ALL');
    setShowArchived(false);
    setShowStaleOnly(false);
  }, []);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const filteredEngagements = useMemo(() => {
    if (!engagements || !Array.isArray(engagements)) return [];
    let result = [...engagements];

    if (!showArchived) {
      result = result.filter(e => !e.isArchived);
    }

    if (showStaleOnly) {
      result = result.filter(e => e.isStale);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.company?.toLowerCase().includes(query) ||
        e.contactName?.toLowerCase().includes(query) ||
        e.contactEmail?.toLowerCase().includes(query)
      );
    }

    if (phaseFilter !== 'ALL') {
      result = result.filter(e => e.currentPhase === phaseFilter);
    }

    if (ownerFilter !== 'ALL') {
      result = result.filter(e => 
        e.ownerIds?.includes(ownerFilter) || e.ownerId === ownerFilter
      );
    }

    if (industryFilter !== 'ALL') {
      result = result.filter(e => e.industry === industryFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

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

  const stats = useMemo(() => {
    if (!engagements || !Array.isArray(engagements)) {
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
    const active = engagements.filter(e => !e.isArchived);
    return {
      total: active.length,
      stale: active.filter(e => e.isStale).length,
      byPhase: {
        DISCOVER: active.filter(e => e.currentPhase === 'DISCOVER').length,
        DESIGN: active.filter(e => e.currentPhase === 'DESIGN').le
