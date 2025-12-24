import React, { useEffect } from 'react';

/**
 * Base Modal wrapper component
 * Handles: backdrop, click-outside-to-close, ESC key, size variants, optional scrolling
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  scrollable = false, 
  children 
}) => {
  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`bg-white rounded-2xl p-6 w-full ${sizeClasses[size]} mx-4 ${
          scrollable ? 'max-h-[80vh] flex flex-col' : ''
        }`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-xl font-medium text-gray-900 mb-6">{title}</h3>
        )}
        {scrollable ? (
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Modal;
