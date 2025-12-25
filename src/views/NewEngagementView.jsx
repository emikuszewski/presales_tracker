import React from 'react';
import { industries, industryLabels } from '../constants';
import { formatDealSize, getAvatarColorClasses } from '../utils';

/**
 * Form view for creating a new engagement
 * SE Team appears in owner picker with blue styling
 */
const NewEngagementView = ({
  newEngagement,
  setNewEngagement,
  teamMembers,
  onSubmit,
  onBack
}) => {
  const updateField = (field, value) => {
    setNewEngagement(prev => ({ ...prev, [field]: value }));
  };

  const handleDealSizeBlur = () => {
    const formatted = formatDealSize(newEngagement.dealSize);
    if (formatted !== newEngagement.dealSize) {
      updateField('dealSize', formatted);
    }
  };

  const toggleOwner = (memberId, isSelected) => {
    if (isSelected) {
      // Adding owner
      setNewEngagement(prev => ({ ...prev, ownerIds: [...prev.ownerIds, memberId] }));
    } else {
      // Removing owner - only if more than one
      if (newEngagement.ownerIds.length > 1) {
        setNewEngagement(prev => ({ ...prev, ownerIds: prev.ownerIds.filter(id => id !== memberId) }));
      }
    }
  };

  const canSubmit = newEngagement.company && newEngagement.contactName && newEngagement.ownerIds.length > 0;

  return (
    <div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cancel
      </button>

      <h2 className="text-2xl font-medium text-gray-900 mb-8">New Engagement</h2>

      <div className="max-w-xl space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Company & Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input 
                type="text" 
                value={newEngagement.company}
                onChange={e => updateField('company', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Acme Corporation" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input 
                type="text" 
                value={newEngagement.contactName}
                onChange={e => updateField('contactName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="John Smith" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input 
                type="email" 
                value={newEngagement.contactEmail}
                onChange={e => updateField('contactEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="john@acme.com" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input 
                type="tel" 
                value={newEngagement.contactPhone}
                onChange={e => updateField('contactPhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="+1 (555) 123-4567" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select 
                value={newEngagement.industry}
                onChange={e => updateField('industry', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{industryLabels[ind]}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
              <input 
                type="text" 
                value={newEngagement.dealSize}
                onChange={e => updateField('dealSize', e.target.value)}
                onBlur={handleDealSizeBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="$100K" 
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Owners</h3>
          <div className="space-y-2">
            {teamMembers.map(member => {
              const isSelected = newEngagement.ownerIds.includes(member.id);
              const isSystemUser = member.isSystemUser === true;
              
              // Determine avatar classes based on selection and system user status
              let avatarClasses;
              let labelClasses;
              let checkboxBorderClasses;
              
              if (isSelected) {
                if (isSystemUser) {
                  avatarClasses = 'bg-white text-blue-600';
                  labelClasses = 'bg-blue-500 text-white';
                  checkboxBorderClasses = 'border-white bg-white';
                } else {
                  avatarClasses = 'bg-white text-gray-900';
                  labelClasses = 'bg-gray-900 text-white';
                  checkboxBorderClasses = 'border-white bg-white';
                }
              } else {
                if (isSystemUser) {
                  avatarClasses = 'bg-blue-100 text-blue-700';
                  labelClasses = 'bg-gray-50 hover:bg-blue-50';
                  checkboxBorderClasses = 'border-blue-300';
                } else {
                  avatarClasses = 'bg-gray-200 text-gray-600';
                  labelClasses = 'bg-gray-50 hover:bg-gray-100';
                  checkboxBorderClasses = 'border-gray-300';
                }
              }
              
              return (
                <label 
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${labelClasses}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${avatarClasses}`}>
                      {member.initials}
                    </div>
                    <div>
                      <span className="font-medium">{member.name}</span>
                      {isSystemUser && (
                        <span className={`ml-2 text-xs ${isSelected ? 'text-blue-200' : 'text-blue-600'}`}>(Shared Pool)</span>
                      )}
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => toggleOwner(member.id, e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checkboxBorderClasses}`}>
                    {isSelected && (
                      <svg className={`w-3 h-3 ${isSystemUser ? 'text-blue-600' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {newEngagement.ownerIds.length === 0 && (
            <p className="text-sm text-red-500 mt-2">At least one owner is required</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Documents: Google Drive */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive Folder Name</label>
              <input 
                type="text" 
                value={newEngagement.driveFolderName}
                onChange={e => updateField('driveFolderName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Acme Corp POC Docs" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive Folder URL</label>
              <input 
                type="url" 
                value={newEngagement.driveFolderUrl}
                onChange={e => updateField('driveFolderUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://drive.google.com/drive/folders/..." 
              />
            </div>

            {/* Documents: Google Docs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Doc Name</label>
              <input 
                type="text" 
                value={newEngagement.docsName}
                onChange={e => updateField('docsName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Running Notes" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Doc URL</label>
              <input 
                type="url" 
                value={newEngagement.docsUrl}
                onChange={e => updateField('docsUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://docs.google.com/document/d/..." 
              />
            </div>

            {/* Documents: Google Slides */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slides Deck Name</label>
              <input 
                type="text" 
                value={newEngagement.slidesName}
                onChange={e => updateField('slidesName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Customer Demo Deck" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slides Deck URL</label>
              <input 
                type="url" 
                value={newEngagement.slidesUrl}
                onChange={e => updateField('slidesUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://docs.google.com/presentation/d/..." 
              />
            </div>

            {/* Documents: Google Sheets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet Name</label>
              <input 
                type="text" 
                value={newEngagement.sheetsName}
                onChange={e => updateField('sheetsName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="POC Tracker" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet URL</label>
              <input 
                type="url" 
                value={newEngagement.sheetsUrl}
                onChange={e => updateField('sheetsUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://docs.google.com/spreadsheets/d/..." 
              />
            </div>

            {/* Visual spacing row */}
            <div className="col-span-2 pt-2"></div>
            
            {/* Communication: Slack */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
              <input 
                type="text" 
                value={newEngagement.slackChannel}
                onChange={e => updateField('slackChannel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="#customer-poc" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel URL</label>
              <input 
                type="url" 
                value={newEngagement.slackUrl}
                onChange={e => updateField('slackUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://plainid.slack.com/archives/..." 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Engagement
        </button>
      </div>
    </div>
  );
};

export default NewEngagementView;
