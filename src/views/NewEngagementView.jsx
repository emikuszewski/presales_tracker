import React, { useState } from 'react';
import { industries, industryLabels } from '../constants';
import { getAvatarColorClasses } from '../utils';

/**
 * Format deal size from amount and unit parts
 */
const formatDealSizeFromParts = (amount, unit) => {
  if (!amount || !unit) return '';
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return '';
  return `$${numericAmount}${unit}`;
};

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
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isSelected 
                  ? 'bg-white text-gray-900' 
                  : colorClasses
              }`}>
                {member.initials}
              </div>
              <span className="text-sm">{member.name}</span>
              {isSystemUser && <span className="text-xs opacity-60">(Shared)</span>}
            </button>
          );
        })}
      </div>
      {selectedOwnerIds.length === 0 && (
        <p className="text-sm text-red-600 mt-1">At least one owner is required</p>
      )}
    </div>
  );
};

/**
 * Deal size input component with amount and unit selector
 */
const DealSizeInput = ({ 
  amount, 
  unit, 
  onAmountChange, 
  onUnitChange, 
  hasError,
  attemptedSubmit 
}) => {
  const units = [
    { value: '', label: 'Select...' },
    { value: 'K', label: 'K (thousands)' },
    { value: 'M', label: 'M (millions)' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deal Size (ARR)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            placeholder="e.g., 150"
            className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
              hasError && attemptedSubmit ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>
        <select
          value={unit}
          onChange={e => onUnitChange(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
            hasError && attemptedSubmit ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          {units.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>
      {hasError && attemptedSubmit && (
        <p className="text-sm text-red-600 mt-1">Please select a unit (K or M)</p>
      )}
    </div>
  );
};

/**
 * New Engagement View - Form for creating a new engagement
 */
const NewEngagementView = ({
  newEngagement,
  setNewEngagement,
  teamMembers,
  salesReps = [],
  onSubmit,
  onBack
}) => {
  // Local state for deal size parts
  const [dealSizeAmount, setDealSizeAmount] = useState('');
  const [dealSizeUnit, setDealSizeUnit] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Update a single field
  const updateField = (field, value) => {
    setNewEngagement(prev => ({ ...prev, [field]: value }));
  };

  // Toggle owner selection
  const handleToggleOwner = (memberId) => {
    setNewEngagement(prev => {
      const currentOwners = prev.ownerIds || [];
      if (currentOwners.includes(memberId)) {
        // Remove owner (but don't allow empty)
        if (currentOwners.length > 1) {
          return { ...prev, ownerIds: currentOwners.filter(id => id !== memberId) };
        }
        return prev; // Don't remove last owner
      } else {
        // Add owner
        return { ...prev, ownerIds: [...currentOwners, memberId] };
      }
    });
  };

  // Validation
  const hasDealSizeValidationError = dealSizeAmount && !dealSizeUnit;
  const canSubmit = 
    newEngagement.company?.trim() && 
    newEngagement.contactName?.trim() && 
    newEngagement.ownerIds?.length > 0 &&
    !hasDealSizeValidationError;

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!canSubmit) return;

    // Format deal size from parts
    const formattedDealSize = dealSizeAmount && dealSizeUnit 
      ? formatDealSizeFromParts(dealSizeAmount, dealSizeUnit)
      : '';

    // Pass deal size as override (salesRepId comes from newEngagement state directly)
    onSubmit({ dealSize: formattedDealSize });
  };

  return (
    <div>
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Engagements
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-gray-900">New Engagement</h2>
        <p className="text-gray-500 mt-1">Create a new presales engagement to track</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          
          {/* ============================================
              BASIC INFORMATION
              ============================================ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Basic Information
            </h3>
            
            <div className="space-y-4">
              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newEngagement.company || ''}
                  onChange={e => updateField('company', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                    attemptedSubmit && !newEngagement.company?.trim() ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Acme Corporation"
                />
                {attemptedSubmit && !newEngagement.company?.trim() && (
                  <p className="text-sm text-red-600 mt-1">Company name is required</p>
                )}
              </div>

              {/* Partner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Name
                </label>
                <input
                  type="text"
                  value={newEngagement.partnerName || ''}
                  onChange={e => updateField('partnerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., Mickey Martin"
                />
              </div>

              {/* Contact Name & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={newEngagement.contactName || ''}
                    onChange={e => updateField('contactName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                      attemptedSubmit && !newEngagement.contactName?.trim() ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., John Smith"
                  />
                  {attemptedSubmit && !newEngagement.contactName?.trim() && (
                    <p className="text-sm text-red-600 mt-1">Contact name is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newEngagement.contactEmail || ''}
                    onChange={e => updateField('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., john@acme.com"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={newEngagement.contactPhone || ''}
                  onChange={e => updateField('contactPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select 
                  value={newEngagement.industry || 'TECHNOLOGY'}
                  onChange={e => updateField('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{industryLabels[ind]}</option>
                  ))}
                </select>
              </div>

              {/* Sales Rep Dropdown - only shown if sales reps exist */}
              {salesReps.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Rep
                  </label>
                  <select 
                    value={newEngagement.salesRepId || ''}
                    onChange={e => updateField('salesRepId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select a sales rep...</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Deal Size */}
              <DealSizeInput
                amount={dealSizeAmount}
                unit={dealSizeUnit}
                onAmountChange={setDealSizeAmount}
                onUnitChange={setDealSizeUnit}
                hasError={hasDealSizeValidationError}
                attemptedSubmit={attemptedSubmit}
              />
            </div>
          </div>

          {/* ============================================
              ASSIGNMENT
              ============================================ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Assignment
            </h3>
            <OwnerToggleGroup
              teamMembers={teamMembers}
              selectedOwnerIds={newEngagement.ownerIds || []}
              onToggle={handleToggleOwner}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              canSubmit
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Create Engagement
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEngagementView;
