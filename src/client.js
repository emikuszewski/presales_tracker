/**
 * Amplify AI Client Setup
 * 
 * This file creates the typed client and AI hooks for the SE Assistant.
 * Used by the CommandPalette component for AI conversations.
 */

import { generateClient } from 'aws-amplify/data';
import { createAIHooks } from '@aws-amplify/ui-react-ai';

// Generate the typed client
// Note: Schema type will be inferred from amplify_outputs.json at runtime
export const client = generateClient({ authMode: 'userPool' });

// Create AI hooks for conversation and generation routes
export const { useAIConversation, useAIGeneration } = createAIHooks(client);
