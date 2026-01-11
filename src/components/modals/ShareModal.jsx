import React, { useState, useEffect, useCallback } from 'react';
import { Modal, CheckIcon, TrashIcon, LinkIcon } from '../ui';

/**
 * Format relative time for display
 */
const formatRelativeTime = function(dateString) {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return diffDays + ' days ago';
  if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';
  if (diffDays < 365) return Math.floor(diffDays / 30) + ' months ago';
  return Math.floor(diffDays / 365) + ' years ago';
};

/**
 * Format expiration date for display
 */
const formatExpiration = function(expiresAt) {
  if (!expiresAt) return 'Never expires';
  
  const date = new Date(expiresAt);
  const now = new Date();
  
  if (date < now) return 'Expired';
  
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return 'Expires ' + date.toLocaleDateString('en-US', options);
};

/**
 * Individual share link row
 */
const ShareLinkRow = function(props) {
  const link = props.link;
  const onCopy = props.onCopy;
  const onRevoke = props.onRevoke;
  const getOwnerInfo = props.getOwnerInfo;
  
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isInactive = !link.isActive || isExpired;
  
  const creatorInfo = getOwnerInfo ? getOwnerInfo(link.createdById) : null;
  const creatorName = creatorInfo?.name || 'Unknown';
  
  const handleCopy = function() {
    const shareUrl = window.location.origin + '/share/' + link.token;
    navigator.clipboard.writeText(shareUrl).then(function() {
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(function() {
        setCopied(false);
      }, 2000);
    });
  };
  
  const handleRevokeClick = function() {
    setConfirming(true);
  };
  
  const handleConfirmRevoke = function() {
    if (onRevoke) onRevoke(link.id);
    setConfirming(false);
  };
  
  const handleCancelRevoke = function() {
    setConfirming(false);
  };
  
  if (isInactive) {
    return (
      <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {link.label || '(no label)'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {link.isActive ? 'Expired' : 'Revoked'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-6">
          Created by {creatorName}
        </p>
      </div>
    );
  }
  
  return (
    <div className="py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {link.label || '(no label)'}
          </span>
        </div>
        
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Revoke?</span>
            <button
              onClick={handleCancelRevoke}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRevoke}
              className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            >
              Revoke
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Copied</span>
                </>
              ) : (
                'Copy'
              )}
            </button>
            <button
              onClick={handleRevokeClick}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Revoke link"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        <p>Created by {creatorName} • {formatExpiration(link.expiresAt)}</p>
        {link.viewCount > 0 ? (
          <p>Viewed {link.viewCount} time{link.viewCount !== 1 ? 's' : ''} • Last viewed {formatRelativeTime(link.lastViewedAt)}</p>
        ) : (
          <p>Never viewed</p>
        )}
      </div>
    </div>
  );
};

/**
 * Share Modal - Create and manage share links
 */
const ShareModal = function(props) {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const shareLinks = props.shareLinks || [];
  const loading = props.loading;
  const error = props.error;
  const canCreateMore = props.canCreateMore;
  const maxLinks = props.maxLinks;
  const onCreateLink = props.onCreateLink;
  const onRevokeLink = props.onRevokeLink;
  const onFetchLinks = props.onFetchLinks;
  const getOwnerInfo = props.getOwnerInfo;
  
  const [label, setLabel] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [creating, setCreating] = useState(false);
  
  // Fetch links when modal opens
  useEffect(function() {
    if (isOpen && onFetchLinks) {
      onFetchLinks();
    }
  }, [isOpen, onFetchLinks]);
  
  // Reset form when modal closes
  useEffect(function() {
    if (!isOpen) {
      setLabel('');
      setExpiresInDays(90);
      setCreating(false);
    }
  }, [isOpen]);
  
  const handleCreate = useCallback(async function() {
    if (!onCreateLink || creating) return;
    
    setCreating(true);
    
    const options = {
      label: label.trim() || null,
      expiresInDays: expiresInDays === 'never' ? null : parseInt(expiresInDays, 10)
    };
    
    const result = await onCreateLink(options);
    
    setCreating(false);
    
    if (result) {
      setLabel('');
      setExpiresInDays(90);
    }
  }, [onCreateLink, creating, label, expiresInDays]);
  
  const handleRevoke = useCallback(function(linkId) {
    if (onRevokeLink) {
      onRevokeLink(linkId);
    }
  }, [onRevokeLink]);
  
  // Separate active and inactive links
  const activeLinks = shareLinks.filter(function(link) {
    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
    return link.isActive && !isExpired;
  });
  
  const inactiveLinks = shareLinks.filter(function(link) {
    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
    return !link.isActive || isExpired;
  });
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Engagement"
      size="md"
      scrollable={true}
    >
      <div className="space-y-6">
        {/* Explainer text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share links allow other PlainID team members to view this engagement in read-only mode.
        </p>
        
        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {/* Active links list */}
        {activeLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Links ({activeLinks.length}/{maxLinks})
            </h4>
            <div className="space-y-2">
              {activeLinks.map(function(link) {
                return (
                  <ShareLinkRow
                    key={link.id}
                    link={link}
                    onRevoke={handleRevoke}
                    getOwnerInfo={getOwnerInfo}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {activeLinks.length === 0 && !loading && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No active share links</p>
          </div>
        )}
        
        {/* Loading state */}
        {loading && shareLinks.length === 0 && (
          <div className="py-4 text-center">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin mx-auto"></div>
          </div>
        )}
        
        {/* Create new link form */}
        {canCreateMore && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Create New Link</h4>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Label (optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={function(e) { setLabel(e.target.value); }}
                placeholder="e.g., Q1 Board Review"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Expires
              </label>
              <select
                value={expiresInDays}
                onChange={function(e) { setExpiresInDays(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value="never">Never</option>
              </select>
            </div>
            
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        )}
        
        {/* Max links reached */}
        {!canCreateMore && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Maximum of {maxLinks} active links reached. Revoke an existing link to create a new one.
            </p>
          </div>
        )}
        
        {/* Inactive links (collapsed by default) */}
        {inactiveLinks.length > 0 && (
          <details className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              {inactiveLinks.length} expired or revoked link{inactiveLinks.length !== 1 ? 's' : ''}
            </summary>
            <div className="mt-3 space-y-2">
              {inactiveLinks.map(function(link) {
                return (
                  <ShareLinkRow
                    key={link.id}
                    link={link}
                    getOwnerInfo={getOwnerInfo}
                  />
                );
              })}
            </div>
          </details>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
