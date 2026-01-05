import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import CompetitorLogo from '../ui/CompetitorLogo';
import { WarningIcon } from '../ui';
import { competitorConfig } from '../../constants';

/**
 * Modal for managing competitor selection and notes
 * Flat alphabetical checkbox list with inline "Other" text input
 */
const CompetitionModal = ({ 
  isOpen, 
  onClose, 
  initialCompetitors = [], 
  initialNotes = '',
  initialOtherName = '',
  onSave 
}) => {
  // Local state
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [competitorNotes, setCompetitorNotes] = useState('');
  const [otherCompetitorName, setOtherCompetitorName] = useState('');
  const [showOtherError, setShowOtherError] = useState(false);

  // Ref for OTHER input to scroll into view
  const otherInputRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCompetitors(initialCompetitors || []);
      setCompetitorNotes(initialNotes || '');
      setOtherCompetitorName(initialOtherName || '');
      setShowOtherError(false);
    }
  }, [isOpen, initialCompetitors, initialNotes, initialOtherName]);

  // Check if OTHER is selected
  const hasOther = selectedCompetitors.includes('OTHER');
  
  // Validation: OTHER selected but no name provided
  const otherValidationError = hasOther && !otherCompetitorName.trim();

  // Auto-scroll to OTHER input when it becomes visible
  useEffect(() => {
    if (hasOther && otherInputRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        otherInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [hasOther]);

  // Toggle competitor selection
  const toggleCompetitor = (competitorId) => {
    setSelectedCompetitors(prev => {
      if (prev.includes(competitorId)) {
        return prev.filter(c => c !== competitorId);
      } else {
        return [...prev, competitorId];
      }
    });
    // Clear error when OTHER is toggled off
    if (competitorId === 'OTHER') {
      setShowOtherError(false);
    }
  };

  // Handle save
  const handleSave = () => {
    // Validate OTHER requirement
    if (otherValidationError) {
      setShowOtherError(true);
      return;
    }

    onSave({
      competitors: selectedCompetitors,
      competitorNotes: competitorNotes.trim() || null,
      otherCompetitorName: hasOther ? otherCompetitorName.trim() : null
    });
    onClose();
  };

  const footerContent = (
    <div className="flex gap-3">
      <button 
        type="button" 
        onClick={onClose}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Cancel
      </button>
      <button 
        type="button"
        onClick={handleSave}
        className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white"
      >
        Save
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Competition"
      scrollable
      footer={footerContent}
    >
      <div className="space-y-6">
        {/* Competitor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Competitors
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {competitorConfig.map((competitor) => {
              const isSelected = selectedCompetitors.includes(competitor.id);
              const isOther = competitor.id === 'OTHER';
              
              return (
                <div key={competitor.id}>
                  <label 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCompetitor(competitor.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <CompetitorLogo competitor={competitor.id} size="sm" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{competitor.label}</span>
                  </label>
                  
                  {/* Inline text input for OTHER */}
                  {isOther && isSelected && (
                    <div ref={otherInputRef} className="ml-9 mt-2 mb-2">
                      <input
                        type="text"
                        value={otherCompetitorName}
                        onChange={(e) => {
                          setOtherCompetitorName(e.target.value);
                          if (e.target.value.trim()) {
                            setShowOtherError(false);
                          }
                        }}
                        placeholder="Enter competitor name"
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          showOtherError && otherValidationError
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {showOtherError && otherValidationError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <WarningIcon className="w-3 h-3" />
                          Please enter a competitor name
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Competition Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={competitorNotes}
            onChange={(e) => setCompetitorNotes(e.target.value)}
            placeholder="Add notes about the competitive landscape..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Notes can be added even without selecting competitors
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CompetitionModal;
