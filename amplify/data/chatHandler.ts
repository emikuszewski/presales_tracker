/// <reference types="node" />
import {
  ConversationTurnEvent,
  ExecutableTool,
  handleConversationTurnEvent,
  createExecutableTool,
} from '@aws-amplify/backend-ai/conversation/runtime';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { Schema } from './resource';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Model ID for Titan Embeddings
const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

// Table name environment variables (set in backend.ts)
const ENGAGEMENT_TABLE = process.env.ENGAGEMENT_TABLE_NAME || '';
const PHASE_NOTE_TABLE = process.env.PHASE_NOTE_TABLE_NAME || '';
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE_NAME || '';
const COMMENT_TABLE = process.env.COMMENT_TABLE_NAME || '';

// Number of results to return
const TOP_K = 10;

// Minimum similarity threshold (0-1)
const MIN_SIMILARITY = 0.3;

/**
 * Generate embedding for search query using Bedrock Titan
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await bedrockClient.send(new InvokeModelCommand({
      modelId: EMBEDDING_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: query,
        dimensions: 512,
        normalize: true,
      }),
    }));
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Search result type
 */
interface SearchResult {
  type: 'PhaseNote' | 'Activity' | 'Comment' | 'Engagement';
  id: string;
  content: string;
  similarity: number;
  company?: string;
  phase?: string;
  activityType?: string;
  engagementId?: string;
}

/**
 * Scan a table and find records with embeddings similar to query
 */
async function searchTable(
  tableName: string,
  type: 'PhaseNote' | 'Activity' | 'Comment' | 'Engagement',
  queryEmbedding: number[],
  contentField: string,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    let lastEvaluatedKey: any = undefined;
    
    do {
      const scanResult = await docClient.send(new ScanCommand({
        TableName: tableName,
        ProjectionExpression: type === 'Engagement' 
          ? 'id, embedding, company, industry, competitorNotes, closedReason'
          : type === 'PhaseNote'
          ? 'id, embedding, engagementId, phaseType, #txt'
          : type === 'Activity'
          ? 'id, embedding, engagementId, #typ, description'
          : 'id, embedding, activityId, #txt',
        ExpressionAttributeNames: type === 'Activity' 
          ? { '#typ': 'type' }
          : type === 'Comment' || type === 'PhaseNote'
          ? { '#txt': 'text' }
          : undefined,
        ExclusiveStartKey: lastEvaluatedKey,
      }));
      
      for (const item of scanResult.Items || []) {
        if (!item.embedding) continue;
        
        try {
          const embedding = JSON.parse(item.embedding);
          const similarity = cosineSimilarity(queryEmbedding, embedding);
          
          if (similarity >= MIN_SIMILARITY) {
            let content = '';
            if (type === 'Engagement') {
              const parts = [];
              if (item.competitorNotes) parts.push(`Competitor Notes: ${item.competitorNotes}`);
              if (item.closedReason) parts.push(`Closed Reason: ${item.closedReason}`);
              content = parts.join('\n');
            } else if (type === 'Activity') {
              content = item.description || '';
            } else {
              content = item.text || '';
            }
            
            results.push({
              type,
              id: item.id,
              content,
              similarity,
              company: item.company,
              phase: item.phaseType,
              activityType: item.type,
              engagementId: item.engagementId || item.activityId,
            });
          }
        } catch (e) {
          // Skip items with invalid embeddings
        }
      }
      
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
  } catch (error) {
    console.error(`Error searching ${type} table:`, error);
  }
  
  return results;
}

/**
 * Get engagement details for enriching results
 */
async function getEngagementDetails(engagementId: string): Promise<{ company: string; industry: string } | null> {
  if (!ENGAGEMENT_TABLE || !engagementId) return null;
  
  try {
    const result = await docClient.send(new GetCommand({
      TableName: ENGAGEMENT_TABLE,
      Key: { id: engagementId },
      ProjectionExpression: 'company, industry',
    }));
    
    if (result.Item) {
      return {
        company: result.Item.company || 'Unknown',
        industry: result.Item.industry || 'Unknown',
      };
    }
  } catch (error) {
    console.error('Error fetching engagement:', error);
  }
  
  return null;
}

/**
 * Get activity details to find engagement for comments
 */
async function getActivityEngagementId(activityId: string): Promise<string | null> {
  if (!ACTIVITY_TABLE || !activityId) return null;
  
  try {
    const result = await docClient.send(new GetCommand({
      TableName: ACTIVITY_TABLE,
      Key: { id: activityId },
      ProjectionExpression: 'engagementId',
    }));
    
    return result.Item?.engagementId || null;
  } catch (error) {
    console.error('Error fetching activity:', error);
  }
  
  return null;
}

/**
 * The semantic search tool definition
 */
const searchEngagementContentTool = createExecutableTool(
  'search_engagement_content',
  'Searches through all notes, activities, comments, and engagement details across the entire pipeline to find content matching a query. Use when user asks about specific topics, technologies, competitors, objections, or wants to find which deals discussed something specific.',
  {
    query: z.string().describe('The search query - what to look for across all engagement content'),
  },
  async (input) => {
    console.log('Search tool called with query:', input.query);
    
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(input.query);
    if (!queryEmbedding) {
      return { 
        results: [],
        error: 'Failed to process search query',
      };
    }
    
    // Search all tables in parallel
    const [phaseNoteResults, activityResults, commentResults, engagementResults] = await Promise.all([
      searchTable(PHASE_NOTE_TABLE, 'PhaseNote', queryEmbedding, 'text'),
      searchTable(ACTIVITY_TABLE, 'Activity', queryEmbedding, 'description'),
      searchTable(COMMENT_TABLE, 'Comment', queryEmbedding, 'text'),
      searchTable(ENGAGEMENT_TABLE, 'Engagement', queryEmbedding, 'competitorNotes'),
    ]);
    
    // Combine all results
    let allResults = [
      ...phaseNoteResults,
      ...activityResults,
      ...commentResults,
      ...engagementResults,
    ];
    
    // Sort by similarity and take top K
    allResults.sort((a, b) => b.similarity - a.similarity);
    allResults = allResults.slice(0, TOP_K);
    
    // Enrich results with engagement details
    const enrichedResults = await Promise.all(
      allResults.map(async (result) => {
        let company = result.company;
        let engagementId = result.engagementId;
        
        // For comments, we need to look up the activity to get engagementId
        if (result.type === 'Comment' && result.engagementId) {
          engagementId = await getActivityEngagementId(result.engagementId);
        }
        
        // If we don't have company info, fetch it from engagement
        if (!company && engagementId) {
          const engagementDetails = await getEngagementDetails(engagementId);
          if (engagementDetails) {
            company = engagementDetails.company;
          }
        }
        
        return {
          type: result.type,
          company: company || 'Unknown',
          phase: result.phase,
          activityType: result.activityType,
          content: result.content,
          relevanceScore: Math.round(result.similarity * 100),
        };
      })
    );
    
    console.log(`Found ${enrichedResults.length} results`);
    
    return {
      results: enrichedResults,
      totalFound: enrichedResults.length,
      query: input.query,
    };
  }
);

/**
 * Main handler for conversation events
 */
export const handler = async (event: ConversationTurnEvent) => {
  console.log('Chat handler invoked');
  
  const tools: ExecutableTool[] = [searchEngagementContentTool];
  
  await handleConversationTurnEvent(event, {
    tools,
  });
};
