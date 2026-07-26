import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';

/**
 * Hook for Share Link operations
 * Simplified to provide one-click sharing with automatic link management
 */
const useShareLinks = function(params) {
  const client = params.client;
  const engagementId = params.engagementId;
  const currentUser = params.currentUser;
  const logChangeAsync = params.logChangeAsync;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache to avoid refetching on every click
  const linksCache = useRef([]);

  // Maximum active links per engagement
  const MAX_ACTIVE_LINKS = 10;
  const DEFAULT_EXPIRY_DAYS = 90;

  /**
   * Fetch all share links for an engagement
   * @returns {Promise<Array>} Array of share links
   */
  const fetchShareLinks = useCallback(async function() {
    if (!engagementId) return [];

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      if (!dataClient || !dataClient.models || !dataClient.models.ShareLink) {
        console.warn('[ShareLinks] ShareLink model not available');
        return [];
      }

      const result = await dataClient.models.ShareLink.list({
        filter: { engagementId: { eq: engagementId } }
      });

      if (result.data) {
        // Sort by createdAt descending (newest first)
        const sorted = result.data.sort(function(a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        linksCache.current = sorted;
        return sorted;
      }

      return [];
    } catch (err) {
      console.error('[ShareLinks] Error fetching share links:', err);
      return [];
    }
  }, [client, engagementId]);

  /**
   * Create a new share link
   * @returns {Promise<Object|null>} The created share link or null on error
   */
  const createShareLink = useCallback(async function() {
    if (!engagementId || !currentUser) {
      return null;
    }

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      if (!dataClient || !dataClient.models || !dataClient.models.ShareLink) {
        return null;
      }

      // Generate unique token
      const token = nanoid(21);

      // Calculate expiration date (90 days)
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + DEFAULT_EXPIRY_DAYS);
      const expiresAt = expDate.toISOString();

      const inputData = {
        engagementId: engagementId,
        token: token,
        createdById: currentUser.id,
        expiresAt: expiresAt,
        isActive: true,
        label: null,
        viewCount: 0,
        lastViewedAt: null
      };

      const result = await dataClient.models.ShareLink.create(inputData);

      if (result.data) {
        // Update cache
        linksCache.current = [result.data].concat(linksCache.current);

        // Log the change
        if (logChangeAsync) {
          logChangeAsync(engagementId, 'SHARE_LINK_CREATED', 'Created share link');
        }

        return result.data;
      }

      return null;
    } catch (err) {
      console.error('[ShareLinks] Error creating share link:', err);
      return null;
    }
  }, [client, engagementId, currentUser, logChangeAsync]);

  /**
   * Revoke (deactivate) a share link
   * @param {string} shareLinkId - The ID of the share link to revoke
   * @returns {Promise<boolean>} True if successful
   */
  const revokeShareLink = useCallback(async function(shareLinkId) {
    if (!shareLinkId) return false;

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      const result = await dataClient.models.ShareLink.update({
        id: shareLinkId,
        isActive: false
      });

      if (result.data) {
        // Update cache
        linksCache.current = linksCache.current.map(function(link) {
          if (link.id === shareLinkId) {
            return Object.assign({}, link, { isActive: false });
          }
          return link;
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error('[ShareLinks] Error revoking share link:', err);
      return false;
    }
  }, [client]);

  /**
   * Get or create a share link - the main function for one-click sharing
   * - If active unexpired link exists, reuse it
   * - If at limit, revoke oldest and create new
   * - Otherwise create new
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  const getOrCreateLink = useCallback(async function() {
    if (!engagementId || !currentUser) {
      return { success: false, error: 'Not authorized' };
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch current links
      const links = await fetchShareLinks();
      
      // Find active unexpired links
      const now = new Date();
      const activeLinks = links.filter(function(link) {
        if (!link.isActive) return false;
        if (link.expiresAt && new Date(link.expiresAt) < now) return false;
        return true;
      });

      // If we have an active link, reuse it
      if (activeLinks.length > 0) {
        const existingLink = activeLinks[0]; // Most recent
        const shareUrl = window.location.origin + '/share/' + existingLink.token;
        setLoading(false);
        return { success: true, url: shareUrl };
      }

      // Check if at limit - if so, revoke oldest active (even if expired check passed, there might be edge cases)
      const allActiveLinks = links.filter(function(link) {
        return link.isActive;
      });

      if (allActiveLinks.length >= MAX_ACTIVE_LINKS) {
        // Revoke the oldest one (last in the sorted array since it's newest first)
        const oldestLink = allActiveLinks[allActiveLinks.length - 1];
        await revokeShareLink(oldestLink.id);
      }

      // Create new link
      const newLink = await createShareLink();

      if (newLink) {
        const shareUrl = window.location.origin + '/share/' + newLink.token;
        setLoading(false);
        return { success: true, url: shareUrl };
      }

      setLoading(false);
      setError('Failed to create share link');
      return { success: false, error: 'Failed to create share link' };
    } catch (err) {
      console.error('[ShareLinks] Error in getOrCreateLink:', err);
      setLoading(false);
      setError('Failed to create share link');
      return { success: false, error: 'Failed to create share link' };
    }
  }, [engagementId, currentUser, fetchShareLinks, revokeShareLink, createShareLink]);

  /**
   * Validate a share token and get the associated engagement ID
   * Also increments view count
   * @param {string} token - The share token to validate
   * @returns {Promise<Object>} { engagementId, isValid, reason? }
   */
  const validateToken = useCallback(async function(token) {
    if (!token) {
      return { isValid: false, reason: 'No token provided' };
    }

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      if (!dataClient || !dataClient.models || !dataClient.models.ShareLink) {
        return { isValid: false, reason: 'Service unavailable' };
      }

      // Find share link by token
      const result = await dataClient.models.ShareLink.list({
        filter: { token: { eq: token } }
      });

      if (!result.data || result.data.length === 0) {
        return { isValid: false, reason: 'Link not found' };
      }

      const shareLink = result.data[0];

      // Check if active
      if (!shareLink.isActive) {
        return { isValid: false, reason: 'This link is no longer valid' };
      }

      // Check expiration
      if (shareLink.expiresAt) {
        const expiresAt = new Date(shareLink.expiresAt);
        if (expiresAt < new Date()) {
          return { isValid: false, reason: 'This link is no longer valid' };
        }
      }

      // Increment view count and update last viewed
      try {
        await dataClient.models.ShareLink.update({
          id: shareLink.id,
          viewCount: (shareLink.viewCount || 0) + 1,
          lastViewedAt: new Date().toISOString()
        });
      } catch (updateErr) {
        // Non-fatal - log but don't fail validation
        console.warn('[ShareLinks] Could not update view count:', updateErr);
      }

      return {
        isValid: true,
        engagementId: shareLink.engagementId,
        shareLink: shareLink
      };
    } catch (err) {
      console.error('[ShareLinks] Error validating token:', err);
      return { isValid: false, reason: 'Error validating link' };
    }
  }, [client]);

  return {
    loading: loading,
    error: error,
    getOrCreateLink: getOrCreateLink,
    validateToken: validateToken
  };
};

export default useShareLinks;
