import React, { useState } from 'react';
import { industries, industryLabels } from '../constants';
import { formatDealSizeFromParts } from '../utils';
import { getAvatarColorClasses } from '../utils';

/**
 * Deal Size Input Component
 * Two-field approach: number input + K/M unit dropdown
 */
const DealSizeInput = ({ 
  dealSizeAmount, 
  dealSizeUnit, 
  onAmountChange, 
  onUnitChange,
  showValidationError 
}) => {
  const hasAmountNoUnit = dealSizeAmount && !dealSizeUnit;
  const showError = showValidationError && hasAmountNoUnit;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deal Size
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={dealSizeAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
              showError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="100"
          />
        </div>
        <select
          value={dealSizeUnit}
          onChange={(e) => onUnitChange(e.target.value)}
          className={`w-20 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
            showError ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">Unit</option>
          <option value="K">K</option>
          <option value="M">M</option>
        </select>
      </div>
      {showError && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Select a unit (K or M)
        </p>
      )}
      {dealSizeAmount && dealSizeUnit && (
        <p className="text-xs text-gray-500 mt-1">
          Preview: {formatDealSizeFromParts(dealSizeAmount, dealSizeUnit)}
        </p>
      )}
    </div>
  );
};

/**
 * Owner selector component for multi-select
 */
const OwnerSelector = ({ selectedOwnerIds, teamMembers, onToggleOwner }) => {
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
              onClick={() => onToggleOwner(member.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
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
 * New Engagement View - Form for creating a new engagement
 */
const NewEngagementView = ({
  newEngagement,
  setNewEngagement,
  teamMembers,
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

    // Format deal size from parts and pass directly to onSubmit
    const formattedDealSize = dealSizeAmount && dealSizeUnit 
      ? formatDealSizeFromParts(dealSizeAmount, dealSizeUnit)
      : '';

    // Pass overrides directly to avoid state synchronization issues
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
        <p className="text-gray-500 mt-1">Create a new pre-sales engagement</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          {/* Basic Info Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input 
                  type="text" 
                  value={newEngagement.company || ''}
                  onChange={e => updateField('company', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Acme Corporation" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.contactName || ''}
                    onChange={e => updateField('contactName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="John Smith" 
                  />
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
                    placeholder="john@acme.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input 
                    type="tel" 
                    value={newEngagement.contactPhone || ''}
                    onChange={e => updateField('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="+1 (555) 123-4567" 
                  />
                </div>
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
              </div>

              <DealSizeInput
                dealSizeAmount={dealSizeAmount}
                dealSizeUnit={dealSizeUnit}
                onAmountChange={setDealSizeAmount}
                onUnitChange={setDealSizeUnit}
                showValidationError={attemptedSubmit}
              />
            </div>
          </div>

          {/* Owners Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ownership</h3>
            <OwnerSelector
              selectedOwnerIds={newEngagement.ownerIds || []}
              teamMembers={teamMembers}
              onToggleOwner={handleToggleOwner}
            />
          </div>

          {/* Integrations Section (Collapsible) */}
          <details className="pt-4 border-t border-gray-100">
            <summary className="text-lg font-medium text-gray-900 cursor-pointer hover:text-gray-700">
              Integrations (Optional)
            </summary>
            <div className="mt-4 space-y-4">
              {/* Google Drive */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drive Folder Name
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.driveFolderName || ''}
                    onChange={e => updateField('driveFolderName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Acme POC Docs" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drive Folder URL
                  </label>
                  <input 
                    type="url" 
                    value={newEngagement.driveFolderUrl || ''}
                    onChange={e => updateField('driveFolderUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://drive.google.com/..." 
                  />
                </div>
              </div>

              {/* Google Docs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Doc Name
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.docsName || ''}
                    onChange={e => updateField('docsName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Running Notes" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Doc URL
                  </label>
                  <input 
                    type="url" 
                    value={newEngagement.docsUrl || ''}
                    onChange={e => updateField('docsUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://docs.google.com/..." 
                  />
                </div>
              </div>

              {/* Google Slides */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slides Deck Name
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.slidesName || ''}
                    onChange={e => updateField('slidesName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Demo Deck" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slides Deck URL
                  </label>
                  <input 
                    type="url" 
                    value={newEngagement.slidesUrl || ''}
                    onChange={e => updateField('slidesUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://docs.google.com/presentation/..." 
                  />
                </div>
              </div>

              {/* Google Sheets */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Sheet Name
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.sheetsName || ''}
                    onChange={e => updateField('sheetsName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="POC Tracker" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Sheet URL
                  </label>
                  <input 
                    type="url" 
                    value={newEngagement.sheetsUrl || ''}
                    onChange={e => updateField('sheetsUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://docs.google.com/spreadsheets/..." 
                  />
                </div>
              </div>

              {/* Slack */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slack Channel
                  </label>
                  <input 
                    type="text" 
                    value={newEngagement.slackChannel || ''}
                    onChange={e => updateField('slackChannel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="#acme-poc" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slack Channel URL
                  </label>
                  <input 
                    type="url" 
                    value={newEngagement.slackUrl || ''}
                    onChange={e => updateField('slackUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://slack.com/..." 
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Engagement
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEngagementView;
