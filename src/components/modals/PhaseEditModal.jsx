import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { phaseConfig } from '../../constants';

/**
 * Modal for editing a phase's status and notes
 * Manages its own local form state
 */
const PhaseEditModal = ({ 
  isOpen, 
  onClose, 
  phaseId, 
  initialStatus, 
  initialNotes, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    status: 'PENDING',
    notes: ''
  });

  // Reset form when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      setFormData({
        status: initialStatus || 'PENDING',
        notes: initialNotes || ''
      });
    }
  }, [isOpen]); // Only reset when modal opens, not when initialStatus/initialNotes change

  const phaseLabel = phaseConfig.find(p => p.id === phaseId)?.label || '';

  const handleSubmit = () => {
    onSave({
      status: formData.status,
      notes: formData.notes
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update ${phaseLabel} Phase`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={e => updateField('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={e => updateField('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            placeholder="Key findings, decisions, blockers..."
          />
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button 
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
};

export default PhaseEditModal;
