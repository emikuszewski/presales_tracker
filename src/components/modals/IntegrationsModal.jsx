import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

/**
 * Modal for editing integration links (Drive, Docs, Slides, Slack)
 * Manages its own local form state
 * Grouped by: Documents (Drive, Docs, Slides) → Communication (Slack)
 */
const IntegrationsModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    salesforceId: '',
    salesforceUrl: '',
    jiraTicket: '',
    jiraUrl: '',
    driveFolderName: '',
    driveFolderUrl: '',
    docsName: '',
    docsUrl: '',
    slidesName: '',
    slidesUrl: '',
    slackChannel: '',
    slackUrl: ''
  });

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        salesforceId: initialData.salesforceId || '',
        salesforceUrl: initialData.salesforceUrl || '',
        jiraTicket: initialData.jiraTicket || '',
        jiraUrl: initialData.jiraUrl || '',
        driveFolderName: initialData.driveFolderName || '',
        driveFolderUrl: initialData.driveFolderUrl || '',
        docsName: initialData.docsName || '',
        docsUrl: initialData.docsUrl || '',
        slidesName: initialData.slidesName || '',
        slidesUrl: initialData.slidesUrl || '',
        slackChannel: initialData.slackChannel || '',
        slackUrl: initialData.slackUrl || ''
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
      driveFolderName: formData.driveFolderName || null,
      driveFolderUrl: formData.driveFolderUrl || null,
      docsName: formData.docsName || null,
      docsUrl: formData.docsUrl || null,
      slidesName: formData.slidesName || null,
      slidesUrl: formData.slidesUrl || null,
      slackChannel: formData.slackChannel || null,
      slackUrl: formData.slackUrl || null
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const footerContent = (
    <div className="flex gap-3">
      <button 
        type="button" 
        onClick={onClose}
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button 
        type="submit"
        form="integrations-form"
        className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
      >
        Save
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Integrations"
      scrollable
      footer={footerContent}
    >
      <form id="integrations-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Documents: Google Drive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drive Folder Name
            </label>
            <input 
              type="text" 
              value={formData.driveFolderName}
              onChange={e => updateField('driveFolderName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Acme Corp POC Docs" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drive Folder URL
            </label>
            <input 
              type="url" 
              value={formData.driveFolderUrl}
              onChange={e => updateField('driveFolderUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://drive.google.com/drive/folders/..." 
            />
          </div>

          {/* Documents: Google Docs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Doc Name
            </label>
            <input 
              type="text" 
              value={formData.docsName}
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
              value={formData.docsUrl}
              onChange={e => updateField('docsUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://docs.google.com/document/d/..." 
            />
          </div>

          {/* Documents: Google Slides */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slides Deck Name
            </label>
            <input 
              type="text" 
              value={formData.slidesName}
              onChange={e => updateField('slidesName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Customer Demo Deck" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slides Deck URL
            </label>
            <input 
              type="url" 
              value={formData.slidesUrl}
              onChange={e => updateField('slidesUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://docs.google.com/presentation/d/..." 
            />
          </div>

          {/* Visual spacing before Communication group */}
          <div className="pt-2"></div>

          {/* Communication: Slack */}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Channel URL
            </label>
            <input 
              type="url" 
              value={formData.slackUrl}
              onChange={e => updateField('slackUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://plainid.slack.com/archives/C0123456789" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Right-click the channel in Slack → Copy link
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrationsModal;
