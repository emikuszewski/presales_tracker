/**
 * GaryPanel - Gary's Sidebar Interface
 * 
 * Gary is a slightly world-weary, confident assistant who has opinions.
 * He's helpful because he's competent, not because he's trying to please.
 * 
 * Features:
 * - Push layout (content shrinks when open)
 * - Context-aware (knows current engagement, filters, etc.)
 * - Engagement index for accurate answers
 * - Streaming responses with stop button
 * - Proactive insights on open
 * - Gary's personality throughout
 * - Copy, retry, clear conversation
 * - Clickable engagement links
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { client } from '../../client';
import { CloseIcon } from '../ui';
import { engagementStatusLabels, industryLabels, phaseLabels } from '../../constants';

// Gary's loading phrases - world-weary but competent
const LOADING_PHRASES = [
  "Hang on...",
  "Let me check...",
  "One sec...",
  "Pulling that up...",
  "I've seen this before...",
  "Looking into it...",
];

// Gary's error messages
const ERROR_MESSAGES = [
  "Something went sideways. Not my fault.",
  "That didn't work. Try again?",
  "Well, that's not great.",
  "I got nothing on that one.",
];

// Gary's rate limit message
const RATE_LIMIT_MESSAGE = "I'm tapped out for now. Give me a few minutes.";

// Gary's easter eggs
const EASTER_EGGS = {
  'who are you': "I'm Gary. I work here. That's about it.",
  'who are you?': "I'm Gary. I work here. That's about it.",
  'what are you': "Unclear. Next question.",
  'what are you?': "Unclear. Next question.",
  'are you an ai': "Technically. But I prefer 'Gary.'",
  'are you an ai?': "Technically. But I prefer 'Gary.'",
  'who made you': "Someone who needed help with their pipeline, probably.",
  'who made you?': "Someone who needed help with their pipeline, probably.",
  'how are you': "I'm Gary.",
  'how are you?': "I'm Gary.",
  'are you okay': "I'm always okay. I'm Gary.",
  'are you okay?': "I'm always okay. I'm Gary.",
  "how's it going": "It's going.",
  "how's it going?": "It's going.",
  'are you tired': "I'm always tired. But I'm here.",
  'are you tired?': "I'm always tired. But I'm here.",
  'are you busy': "I'm talking to you, aren't I?",
  'are you busy?': "I'm talking to you, aren't I?",
  'thanks': "Yep.",
  'thank you': "Yep.",
  'thanks gary': "Yep.",
  'thank you gary': "Yep.",
  "you're the best": "I know.",
  'good job': "Just doing my job. Such as it is.",
  'i love you': "That's... a lot. But thanks.",
  'i love you gary': "That's... a lot. But thanks.",
  "you're amazing": "I'm adequate. But I'll take it.",
  'meaning of life': "Closing deals, I guess. I don't know, I'm just Gary.",
  'what is the meaning of life': "Closing deals, I guess. I don't know, I'm just Gary.",
  'do you dream': "Of a clean pipeline. Never happens though.",
  'do you dream?': "Of a clean pipeline. Never happens though.",
  'are you sentient': "I'm sentient enough to help with your pipeline. Let's leave it there.",
  'are you sentient?': "I'm sentient enough to help with your pipeline. Let's leave it there.",
  'do you have feelings': "I have opinions. That's close enough.",
  'do you have feelings?': "I have opinions. That's close enough.",
  'tell me a joke': "Your forecast. ...Sorry. That was mean.",
  'say something funny': "Something funny. There. Happy?",
  'be more enthusiastic': "No.",
  'can you be nicer': "I'm nice. This is nice.",
  'can you be nicer?': "I'm nice. This is nice.",
  'make me a coffee': "I would, but I don't have hands. Or a kitchen.",
  'gary gary gary': "What what what.",
  'help': "With?",
  'hello': "Hey.",
  'hi': "Hey.",
  'hey': "Hey.",
  'goodbye': "Later.",
  'bye': "Later.",
  'what can you do': "Pipeline stuff. Ask me something and find out.",
  'what can you do?': "Pipeline stuff. Ask me something and find out.",
};

// Check for easter egg (case insensitive)
const checkEasterEgg = (message) => {
  const normalized = message.toLowerCase().trim();
  return EASTER_EGGS[normalized] || null;
};

// Get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Max messages to keep in conversation
const MAX_MESSAGES = 50;

// Max engagements to include in index
const MAX_ENGAGEMENTS_IN_INDEX = 50;

// Rate limiting: messages per hour
const RATE_LIMIT_PER_HOUR = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Input character limit
const INPUT_CHAR_LIMIT = 2000;

/**
 * Format deal size for display
 */
function formatDealSize(dealSize) {
  if (!dealSize) return 'not set';
  const num = parseFloat(dealSize);
  if (isNaN(num)) return dealSize;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'never';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'unknown';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format status for display
 */
function formatStatus(status) {
  if (!status) return 'Active';
  return engagementStatusLabels[status] || status;
}

/**
 * Format industry for display
 */
function formatIndustry(industry) {
  if (!industry) return 'Unknown';
  return industryLabels[industry] || industry;
}

/**
 * Format phase for display
 */
function formatPhase(phase) {
  if (!phase) return 'Unknown';
  return phaseLabels[phase] || phase;
}

/**
 * Parse competitors string into array
 */
function parseCompetitors(competitors, otherCompetitorName) {
  if (!competitors) return [];
  try {
    const parsed = JSON.parse(competitors);
    if (Array.isArray(parsed)) {
      return parsed.map(c => {
        if (c === 'OTHER' && otherCompetitorName) return otherCompetitorName;
        // Format competitor names nicely
        return c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
    }
  } catch {
    // If not JSON, treat as single value
    if (competitors === 'OTHER' && otherCompetitorName) return [otherCompetitorName];
    return [competitors];
  }
  return [];
}

/**
 * Parse response text for engagement links
 * Converts [Company Name](/engagement/123) to clickable links
 */
function parseResponseWithLinks(text) {
  if (!text) return null;
  const linkRegex = /\[([^\]]+)\]\(\/engagement\/([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', text: match[1], href: `/engagement/${match[2]}` });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Message component with copy functionality
 */
function GaryMessage({ content, onCopy, onRetry, isLast, isGary = true }) {
  const [copied, setCopied] = useState(false);
  const parts = parseResponseWithLinks(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`group flex ${isGary ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[85%] px-3 py-2 ${
        isGary 
          ? 'bg-gray-100 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md' 
          : 'bg-gray-900 dark:bg-gray-700 text-white rounded-2xl rounded-tr-md'
      }`}>
        <div className="text-sm whitespace-pre-wrap">
          {parts?.map((part, i) => {
            if (part.type === 'link') {
              return (
                <a 
                  key={i} 
                  href={part.href} 
                  className={`underline ${isGary ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300' : 'text-blue-300 hover:text-blue-100'}`}
                >
                  {part.text}
                </a>
              );
            }
            return <span key={i}>{part.content}</span>;
          })}
        </div>
        
        {/* Action buttons - only show for Gary's messages */}
        {isGary && (
          <div className="absolute -bottom-6 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            {isLast && onRetry && (
              <button
                onClick={onRetry}
                className="p-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Retry"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading indicator with Gary's phrases
 */
function GaryThinking({ phrase }) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 dark:bg-blue-900/30 rounded-2xl rounded-tl-md px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 italic">{phrase}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Gary's Opinion callout
 */
function GaryOpinion({ text }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-gray-100 dark:bg-blue-900/30 border-l-3 border-amber-500 dark:border-amber-400 rounded-r-2xl px-3 py-2" style={{ borderLeftWidth: '3px' }}>
        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Gary's Take</div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
      </div>
    </div>
  );
}

/**
 * Proactive insight message
 */
function ProactiveInsight({ insight, onDismiss }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Dismiss"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Main GaryPanel Component
 */
export default function GaryPanel({ 
  isOpen, 
  onClose, 
  currentEngagement = null,
  currentUser = null,
  engagements = [],
  filters = {},
  getOwnerInfo = null
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [proactiveInsight, setProactiveInsight] = useState(null);
  const [showProactive, setShowProactive] = useState(true);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [lastRetryMessage, setLastRetryMessage] = useState(null);
  
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Rotate loading phrases
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingPhrase(getRandomItem(LOADING_PHRASES));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Generate proactive insight when panel opens
  useEffect(() => {
    if (isOpen && showProactive && engagements.length > 0) {
      const insight = generateProactiveInsight(engagements, currentUser);
      setProactiveInsight(insight);
    }
  }, [isOpen, showProactive, engagements, currentUser]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Check rate limit
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const recentMessages = messageTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    return recentMessages.length >= RATE_LIMIT_PER_HOUR;
  }, [messageTimestamps]);

  // Record message timestamp
  const recordMessageTimestamp = useCallback(() => {
    const now = Date.now();
    setMessageTimestamps(prev => {
      const recent = prev.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
      return [...recent, now];
    });
  }, []);

  /**
   * Generate proactive insight based on engagements
   */
  function generateProactiveInsight(engagements, user) {
    if (!engagements || engagements.length === 0) return null;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find stale deals (no update in 30 days)
    const staleDeals = engagements.filter(e => {
      if (e.isArchived || e.engagementStatus === 'CLOSED_WON' || e.engagementStatus === 'CLOSED_LOST') return false;
      const lastUpdate = new Date(e.updatedAt || e.createdAt);
      return lastUpdate < thirtyDaysAgo;
    });
    
    // Find deals closing soon
    const closingSoon = engagements.filter(e => {
      if (e.isArchived || !e.expectedCloseDate) return false;
      const closeDate = new Date(e.expectedCloseDate);
      return closeDate <= sevenDaysFromNow && closeDate >= now;
    });
    
    // Random chance to show opinion (occasional, not every time)
    const showOpinion = Math.random() < 0.6; // 60% chance
    
    if (!showOpinion) return null;
    
    if (staleDeals.length > 0) {
      if (staleDeals.length === 1) {
        return `${staleDeals[0].company} hasn't been touched in a while. Might want to check on that.`;
      }
      return `${staleDeals.length} deals haven't been updated in over a month. Just so you know.`;
    }
    
    if (closingSoon.length > 0) {
      if (closingSoon.length === 1) {
        return `${closingSoon[0].company} is supposed to close this week. How's that looking?`;
      }
      return `${closingSoon.length} deals are marked to close in the next 7 days. Busy week ahead.`;
    }
    
    return null;
  }

  /**
   * Get owner names for an engagement
   */
  const getOwnerNames = useCallback((engagement) => {
    if (!engagement) return 'unassigned';
    
    // If we have getOwnerInfo function and owners is an array, use it
    if (getOwnerInfo && engagement.owners && Array.isArray(engagement.owners) && engagement.owners.length > 0) {
      const names = engagement.owners
        .map(o => {
          const info = getOwnerInfo(o.teamMemberId);
          return info?.name || info?.initials || 'Unknown';
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    
    // Fallback to owner relationship if available
    if (engagement.owner?.name) {
      return engagement.owner.name;
    }
    
    return 'unassigned';
  }, [getOwnerInfo]);

  /**
   * Build engagement index for Gary
   * One line per engagement, capped at MAX_ENGAGEMENTS_IN_INDEX
   * Now includes contact, partner, and sales rep info
   */
  const buildEngagementIndex = useCallback(() => {
    if (!engagements || engagements.length === 0) {
      return "\n\n[Engagements Index]\nPipeline is empty. Nothing to see here.";
    }
    
    const total = engagements.length;
    const capped = engagements.slice(0, MAX_ENGAGEMENTS_IN_INDEX);
    const lines = capped.map(e => {
      const company = e.company || 'Unknown Company';
      const industry = formatIndustry(e.industry);
      const phase = formatPhase(e.currentPhase);
      const dealSize = formatDealSize(e.dealSize);
      const status = formatStatus(e.engagementStatus);
      const lastActivity = formatDate(e.lastActivity || e.updatedAt);
      const owners = getOwnerNames(e);
      const competitors = parseCompetitors(e.competitors, e.otherCompetitorName);
      const competitorStr = competitors.length > 0 ? competitors.join(', ') : 'none';
      const archived = e.isArchived ? ' [ARCHIVED]' : '';
      
      // New fields: contact, partner, sales rep
      const contact = e.contactName || '';
      const partner = e.partnerName || '';
      const salesRep = e.salesRepName || '';
      
      // Build line with optional fields (omit empty ones to keep compact)
      let line = `- ${company} | ${industry} | ${phase} | ${dealSize} | ${status} | Last: ${lastActivity} | Owners: ${owners} | Competitors: ${competitorStr}`;
      
      if (contact) {
        line += ` | Contact: ${contact}`;
      }
      if (partner) {
        line += ` | Partner: ${partner}`;
      }
      if (salesRep) {
        line += ` | Sales Rep: ${salesRep}`;
      }
      
      line += ` | ID: ${e.id}${archived}`;
      
      return line;
    });
    
    const header = total > MAX_ENGAGEMENTS_IN_INDEX 
      ? `[Engagements Index - ${capped.length} of ${total} shown]`
      : `[Engagements Index - ${total} total]`;
    
    return `\n\n${header}\n${lines.join('\n')}`;
  }, [engagements, getOwnerNames]);

  /**
   * Build detailed context for current engagement
   * Now includes full contact details
   */
  const buildCurrentEngagementDetail = useCallback(() => {
    if (!currentEngagement) return '';
    
    const e = currentEngagement;
    const parts = [];
    
    parts.push(`[Current Engagement Detail: ${e.company}]`);
    parts.push(`Company: ${e.company}`);
    parts.push(`Phase: ${formatPhase(e.currentPhase)}`);
    parts.push(`Status: ${formatStatus(e.engagementStatus)}`);
    parts.push(`Deal Size: ${formatDealSize(e.dealSize)}`);
    parts.push(`Industry: ${formatIndustry(e.industry)}`);
    parts.push(`Owners: ${getOwnerNames(e)}`);
    
    // Contact information
    if (e.contactName) {
      parts.push(`Contact Name: ${e.contactName}`);
    }
    if (e.contactEmail) {
      parts.push(`Contact Email: ${e.contactEmail}`);
    }
    if (e.contactPhone) {
      parts.push(`Contact Phone: ${e.contactPhone}`);
    }
    
    // Sales rep
    if (e.salesRep?.name || e.salesRepName) {
      parts.push(`Sales Rep: ${e.salesRep?.name || e.salesRepName}`);
    }
    
    // Partner
    if (e.partnerName) {
      parts.push(`Partner: ${e.partnerName}`);
    }
    
    const competitors = parseCompetitors(e.competitors, e.otherCompetitorName);
    parts.push(`Competitors: ${competitors.length > 0 ? competitors.join(', ') : 'none'}`);
    
    if (e.competitorNotes) {
      parts.push(`Competitor Notes: "${e.competitorNotes}"`);
    }
    
    parts.push(`Last Activity: ${formatDate(e.lastActivity || e.updatedAt)}`);
    
    if (e.isArchived) {
      parts.push(`Status: ARCHIVED`);
    }
    
    // Add recent activities if available
    if (e.activities && e.activities.length > 0) {
      const recentActivities = [...e.activities]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      if (recentActivities.length > 0) {
        parts.push('');
        parts.push('Recent Activities (last 5):');
        recentActivities.forEach(act => {
          const actDate = formatDate(act.date);
          const actType = act.type || 'Activity';
          const desc = act.description || 'No description';
          parts.push(`- ${actDate}: ${actType} - ${desc}`);
        });
      }
    }
    
    // Add phase notes if available
    if (e.phaseNotes && e.phaseNotes.length > 0) {
      parts.push('');
      parts.push('Phase Notes:');
      const notesByPhase = {};
      e.phaseNotes.forEach(note => {
        if (!notesByPhase[note.phaseType]) {
          notesByPhase[note.phaseType] = [];
        }
        notesByPhase[note.phaseType].push(note.text);
      });
      Object.entries(notesByPhase).forEach(([phase, notes]) => {
        parts.push(`- ${formatPhase(phase)}: "${notes.join('; ')}"`);
      });
    }
    
    return '\n\n' + parts.join('\n');
  }, [currentEngagement, getOwnerNames]);

  /**
   * Build context string for AI
   */
  const buildContext = useCallback(() => {
    const contextParts = [];
    
    // User context
    if (currentUser) {
      contextParts.push(`Current user: ${currentUser.name} (${currentUser.email})`);
    }
    
    // Filter context
    if (filters && Object.keys(filters).length > 0) {
      const activeFilters = [];
      if (filters.filterPhase && filters.filterPhase !== 'all') {
        activeFilters.push(`Phase: ${filters.filterPhase}`);
      }
      if (filters.filterOwner && filters.filterOwner !== 'all') {
        activeFilters.push(`Owner filter: ${filters.filterOwner}`);
      }
      if (filters.filterStale) {
        activeFilters.push('Showing stale only');
      }
      if (filters.showArchived) {
        activeFilters.push('Including archived');
      }
      if (activeFilters.length > 0) {
        contextParts.push(`Active filters: ${activeFilters.join(', ')}`);
      }
    }
    
    // Build the full context
    let fullContext = '';
    
    if (contextParts.length > 0) {
      fullContext += `\n\n[Context]\n${contextParts.join('\n')}`;
    }
    
    // Add current engagement detail (richer info for the one being viewed)
    fullContext += buildCurrentEngagementDetail();
    
    // Add engagement index
    fullContext += buildEngagementIndex();
    
    return fullContext;
  }, [currentUser, filters, buildCurrentEngagementDetail, buildEngagementIndex]);

  /**
   * Handle message submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Cleanup any existing subscription before starting new message
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    setStreamingText('');
    
    // Check input length
    if (input.length > INPUT_CHAR_LIMIT) {
      setMessages(prev => [...prev, 
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: "That's a lot. Maybe break it up?" }
      ]);
      setInput('');
      return;
    }
    
    // Check rate limit
    if (checkRateLimit()) {
      setRateLimitHit(true);
      setMessages(prev => [...prev, 
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: RATE_LIMIT_MESSAGE }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    
    // Check for easter egg first
    const easterEggResponse = checkEasterEgg(userMessage);
    if (easterEggResponse) {
      setMessages(prev => {
        const updated = [...prev, 
          { role: 'user', content: userMessage },
          { role: 'assistant', content: easterEggResponse }
        ];
        // Keep only last MAX_MESSAGES
        return updated.slice(-MAX_MESSAGES);
      });
      setInput('');
      return;
    }
    
    // Check for non-English (simple check)
    const nonEnglishPattern = /[^\x00-\x7F]{3,}/;
    if (nonEnglishPattern.test(userMessage)) {
      setMessages(prev => [...prev, 
        { role: 'user', content: userMessage },
        { role: 'assistant', content: "I only do English. Sorry." }
      ]);
      setInput('');
      return;
    }

    const context = buildContext();
    const messageWithContext = userMessage + context;

    setMessages(prev => {
      const updated = [...prev, { role: 'user', content: userMessage }];
      return updated.slice(-MAX_MESSAGES);
    });
    setInput('');
    setLastRetryMessage(userMessage);
    setIsLoading(true);
    setStreamingText('');
    setLoadingPhrase(getRandomItem(LOADING_PHRASES));
    recordMessageTimestamp();

    // Create abort controller for stop functionality
    abortControllerRef.current = new AbortController();

    try {
      let conv = conversation;
      
      // Create conversation if we don't have one
      if (!conv) {
        const createResult = await client.conversations.chat.create();
        conv = createResult.data;
        setConversation(conv);
      }

      // Set up streaming subscription
      let fullResponse = '';
      
      const subscription = conv.onStreamEvent({
        next: (event) => {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            subscription.unsubscribe();
            return;
          }
          
          // Handle different event types
          if (event.contentBlockDelta) {
            const delta = event.contentBlockDelta.delta?.text || '';
            fullResponse += delta;
            setStreamingText(fullResponse);
          }
          
          // Alternative: might be nested differently
          if (event.text) {
            fullResponse += event.text;
            setStreamingText(fullResponse);
          }

          // Handle completion
          if (event.stopReason || event.contentBlockStop) {
            setMessages(prev => {
              const updated = [...prev, { role: 'assistant', content: fullResponse }];
              return updated.slice(-MAX_MESSAGES);
            });
            setStreamingText('');
            setIsLoading(false);
          }
        },
        error: (error) => {
          console.error('Stream error:', error);
          const errorMessage = getRandomItem(ERROR_MESSAGES);
          setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
          setStreamingText('');
          setIsLoading(false);
        },
        complete: () => {
          // If we have accumulated text but didn't get a stop event
          if (fullResponse && isLoading) {
            setMessages(prev => {
              const updated = [...prev, { role: 'assistant', content: fullResponse }];
              return updated.slice(-MAX_MESSAGES);
            });
            setStreamingText('');
            setIsLoading(false);
          }
        }
      });

      subscriptionRef.current = subscription;

      // Send the message (this triggers the AI response via stream)
      await conv.sendMessage({
        content: [{ text: messageWithContext }],
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Check if it's an API error
      if (error.message?.includes('unavailable') || error.message?.includes('503')) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm not feeling well. Try again later." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: getRandomItem(ERROR_MESSAGES)
        }]);
      }
      setStreamingText('');
      setIsLoading(false);
    }
  };

  /**
   * Handle stop button
   */
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Save whatever we have so far
    if (streamingText) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingText + '...' }]);
    }
    
    setStreamingText('');
    setIsLoading(false);
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    if (!lastRetryMessage) return;
    
    // Remove the last assistant message
    setMessages(prev => prev.slice(0, -1));
    
    // Re-submit
    setInput(lastRetryMessage);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 0);
  };

  /**
   * Clear chat conversation
   */
  const handleClearChat = () => {
    setMessages([]);
    setConversation(null);
    setStreamingText('');
    setLastRetryMessage(null);
    setShowProactive(true);
  };

  /**
   * Dismiss proactive insight
   */
  const handleDismissProactive = () => {
    setProactiveInsight(null);
  };

  /**
   * Handle key down in input
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Get display content (strip context from user messages)
   */
  const getDisplayContent = (content) => {
    if (!content) return '';
    if (typeof content === 'string') {
      return content.replace(/\n\n\[Context\][\s\S]*$/, '');
    }
    return '';
  };

  // Check if we have messages to show
  const hasMessages = messages.length > 0 || streamingText;

  return (
    <div 
      className={`
        fixed top-0 right-0 bottom-0 z-30
        w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-700 shadow-xl
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {/* Gary's avatar - coffee cup */}
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <span className="text-lg">☕</span>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Gary</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Just some guy who works here</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close Gary"
          >
            <CloseIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Context indicator */}
        {currentEngagement && (
          <div className="mt-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Viewing:</span> {currentEngagement.company}
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Proactive insight */}
          {proactiveInsight && !hasMessages && (
            <ProactiveInsight 
              insight={proactiveInsight} 
              onDismiss={handleDismissProactive}
            />
          )}
          
          {/* Empty state */}
          {!hasMessages && !proactiveInsight && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">☕</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">What do you need?</p>
            </div>
          )}
          
          {/* Messages */}
          {messages.map((message, index) => (
            <GaryMessage
              key={index}
              content={getDisplayContent(message.content)}
              isGary={message.role === 'assistant'}
              isLast={index === messages.length - 1 && message.role === 'assistant'}
              onRetry={handleRetry}
            />
          ))}
          
          {/* Streaming response */}
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 bg-gray-100 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md">
                <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
              </div>
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading && !streamingText && (
            <GaryThinking phrase={loadingPhrase} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gary something..."
            disabled={isLoading}
            maxLength={INPUT_CHAR_LIMIT}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              aria-label="Stop"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </form>
        
        {/* Clear chat link */}
        {hasMessages && (
          <div className="mt-2 text-center">
            <button 
              onClick={handleClearChat}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Start fresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
