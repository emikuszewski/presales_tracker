import type { DynamoDBStreamHandler, DynamoDBRecord } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Model ID for Titan Embeddings
const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';

// Max content length before truncation (~25K chars)
const MAX_CONTENT_LENGTH = 25000;

// Table name environment variables (set in backend.ts)
const ENGAGEMENT_TABLE = process.env.ENGAGEMENT_TABLE_NAME || '';
const PHASE_NOTE_TABLE = process.env.PHASE_NOTE_TABLE_NAME || '';
const ACTIVITY_TABLE = process.env.ACTIVITY_TABLE_NAME || '';
const COMMENT_TABLE = process.env.COMMENT_TABLE_NAME || '';

/**
 * Determine which model/table this record belongs to based on the event source ARN
 */
function getModelType(eventSourceARN: string): 'Engagement' | 'PhaseNote' | 'Activity' | 'Comment' | null {
  if (eventSourceARN.includes('/PhaseNote-')) return 'PhaseNote';
  if (eventSourceARN.includes('/Activity-')) return 'Activity';
  if (eventSourceARN.includes('/Comment-')) return 'Comment';
  if (eventSourceARN.includes('/Engagement-')) return 'Engagement';
  return null;
}

/**
 * Get table name for a model type
 */
function getTableName(modelType: 'Engagement' | 'PhaseNote' | 'Activity' | 'Comment'): string {
  switch (modelType) {
    case 'Engagement': return ENGAGEMENT_TABLE;
    case 'PhaseNote': return PHASE_NOTE_TABLE;
    case 'Activity': return ACTIVITY_TABLE;
    case 'Comment': return COMMENT_TABLE;
  }
}

/**
 * Extract string value from DynamoDB attribute
 */
function getStringValue(attr: any): string | null {
  if (!attr) return null;
  if (typeof attr === 'string') return attr;
  if (attr.S) return attr.S;
  return null;
}

/**
 * Fetch Engagement for context enrichment
 */
async function fetchEngagement(engagementId: string): Promise<{ company: string; industry: string } | null> {
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
        industry: formatIndustry(result.Item.industry),
      };
    }
  } catch (error) {
    console.error('Error fetching engagement:', error);
  }
  
  return null;
}

/**
 * Fetch Activity for Comment context (to get engagementId)
 */
async function fetchActivity(activityId: string): Promise<string | null> {
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
 * Format industry enum to readable string
 */
function formatIndustry(industry: string | null): string {
  if (!industry) return 'Unknown';
  return industry.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format phase enum to readable string
 */
function formatPhase(phase: string | null): string {
  if (!phase) return 'Unknown';
  return phase.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Build content string for embedding based on model type
 */
async function buildContentForEmbedding(
  modelType: 'Engagement' | 'PhaseNote' | 'Activity' | 'Comment',
  record: any
): Promise<string | null> {
  switch (modelType) {
    case 'PhaseNote': {
      const text = getStringValue(record.text);
      if (!text || text.trim().length === 0) return null;
      
      const engagementId = getStringValue(record.engagementId);
      const phase = formatPhase(getStringValue(record.phaseType));
      const engagement = engagementId ? await fetchEngagement(engagementId) : null;
      
      const parts = [];
      if (engagement) {
        parts.push(`Company: ${engagement.company}`);
        parts.push(`Industry: ${engagement.industry}`);
      }
      parts.push(`Phase: ${phase}`);
      parts.push(`Content: ${text}`);
      
      return parts.join('\n');
    }
    
    case 'Activity': {
      const description = getStringValue(record.description);
      if (!description || description.trim().length === 0) return null;
      
      const engagementId = getStringValue(record.engagementId);
      const activityType = getStringValue(record.type) || 'Activity';
      const engagement = engagementId ? await fetchEngagement(engagementId) : null;
      
      const parts = [];
      if (engagement) {
        parts.push(`Company: ${engagement.company}`);
        parts.push(`Industry: ${engagement.industry}`);
      }
      parts.push(`Type: ${activityType}`);
      parts.push(`Content: ${description}`);
      
      return parts.join('\n');
    }
    
    case 'Comment': {
      const text = getStringValue(record.text);
      if (!text || text.trim().length === 0) return null;
      
      const activityId = getStringValue(record.activityId);
      const engagementId = activityId ? await fetchActivity(activityId) : null;
      const engagement = engagementId ? await fetchEngagement(engagementId) : null;
      
      const parts = [];
      if (engagement) {
        parts.push(`Company: ${engagement.company}`);
        parts.push(`Industry: ${engagement.industry}`);
      }
      parts.push(`Content: ${text}`);
      
      return parts.join('\n');
    }
    
    case 'Engagement': {
      const competitorNotes = getStringValue(record.competitorNotes);
      const closedReason = getStringValue(record.closedReason);
      
      // Only embed if there's actual content
      if ((!competitorNotes || competitorNotes.trim().length === 0) && 
          (!closedReason || closedReason.trim().length === 0)) {
        return null;
      }
      
      const company = getStringValue(record.company) || 'Unknown';
      const industry = formatIndustry(getStringValue(record.industry));
      
      const parts = [];
      parts.push(`Company: ${company}`);
      parts.push(`Industry: ${industry}`);
      if (competitorNotes) parts.push(`Competitor Notes: ${competitorNotes}`);
      if (closedReason) parts.push(`Closed Reason: ${closedReason}`);
      
      return parts.join('\n');
    }
  }
}

/**
 * Check if Engagement's embeddable fields changed (for MODIFY events)
 */
function engagementFieldsChanged(oldImage: any, newImage: any): boolean {
  const oldCompetitorNotes = getStringValue(oldImage?.competitorNotes) || '';
  const newCompetitorNotes = getStringValue(newImage?.competitorNotes) || '';
  const oldClosedReason = getStringValue(oldImage?.closedReason) || '';
  const newClosedReason = getStringValue(newImage?.closedReason) || '';
  
  return oldCompetitorNotes !== newCompetitorNotes || oldClosedReason !== newClosedReason;
}

/**
 * Generate embedding using Bedrock Titan
 */
async function generateEmbedding(content: string): Promise<number[] | null> {
  // Truncate if too long
  const truncatedContent = content.length > MAX_CONTENT_LENGTH 
    ? content.substring(0, MAX_CONTENT_LENGTH) + '...[truncated]'
    : content;
  
  try {
    const response = await bedrockClient.send(new InvokeModelCommand({
      modelId: EMBEDDING_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: truncatedContent,
        dimensions: 512,  // Use 512 dimensions for good balance of quality vs storage
        normalize: true,
      }),
    }));
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Update record with embedding
 */
async function updateRecordWithEmbedding(
  tableName: string,
  recordId: string,
  embedding: number[]
): Promise<void> {
  // Store embedding as JSON string
  const embeddingString = JSON.stringify(embedding);
  
  await docClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: recordId },
    UpdateExpression: 'SET embedding = :embedding',
    ExpressionAttributeValues: {
      ':embedding': embeddingString,
    },
  }));
}

/**
 * Process a single DynamoDB stream record
 */
async function processRecord(record: DynamoDBRecord): Promise<void> {
  // Skip DELETE events
  if (record.eventName === 'REMOVE') {
    return;
  }
  
  // Get model type from event source ARN
  const modelType = getModelType(record.eventSourceARN || '');
  if (!modelType) {
    console.log('Unknown table, skipping:', record.eventSourceARN);
    return;
  }
  
  const newImage = record.dynamodb?.NewImage;
  const oldImage = record.dynamodb?.OldImage;
  
  if (!newImage) {
    console.log('No new image, skipping');
    return;
  }
  
  // For Engagement MODIFY events, check if relevant fields changed
  if (modelType === 'Engagement' && record.eventName === 'MODIFY') {
    if (!engagementFieldsChanged(oldImage, newImage)) {
      console.log('Engagement updated but embeddable fields unchanged, skipping');
      return;
    }
  }
  
  // Get record ID
  const recordId = getStringValue(newImage.id);
  if (!recordId) {
    console.log('No record ID, skipping');
    return;
  }
  
  console.log(`Processing ${modelType} record: ${recordId}`);
  
  // Build content for embedding
  const content = await buildContentForEmbedding(modelType, newImage);
  if (!content) {
    console.log('No content to embed, skipping');
    return;
  }
  
  console.log(`Content length: ${content.length} chars`);
  
  // Generate embedding
  const embedding = await generateEmbedding(content);
  if (!embedding) {
    console.error('Failed to generate embedding');
    return;
  }
  
  console.log(`Generated embedding with ${embedding.length} dimensions`);
  
  // Update record with embedding
  const tableName = getTableName(modelType);
  await updateRecordWithEmbedding(tableName, recordId, embedding);
  
  console.log(`Updated ${modelType} ${recordId} with embedding`);
}

/**
 * Main handler for DynamoDB stream events
 */
export const handler: DynamoDBStreamHandler = async (event) => {
  console.log(`Processing ${event.Records.length} records`);
  
  const results = await Promise.allSettled(
    event.Records.map(record => processRecord(record))
  );
  
  // Log any failures
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`${failures.length} records failed to process:`, failures);
  }
  
  console.log(`Successfully processed ${results.length - failures.length} of ${event.Records.length} records`);
  
  // Return batch item failures for retry (DynamoDB Streams best practice)
  // For now, we don't fail the batch - just log errors
  return {
    batchItemFailures: [],
  };
};
