import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { industries, industryLabels } from '../../constants';
import { formatDealSize } from '../../utils';

/**
 * Modal for editing engagement details (company, contact, industry, deal size)
 * Manages its own local form state
 */
const EditDetailsModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    industry: 'TECHNOLOGY',
    dealSize: ''
  });

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        company: initialData.company || '',
        contactName: initialData.contactName || '',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
        industry: initialData.industry || 'TECHNOLOGY',
        dealSize: initialData.dealSize || ''
      });
    }
  }, [isOpen]); // Only reset when modal opens

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.contactName.trim()) return;
    
    onSave({
      company: formData.company.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      industry: formData.industry,
      dealSize: formatDealSize(formData.dealSize) || null
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDealSizeBlur = () => {
    const formatted = formatDealSize(formData.dealSize);
    if (formatted !== formData.dealSize) {
      updateField('dealSize', formatted);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Engagement Details">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input 
              type="text" 
              value={formData.company}
              onChange={e => updateField('company', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Acme Corporation" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name *
            </label>
            <input 
              type="text" 
              value={formData.contactName}
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
              value={formData.contactEmail}
              onChange={e => updateField('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="john@acme.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input 
              type="tel" 
              value={formData.contactPhone}
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
              value={formData.industry}
              onChange={e => updateField('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {industries.map(ind => (
                <option key={ind} value={ind}>{industryLabels[ind]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Size
            </label>
            <input 
              type="text" 
              value={formData.dealSize}
              onChange={e => updateField('dealSize', e.target.value)}
              onBlur={handleDealSizeBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="$100K" 
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
            disabled={!formData.company.trim() || !formData.contactName.trim()}
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditDetailsModal;
