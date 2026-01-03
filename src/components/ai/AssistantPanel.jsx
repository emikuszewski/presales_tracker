/**
 * AssistantPanel - SE Assistant Sidebar Interface
 * 
 * Right-side sliding panel for AI assistance.
 * Features:
 * - Push layout (content shrinks when open)
 * - Context-aware (shows current engagement when on DetailView)
 * - Streaming responses
 * - Suggested prompts with SVG icons
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { client } from '../../client';

/**
 * Suggested prompts with SVG icons instead of emoji
 */
const SUGGESTED_PROMPTS = [
  { 
    id: 'stale',
    icon: 'clock',
    text: 'Stale engagements',
    fullText: 'What are my stale engagements?',
    requiresContext: false 
  },
  { 
    id: 'focus',
    icon: 'clipboard',
    text: "Today's focus",
    fullText: 'What should I focus on today?',
    requiresContext: false 
  },
  { 
    id: 'competitors',
    icon: 'users',
    text: 'Competitor trends',
    fullText: 'Show competitor trends',
    requiresContext: false 
  },
  { 
    id: 'summarize',
    icon: 'document',
    text: 'Summarize engagement',
    fullText: 'Summarize this engagement',
    requiresContext: true 
  },
  { 
    id: 'email',
    icon: 'mail',
    text: 'Draft follow-up',
    fullText: 'Help me draft a follow-up email',
    requiresContext: true 
  },
];

const MAX_RESPONSE_LENGTH = 1500;

/**
 * SVG Icons for prompts
 */
const PromptIcon = ({ type, className = "w-4 h-4" }) => {
  switch (type) {
    case 'clock':
      return (
        <svg className={`${className} text-amber-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'users':
      return (
        <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'document':
      return (
        <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * Parse response text for engagement links
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
 * Response text with expandable content and clickable links
 */
function ResponseText({ text, isExpanded, onToggleExpand }) {
  const shouldTruncate = text && text.length > MAX_RESPONSE_LENGTH && !isExpanded;
  const displayText = shouldTruncate ? text.slice(0, MAX_RESPONSE_LENGTH) : text;
  const parts = parseResponseWithLinks(displayText);
  
  return (
    <div className="text-sm text-gray-700 whitespace-pre-wrap">
      {parts?.map((part, i) => {
        if (part.type === 'link') {
          return (
            <a key={i} href={part.href} className="text-blue-600 hover:text-blue-800 underline">
              {part.text}
            </a>
          );
        }
        return <span key={i}>{part.content}</span>;
      })}
      {shouldTruncate && (
        <>
          <span className="text-gray-400">...</span>
          <button onClick={onToggleExpand} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium">
            Show more
          </button>
        </>
      )}
      {text && text.length > MAX_RESPONSE_LENGTH && isExpanded && (
        <button onClick={onToggleExpand} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium">
          Show less
        </button>
      )}
    </div>
  );
}

/**
 * Typing indicator (3 bouncing dots)
 */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/**
 * Main AssistantPanel Component
 */
export default function AssistantPanel({ 
  isOpen, 
  onClose, 
  currentEngagement = null,
  currentUser = null 
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to allow animation to start
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

  /**
   * Build context string for AI
   */
  const buildContext = useCallback(() => {
    const contextParts = [];
    if (currentUser) {
      contextParts.push(`Current user: ${currentUser.name} (${currentUser.email})`);
    }
    if (currentEngagement) {
      contextParts.push(`Currently viewing engagement: ${currentEngagement.company} (ID: ${currentEngagement.id})`);
      contextParts.push(`Phase: ${currentEngagement.currentPhase || 'Unknown'}`);
      contextParts.push(`Status: ${currentEngagement.engagementStatus || 'Active'}`);
    }
    return contextParts.length > 0 ? `\n\n[Context]\n${contextParts.join('\n')}` : '';
  }, [currentEngagement, currentUser]);

  /**
   * Handle message submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const context = buildContext();
    const messageWithContext = userMessage + context;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

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
            setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
            setStreamingText('');
            setIsLoading(false);
          }
        },
        error: (error) => {
          console.error('Stream error:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Sorry, something went wrong. Please try again.' 
          }]);
          setStreamingText('');
          setIsLoading(false);
        },
        complete: () => {
          // If we have accumulated text but didn't get a stop event
          if (fullResponse && isLoading) {
            setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
      setStreamingText('');
      setIsLoading(false);
    }
  };

  /**
   * Handle suggested prompt click
   */
  const handleSuggestedPrompt = (prompt) => {
    if (prompt.requiresContext && !currentEngagement) {
      // Modify prompt if context not available
      setInput(prompt.fullText.replace('this engagement', 'my engagements'));
    } else {
      setInput(prompt.fullText);
    }
    inputRef.current?.focus();
  };

  /**
   * Toggle message expansion
   */
  const toggleExpand = (index) => {
    setExpandedMessages(prev => ({ ...prev, [index]: !prev[index] }));
  };

  /**
   * Clear chat conversation
   */
  const handleClearChat = () => {
    setMessages([]);
    setConversation(null);
    setStreamingText('');
    setExpandedMessages({});
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
        w-80 bg-white border-l border-gray-200 shadow-xl
        flex flex-col
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900">SE Assistant</span>
          <button 
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close assistant"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Context indicator */}
        {currentEngagement && (
          <div className="mt-2 px-2 py-1 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Viewing:</span> {currentEngagement.company}
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <div className="p-4 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 ${
                  message.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-2xl rounded-tr-md' 
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md'
                }`}>
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{getDisplayContent(message.content)}</p>
                  ) : (
                    <ResponseText
                      text={getDisplayContent(message.content)}
                      isExpanded={expandedMessages[index]}
                      onToggleExpand={() => toggleExpand(index)}
                    />
                  )}
                </div>
              </div>
            ))}
            
            {/* Streaming response */}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md">
                  <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-md px-3 py-2">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Suggested Prompts */
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => {
                const isDisabled = prompt.requiresContext && !currentEngagement;
                return (
                  <button
                    key={prompt.id}
                    onClick={() => !isDisabled && handleSuggestedPrompt(prompt)}
                    disabled={isDisabled}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 
                      text-sm font-medium rounded-lg
                      border transition-colors
                      ${isDisabled 
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                    title={isDisabled ? 'Open an engagement first' : prompt.fullText}
                  >
                    <PromptIcon type={prompt.icon} className="w-3.5 h-3.5" />
                    {prompt.text}
                  </button>
                );
              })}
            </div>
            
            {/* Helper text */}
            <p className="mt-4 text-xs text-gray-400">
              Ask me anything about your engagements, competitors, or priorities.
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SE Assistant..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        
        {/* Clear chat link */}
        {hasMessages && (
          <div className="mt-2 text-center">
            <button 
              onClick={handleClearChat}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
