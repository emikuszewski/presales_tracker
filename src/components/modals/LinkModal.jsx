import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

/**
 * Modal for adding a link to a phase
 * Manages its own local form state
 */
const LinkModal = ({ isOpen, onClose, phaseLabel, onAdd }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (title.trim() && url.trim()) {
      onAdd({ title: title.trim(), url: url.trim() });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Add Link to ${phaseLabel}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="link-title-input" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="link-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Architecture Diagram"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="link-url-input" className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              id="link-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://..."
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
            disabled={!title.trim() || !url.trim()}
            className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Link
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LinkModal;
