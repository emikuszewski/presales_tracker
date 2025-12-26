import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { industries, industryLabels } from '../../constants';
import { formatDealSizeFromParts, parseDealSizeToParts } from '../../utils';

/**
 * Deal Size Input Component for Edit Modal
 * Two-field approach: number input + K/M unit dropdown
 * Validation: blocks save if number entered without unit selection
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
 * Modal for editing engagement details (company, contact, industry, deal size)
 * Manages its own local form state
 */
const EditDetailsModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    industry: 'TECHNOLOGY'
  });

  // Separate state for deal size parts
  const [dealSizeAmount, setDealSizeAmount] = useState('');
  const [dealSizeUnit, setDealSizeUnit] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        company: initialData.company || '',
        contactName: initialData.contactName || '',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
        industry: initialData.industry || 'TECHNOLOGY'
      });
      
      // Parse existing deal size into parts
      const parts = parseDealSizeToParts(initialData.dealSize);
      setDealSizeAmount(parts.amount);
      setDealSizeUnit(parts.unit);
      setAttemptedSubmit(false);
    }
  }, [isOpen]); // Only reset when modal opens

  // Validation: number entered but unit not selected
  const hasDealSizeValidationError = dealSizeAmount && !dealSizeUnit;

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!formData.company.trim() || !formData.contactName.trim()) return;
    if (hasDealSizeValidationError) return;
    
    // Format deal size from parts
    const formattedDealSize = dealSizeAmount && dealSizeUnit 
      ? formatDealSizeFromParts(dealSizeAmount, dealSizeUnit)
      : null;
    
    onSave({
      company: formData.company.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      industry: formData.industry,
      dealSize: formattedDealSize
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canSave = formData.company.trim() && 
                  formData.contactName.trim() && 
                  !hasDealSizeValidationError;

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
        form="edit-details-form"
        disabled={!canSave}
        className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Changes
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Engagement Details"
      scrollable
      footer={footerContent}
    >
      <form id="edit-details-form" onSubmit={handleSubmit}>
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
          
          {/* New Deal Size Input */}
          <DealSizeInput
            dealSizeAmount={dealSizeAmount}
            dealSizeUnit={dealSizeUnit}
            onAmountChange={setDealSizeAmount}
            onUnitChange={setDealSizeUnit}
            showValidationError={attemptedSubmit}
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditDetailsModal;
