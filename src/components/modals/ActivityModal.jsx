import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { activityTypes, activityTypeLabels } from '../../constants';
import { getTodayDate } from '../../utils';

/**
 * Modal for logging a new activity
 * Manages its own local form state
 */
const ActivityModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    type: 'MEETING',
    description: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: getTodayDate(),
        type: 'MEETING',
        description: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!formData.date || !formData.description.trim()) return;
    onSave({
      date: formData.date,
      type: formData.type,
      description: formData.description.trim()
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Activity">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => updateField('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={e => updateField('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {activityTypes.map(type => (
              <option key={type} value={type}>{activityTypeLabels[type]}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            placeholder="What happened?"
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
          disabled={!formData.date || !formData.description.trim()}
          className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Activity
        </button>
      </div>
    </Modal>
  );
};

export default ActivityModal;
