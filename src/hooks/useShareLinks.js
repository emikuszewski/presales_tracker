import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

/**
 * Hook for Share Link CRUD operations
 * Handles create, revoke, list, and validation
 */
const useShareLinks = function(params) {
  const client = params.client;
  const engagementId = params.engagementId;
  const currentUser = params.currentUser;
  const logChangeAsync = params.logChangeAsync;

  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Maximum active links per engagement
  const MAX_ACTIVE_LINKS = 10;

  /**
   * Fetch all share links for an engagement
   */
  const fetchShareLinks = useCallback(async function() {
    if (!engagementId) return [];

    setLoading(true);
    setError(null);

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      if (!dataClient || !dataClient.models || !dataClient.models.ShareLink) {
        console.warn('[ShareLinks] ShareLink model not available');
        setLoading(false);
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
        setShareLinks(sorted);
        setLoading(false);
        return sorted;
      }

      setLoading(false);
      return [];
    } catch (err) {
      console.error('[ShareLinks] Error fetching share links:', err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [client, engagementId]);

  /**
   * Create a new share link
   * @param {Object} options - { label?: string, expiresInDays?: number | null }
   * @returns {Promise<Object|null>} The created share link or null on error
   */
  const createShareLink = useCallback(async function(options) {
    if (!engagementId || !currentUser) {
      setError('Missing engagement or user');
      return null;
    }

    const label = options?.label || null;
    const expiresInDays = options?.expiresInDays;

    // Check active link count
    const activeLinks = shareLinks.filter(function(link) {
      return link.isActive;
    });

    if (activeLinks.length >= MAX_ACTIVE_LINKS) {
      setError('Maximum of ' + MAX_ACTIVE_LINKS + ' active share links reached');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      if (!dataClient || !dataClient.models || !dataClient.models.ShareLink) {
        setError('ShareLink model not available');
        setLoading(false);
        return null;
      }

      // Generate unique token
      const token = nanoid(21);

      // Calculate expiration date
      let expiresAt = null;
      if (expiresInDays !== null && expiresInDays !== undefined) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + expiresInDays);
        expiresAt = expDate.toISOString();
      }

      const inputData = {
        engagementId: engagementId,
        token: token,
        createdById: currentUser.id,
        expiresAt: expiresAt,
        isActive: true,
        label: label ? label.trim() : null,
        viewCount: 0,
        lastViewedAt: null
      };

      const result = await dataClient.models.ShareLink.create(inputData);

      if (result.data) {
        // Add to local state
        setShareLinks(function(prev) {
          return [result.data].concat(prev);
        });

        // Log the change
        if (logChangeAsync) {
          const description = label
            ? 'Created share link: ' + label.trim()
            : 'Created share link';
          logChangeAsync(engagementId, 'SHARE_LINK_CREATED', description);
        }

        setLoading(false);
        return result.data;
      }

      if (result.errors) {
        setError('Error creating share link');
        console.error('[ShareLinks] Create errors:', result.errors);
      }

      setLoading(false);
      return null;
    } catch (err) {
      console.error('[ShareLinks] Error creating share link:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [client, engagementId, currentUser, shareLinks, logChangeAsync]);

  /**
   * Revoke (deactivate) a share link
   * @param {string} shareLinkId - The ID of the share link to revoke
   * @returns {Promise<boolean>} True if successful
   */
  const revokeShareLink = useCallback(async function(shareLinkId) {
    if (!shareLinkId) return false;

    setLoading(true);
    setError(null);

    try {
      const dataClient = typeof client === 'function' ? client() : client;

      // Find the link to get its label for logging
      const linkToRevoke = shareLinks.find(function(link) {
        return link.id === shareLinkId;
      });

      const result = await dataClient.models.ShareLink.update({
        id: shareLinkId,
        isActive: false
      });

      if (result.data) {
        // Update local state
        setShareLinks(function(prev) {
          return prev.map(function(link) {
            if (link.id === shareLinkId) {
              return Object.assign({}, link, { isActive: false });
            }
            return link;
          });
        });

        // Log the change
        if (logChangeAsync && linkToRevoke) {
          const description = linkToRevoke.label
            ? 'Revoked share link: ' + linkToRevoke.label
            : 'Revoked share link';
          logChangeAsync(engagementId, 'SHARE_LINK_REVOKED', description);
        }

        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (err) {
      console.error('[ShareLinks] Error revoking share link:', err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, [client, engagementId, shareLinks, logChangeAsync]);

  /**
   * Validate a share token and get the associated engagement ID
   * Also increments view count
   * @param {string} token - The share token to validate
   * @returns {Promise<Object|null>} { engagementId, isValid, reason? } or null on error
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

  /**
   * Get active share links count
   */
  const activeCount = shareLinks.filter(function(link) {
    return link.isActive;
  }).length;

  /**
   * Check if user can create more links
   */
  const canCreateMore = activeCount < MAX_ACTIVE_LINKS;

  return {
    shareLinks: shareLinks,
    loading: loading,
    error: error,
    activeCount: activeCount,
    canCreateMore: canCreateMore,
    maxLinks: MAX_ACTIVE_LINKS,
    fetchShareLinks: fetchShareLinks,
    createShareLink: createShareLink,
    revokeShareLink: revokeShareLink,
    validateToken: validateToken
  };
};

export default useShareLinks;
