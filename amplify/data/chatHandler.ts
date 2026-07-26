/// <reference types="node" />
import {
  ConversationTurnEvent,
  handleConversationTurnEvent,
  ExecutableTool,
  ToolResultContentBlock,
} from '@aws-amplify/backend-ai/conversation/runtime';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Model ID for Titan Embeddings
const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

// Number of results to return
const TOP_K = 10;

// Minimum similarity threshold (0-1)
const MIN_SIMILARITY = 0.3;

// Cache for discovered table names
let tableCache: {
  engagement: string;
  phaseNote: string;
  activity: string;
  comment: string;
} | null = null;

/**
 * Discover table names by listing DynamoDB tables
 */
async function discoverTableNames(): Promise<typeof tableCache> {
  if (tableCache) return tableCache;
  
  try {
    const result = await dynamoClient.send(new ListTablesCommand({}));
    const tables = result.TableNames || [];
    
    const engagement = tables.find(t => t.startsWith('Engagement-'));
    const phaseNote = tables.find(t => t.startsWith('PhaseNote-'));
    const activity = tables.find(t => t.startsWith('Activity-'));
    const comment = tables.find(t => t.startsWith('Comment-'));
    
    if (engagement && phaseNote && activity && comment) {
      tableCache = { engagement, phaseNote, activity, comment };
      console.log('Discovered tables:', tableCache);
      return tableCache;
    }
    
    console.error('Could not find all required tables. Found:', { engagement, phaseNote, activity, comment });
    return null;
  } catch (error) {
    console.error('Error discovering tables:', error);
    return null;
  }
}

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
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  if (!tableName) return results;
  
  try {
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    
    do {
      const scanResult: ScanCommandOutput = await docClient.send(new ScanCommand({
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
          : (type === 'Comment' || type === 'PhaseNote')
          ? { '#txt': 'text' }
          : undefined,
        ExclusiveStartKey: lastEvaluatedKey,
      }));
      
      for (const item of scanResult.Items || []) {
        if (!item.embedding) continue;
        
        try {
          const embedding = JSON.parse(item.embedding as string);
          const similarity = cosineSimilarity(queryEmbedding, embedding);
          
          if (similarity >= MIN_SIMILARITY) {
            let content = '';
            if (type === 'Engagement') {
              const parts: string[] = [];
              if (item.competitorNotes) parts.push(`Competitor Notes: ${item.competitorNotes}`);
              if (item.closedReason) parts.push(`Closed Reason: ${item.closedReason}`);
              content = parts.join('\n');
            } else if (type === 'Activity') {
              content = (item.description as string) || '';
            } else {
              content = (item.text as string) || '';
            }
            
            results.push({
              type,
              id: item.id as string,
              content,
              similarity,
              company: item.company as string | undefined,
              phase: item.phaseType as string | undefined,
              activityType: item.type as string | undefined,
              engagementId: (item.engagementId || item.activityId) as string | undefined,
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
async function getEngagementDetails(
  engagementTable: string,
  engagementId: string
): Promise<{ company: string; industry: string } | null> {
  if (!engagementTable || !engagementId) return null;
  
  try {
    const result = await docClient.send(new GetCommand({
      TableName: engagementTable,
      Key: { id: engagementId },
      ProjectionExpression: 'company, industry',
    }));
    
    if (result.Item) {
      return {
        company: (result.Item.company as string) || 'Unknown',
        industry: (result.Item.industry as string) || 'Unknown',
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
async function getActivityEngagementId(
  activityTable: string,
  activityId: string
): Promise<string | undefined> {
  if (!activityTable || !activityId) return undefined;
  
  try {
    const result = await docClient.send(new GetCommand({
      TableName: activityTable,
      Key: { id: activityId },
      ProjectionExpression: 'engagementId',
    }));
    
    return result.Item?.engagementId as string | undefined;
  } catch (error) {
    console.error('Error fetching activity:', error);
  }
  
  return undefined;
}

/**
 * Execute semantic search across all content
 */
async function executeSearch(query: string): Promise<ToolResultContentBlock> {
  console.log('Search tool called with query:', query);
  
  // Discover table names
  const tables = await discoverTableNames();
  if (!tables) {
    return { 
      text: JSON.stringify({
        results: [],
        totalFound: 0,
        query,
        error: 'Could not discover table names',
      }),
    };
  }
  
  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);
  if (!queryEmbedding) {
    return { 
      text: JSON.stringify({
        results: [],
        totalFound: 0,
        query,
        error: 'Failed to process search query',
      }),
    };
  }
  
  // Search all tables in parallel
  const [phaseNoteResults, activityResults, commentResults, engagementResults] = await Promise.all([
    searchTable(tables.phaseNote, 'PhaseNote', queryEmbedding),
    searchTable(tables.activity, 'Activity', queryEmbedding),
    searchTable(tables.comment, 'Comment', queryEmbedding),
    searchTable(tables.engagement, 'Engagement', queryEmbedding),
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
        engagementId = await getActivityEngagementId(tables.activity, result.engagementId);
      }
      
      // If we don't have company info, fetch it from engagement
      if (!company && engagementId) {
        const engagementDetails = await getEngagementDetails(tables.engagement, engagementId);
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
    text: JSON.stringify({
      results: enrichedResults,
      totalFound: enrichedResults.length,
      query,
    }),
  };
}

/**
 * The semantic search tool definition
 */
const searchEngagementContentTool: ExecutableTool = {
  name: 'search_engagement_content',
  description: 'Searches through all notes, activities, comments, and engagement details across the entire pipeline to find content matching a query. Use when user asks about specific topics, technologies, competitors, objections, or wants to find which deals discussed something specific.',
  inputSchema: {
    json: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query - what to look for across all engagement content',
        },
      },
      required: ['query'],
    } as const,
  },
  execute: async (input: unknown): Promise<ToolResultContentBlock> => {
    const typedInput = input as { query: string };
    return await executeSearch(typedInput.query);
  },
};

/**
 * Main handler for conversation events
 */
export const handler = async (event: ConversationTurnEvent) => {
  console.log('Chat handler invoked');
  
  await handleConversationTurnEvent(event, {
    tools: [searchEngagementContentTool],
  });
};
