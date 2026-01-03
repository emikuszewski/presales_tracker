/**
 * CommandPalette - SE Assistant AI Interface
 * 
 * A command palette style interface (⌘K) for the AI assistant.
 * Features:
 * - Streaming responses
 * - Suggested prompts
 * - Context awareness (current engagement)
 * - Light session memory
 * - Source links to engagements
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAIConversation } from '../../client';

// Suggested prompts shown when palette opens
const SUGGESTED_PROMPTS = [
  { icon: '📊', text: 'What are my stale engagements?' },
  { icon: '📝', text: 'Summarize this engagement', requiresContext: true },
  { icon: '🎯', text: 'What should I focus on today?' },
  { icon: '🏆', text: 'Show competitor trends' },
  { icon: '📧', text: 'Help me draft a follow-up email', requiresContext: true },
];

// Maximum characters to show before truncating
const MAX_RESPONSE_LENGTH = 1500;

/**
 * Parse response text to convert engagement links to clickable links
 * Looks for patterns like [Company Name](/engagement/ID)
 */
function parseResponseWithLinks(text) {
  if (!text) return null;
  
  // Match markdown-style links: [text](/engagement/id)
  const linkRegex = /\[([^\]]+)\]\(\/engagement\/([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }
    // Add the link
    parts.push({
      type: 'link',
      text: match[1],
      href: `/engagement/${match[2]}`
    });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

/**
 * Component to render AI response with clickable links
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
            <a
              key={i}
              href={part.href}
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => {
                // Allow normal navigation, palette will close via route change
              }}
            >
              {part.text}
            </a>
          );
        }
        return <span key={i}>{part.content}</span>;
      })}
      {shouldTruncate && (
        <>
          <span className="text-gray-400">...</span>
          <button
            onClick={onToggleExpand}
            className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            Show more
          </button>
        </>
      )}
      {text && text.length > MAX_RESPONSE_LENGTH && isExpanded && (
        <button
          onClick={onToggleExpand}
          className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
}

/**
 * Loading indicator with typing animation
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
 * Main CommandPalette Component
 */
export default function CommandPalette({ 
  isOpen, 
  onClose, 
  currentEngagement = null,
  currentUser = null 
}) {
  const [input, setInput] = useState('');
  const [expandedMessages, setExpandedMessages] = useState({});
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Use Amplify AI conversation hook
  const [
    {
      data: { messages },
      isLoading,
    },
    handleSendMessage,
  ] = useAIConversation('chat');
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Build context string for the AI
  const buildContext = useCallback(() => {
    const contextParts = [];
    
    if (currentUser) {
      contextParts.push(`Current user: ${currentUser.name} (${currentUser.email})`);
    }
    
    if (currentEngagement) {
      contextParts.push(`Currently viewing engagement: ${currentEngagement.company} (ID: ${currentEngagement.id})`);
      contextParts.push(`Phase: ${currentEngagement.currentPhase || 'Unknown'}`);
      contextParts.push(`Status: ${currentEngagement.engagementStatus || 'Active'}`);
      if (currentEngagement.daysSinceActivity !== undefined) {
        contextParts.push(`Days since last activity: ${currentEngagement.daysSinceActivity}`);
      }
    }
    
    return contextParts.length > 0 
      ? `\n\n[Context]\n${contextParts.join('\n')}`
      : '';
  }, [currentEngagement, currentUser]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const context = buildContext();
    const messageWithContext = input + context;
    
    handleSendMessage({
      content: [{ text: messageWithContext }],
    });
    
    setInput('');
  };
  
  // Handle suggested prompt click
  const handleSuggestedPrompt = (prompt) => {
    if (prompt.requiresContext && !currentEngagement) {
      // If context required but not available, modify the prompt
      setInput(prompt.text.replace('this engagement', 'my engagements'));
    } else {
      setInput(prompt.text);
    }
    inputRef.current?.focus();
  };
  
  // Toggle message expansion
  const toggleExpand = (index) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Filter out context from displayed messages
  const getDisplayContent = (content) => {
    if (!content) return '';
    
    // Handle array of content blocks
    if (Array.isArray(content)) {
      return content
        .filter(block => block.text)
        .map(block => block.text)
        .join('\n')
        .replace(/\n\n\[Context\][\s\S]*$/, ''); // Remove context suffix
    }
    
    // Handle string content
    if (typeof content === 'string') {
      return content.replace(/\n\n\[Context\][\s\S]*$/, '');
    }
    
    return '';
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">SE Assistant</span>
            <span className="text-xs text-gray-400 ml-auto">ESC to close</span>
          </div>
          
          {/* Messages Area */}
          <div className="max-h-[50vh] overflow-y-auto">
            {messages && messages.length > 0 ? (
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {getDisplayContent(message.content)}
                        </p>
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Suggested Prompts */
              <div className="p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Suggested
                </p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, index) => {
                    const isDisabled = prompt.requiresContext && !currentEngagement;
                    return (
                      <button
                        key={index}
                        onClick={() => !isDisabled && handleSuggestedPrompt(prompt)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isDisabled
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="text-base">{prompt.icon}</span>
                        <span className="text-sm">{prompt.text}</span>
                        {isDisabled && (
                          <span className="text-xs text-gray-400 ml-auto">(open an engagement first)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100">
            <div className="flex items-center px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask SE Assistant..."
                disabled={isLoading}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </form>
          
          {/* Context Indicator */}
          {currentEngagement && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
              <p className="text-xs text-blue-600">
                <span className="font-medium">Context:</span> {currentEngagement.company}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
