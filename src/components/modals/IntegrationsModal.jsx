import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

/**
 * Modal for editing integration links (Salesforce, Jira, Slack)
 * Manages its own local form state
 */
const IntegrationsModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    salesforceId: '',
    salesforceUrl: '',
    jiraTicket: '',
    jiraUrl: '',
    slackChannel: ''
  });

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        salesforceId: initialData.salesforceId || '',
        salesforceUrl: initialData.salesforceUrl || '',
        jiraTicket: initialData.jiraTicket || '',
        jiraUrl: initialData.jiraUrl || '',
        slackChannel: initialData.slackChannel || ''
      });
    }
  }, [isOpen]); // Only reset when modal opens

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      salesforceId: formData.salesforceId || null,
      salesforceUrl: formData.salesforceUrl || null,
      jiraTicket: formData.jiraTicket || null,
      jiraUrl: formData.jiraUrl || null,
      slackChannel: formData.slackChannel || null
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Integrations">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salesforce Opportunity ID
            </label>
            <input 
              type="text" 
              value={formData.salesforceId}
              onChange={e => updateField('salesforceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="006Dn000004XXXX" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salesforce URL
            </label>
            <input 
              type="url" 
              value={formData.salesforceUrl}
              onChange={e => updateField('salesforceUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://plainid.lightning.force.com/..." 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jira Ticket
            </label>
            <input 
              type="text" 
              value={formData.jiraTicket}
              onChange={e => updateField('jiraTicket', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="SE-1234" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jira URL
            </label>
            <input 
              type="url" 
              value={formData.jiraUrl}
              onChange={e => updateField('jiraUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://plainid.atlassian.net/browse/..." 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Channel
            </label>
            <input 
              type="text" 
              value={formData.slackChannel}
              onChange={e => updateField('slackChannel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="#customer-poc" 
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrationsModal;
