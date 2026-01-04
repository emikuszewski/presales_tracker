import React, { useState } from 'react';
import { ChevronLeftIcon } from '../components';
import { industries, industryLabels } from '../constants';
import { getAvatarColorClasses, formatDealSizeFromParts } from '../utils';

/**
 * Helper component for owner selection
 * Displays team members as toggleable buttons with avatars
 */
const OwnerToggleGroup = ({ teamMembers, selectedOwnerIds, onToggle }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Owners *
      </label>
      <div className="flex flex-wrap gap-2">
        {teamMembers.map(member => {
          const isSelected = selectedOwnerIds.includes(member.id);
          const isSystemUser = member.isSystemUser === true;
          const colorClasses = getAvatarColorClasses(member);
          
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onToggle(member.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${colorClasses}`}>
                {isSystemUser 
                  ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                  : member.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                }
              </div>
              
              {/* Name */}
              <span className="text-sm font-medium text-gray-700">
                {member.name}
              </span>
              
              {/* Checkmark for selected */}
              {isSelected && (
                <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {selectedOwnerIds.length === 0 && (
        <p className="text-sm text-red-500 mt-1">Select at least one owner</p>
      )}
    </div>
  );
};

/**
 * Deal Size Input with amount and unit selector
 * Stores formatted value like "$50k" or "$1.5M"
 */
const DealSizeInput = ({ value, onChange }) => {
  // Parse existing value back to parts
  const parseValue = (val) => {
    if (!val) return { amount: '', unit: 'k' };
    const match = val.match(/^\$?([\d.]+)([kKmM])?$/);
    if (match) {
      return { 
        amount: match[1], 
        unit: match[2]?.toLowerCase() === 'm' ? 'M' : 'k' 
      };
    }
    return { amount: '', unit: 'k' };
  };

  const { amount, unit } = parseValue(value);

  const handleAmountChange = (e) => {
    const newAmount = e.target.value;
    // Allow only numbers and decimal point
    if (newAmount === '' || /^\d*\.?\d*$/.test(newAmount)) {
      onChange(formatDealSizeFromParts(newAmount, unit));
    }
  };

  const handleUnitChange = (newUnit) => {
    onChange(formatDealSizeFromParts(amount, newUnit));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deal Size
      </label>
      <div className="flex">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="50"
            className="w-full pl-7 pr-3 py-2 border border-r-0 border-gray-300 rounded-l-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div className="flex border border-gray-300 rounded-r-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleUnitChange('k')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              unit === 'k' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            K
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange('M')}
            className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              unit === 'M' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            M
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {value ? `Formatted: ${value}` : 'e.g., $50k or $1.5M'}
      </p>
    </div>
  );
};

/**
 * Form for creating a new engagement
 * Fields: Company, Contact Name, Industry, Deal Size, Owners
 * All other fields get defaults
 */
const NewEngagementView = ({
  teamMembers,
  currentUser,
  onBack,
  onCreate
}) => {
  // Form state
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [industry, setIndustry] = useState('');
  const [dealSize, setDealSize] = useState('');
  const [ownerIds, setOwnerIds] = useState(currentUser ? [currentUser.id] : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Toggle owner selection
   */
  const handleOwnerToggle = (memberId) => {
    setOwnerIds(prev => {
      if (prev.includes(memberId)) {
        // Don't allow removing the last owner
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  /**
   * Validate and submit the form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!company.trim()) {
      setError('Company name is required');
      return;
    }
    if (!contactName.trim()) {
      setError('Contact name is required');
      return;
    }
    if (!industry) {
      setError('Industry is required');
      return;
    }
    if (ownerIds.length === 0) {
      setError('At least one owner is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the engagement with defaults
      const today = new Date().toISOString().split('T')[0];
      
      const newEngagement = {
        company: company.trim(),
        contactName: contactName.trim(),
        industry,
        dealSize: dealSize || null,
        ownerIds,
        startDate: today,
        lastActivity: today,
        currentPhase: 'DISCOVER',
        engagementStatus: 'ACTIVE',
        isArchived: false,
        // Initialize all phases as PENDING
        phases: {
          DISCOVER: { status: 'PENDING', notes: '', links: [] },
          DESIGN: { status: 'PENDING', notes: '', links: [] },
          DEMONSTRATE: { status: 'PENDING', notes: '', links: [] },
          VALIDATE: { status: 'PENDING', notes: '', links: [] },
          ENABLE: { status: 'PENDING', notes: '', links: [] }
        },
        activities: [],
        // Integration links - all empty by default
        slackUrl: null,
        slackChannel: null,
        driveFolderUrl: null,
        driveFolderName: null,
        docsUrl: null,
        docsName: null,
        slidesUrl: null,
        slidesName: null,
        sheetsUrl: null,
        sheetsName: null
      };

      await onCreate(newEngagement);
      // onCreate will handle navigation back to list
    } catch (err) {
      console.error('Error creating engagement:', err);
      setError('Failed to create engagement. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-medium text-gray-900">New Engagement</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company *
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name *
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry *
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Select industry...</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {industryLabels[ind]}
              </option>
            ))}
          </select>
        </div>

        {/* Deal Size */}
        <DealSizeInput 
          value={dealSize}
          onChange={setDealSize}
        />

        {/* Owners */}
        <OwnerToggleGroup
          teamMembers={teamMembers}
          selectedOwnerIds={ownerIds}
          onToggle={handleOwnerToggle}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Engagement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEngagementView;
