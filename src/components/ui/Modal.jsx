import React, { useEffect } from 'react';

/**
 * Base Modal wrapper component
 * Handles: backdrop, click-outside-to-close, ESC key, size variants, optional scrolling
 * 
 * Props:
 * - isOpen: boolean - controls visibility
 * - onClose: function - called when modal should close
 * - title: string - optional modal title
 * - size: 'md' | 'lg' - width variant
 * - scrollable: boolean - enables scrolling for long content
 * - footer: ReactNode - optional fixed footer content (buttons, etc.)
 * - children: ReactNode - modal body content
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  scrollable = false, 
  footer,
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

  // Determine if we need the scrollable layout
  const needsScrollLayout = scrollable || footer;

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-900 rounded-2xl w-full ${sizeClasses[size]} mx-4 ${
          needsScrollLayout ? 'flex flex-col max-h-[65vh] sm:max-h-[70vh] md:max-h-[75vh]' : ''
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - fixed at top */}
        {title && (
          <div className={`px-6 pt-6 ${needsScrollLayout ? 'pb-4 flex-shrink-0' : 'pb-6'}`}>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
        )}
        
        {/* Body content */}
        {needsScrollLayout ? (
          <div className={`flex-1 overflow-y-auto px-6 ${!title ? 'pt-6' : ''} ${footer ? '' : 'pb-6'}`}>
            {children}
          </div>
        ) : (
          <div className="p-6 pt-0">
            {children}
          </div>
        )}
        
        {/* Footer - fixed at bottom */}
        {footer && (
          <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
