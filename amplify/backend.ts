import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, chatHandler } from './data/resource';
import { embedContentFunction } from './functions/embed-content/resource';
import { Stack } from 'aws-cdk-lib';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { Function } from 'aws-cdk-lib/aws-lambda';

// Define the backend with all resources
const backend = defineBackend({
  auth,
  data,
  chatHandler,
  embedContentFunction,
});

// ===========================================
// EMBEDDING FUNCTION CONFIGURATION
// ===========================================

// Get references to DynamoDB tables
const engagementTable = backend.data.resources.tables['Engagement'];
const phaseNoteTable = backend.data.resources.tables['PhaseNote'];
const activityTable = backend.data.resources.tables['Activity'];
const commentTable = backend.data.resources.tables['Comment'];

// Get the embed Lambda function
const embedLambda = backend.embedContentFunction.resources.lambda as Function;

// Add environment variables for table names to embed function
embedLambda.addEnvironment('ENGAGEMENT_TABLE_NAME', engagementTable.tableName);
embedLambda.addEnvironment('PHASE_NOTE_TABLE_NAME', phaseNoteTable.tableName);
embedLambda.addEnvironment('ACTIVITY_TABLE_NAME', activityTable.tableName);
embedLambda.addEnvironment('COMMENT_TABLE_NAME', commentTable.tableName);

// ===========================================
// EMBED FUNCTION IAM PERMISSIONS
// ===========================================

embedLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0'],
  })
);

// DynamoDB read/write permissions for embed function
embedLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query',
      'dynamodb:Scan',
    ],
    resources: [
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Engagement-*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/PhaseNote-*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Activity-*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Comment-*`,
    ],
  })
);

// DynamoDB Streams permissions for embed function
embedLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:DescribeStream',
      'dynamodb:GetRecords',
      'dynamodb:GetShardIterator',
      'dynamodb:ListStreams',
    ],
    resources: [
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Engagement-*/stream/*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/PhaseNote-*/stream/*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Activity-*/stream/*`,
      `arn:aws:dynamodb:${Stack.of(embedLambda).region}:${Stack.of(embedLambda).account}:table/Comment-*/stream/*`,
    ],
  })
);

// ===========================================
// CHAT HANDLER IAM PERMISSIONS
// Note: We use wildcard ARNs to avoid circular dependency
// The chatHandler will discover table names at runtime
// ===========================================

const chatLambda = backend.chatHandler.resources.lambda as Function;

// Bedrock permission for Titan Embeddings (query embedding)
chatLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0'],
  })
);

// DynamoDB permissions for chat handler (semantic search + table discovery)
chatLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:ListTables',
    ],
    resources: ['*'],
  })
);

chatLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:Scan',
    ],
    resources: [
      `arn:aws:dynamodb:us-east-1:${Stack.of(chatLambda).account}:table/Engagement-*`,
      `arn:aws:dynamodb:us-east-1:${Stack.of(chatLambda).account}:table/PhaseNote-*`,
      `arn:aws:dynamodb:us-east-1:${Stack.of(chatLambda).account}:table/Activity-*`,
      `arn:aws:dynamodb:us-east-1:${Stack.of(chatLambda).account}:table/Comment-*`,
    ],
  })
);

// ===========================================
// DYNAMODB STREAM EVENT SOURCE MAPPINGS
// ===========================================

new EventSourceMapping(
  Stack.of(embedLambda),
  'PhaseNoteStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: phaseNoteTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);

new EventSourceMapping(
  Stack.of(embedLambda),
  'ActivityStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: activityTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);

new EventSourceMapping(
  Stack.of(embedLambda),
  'CommentStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: commentTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);

new EventSourceMapping(
  Stack.of(embedLambda),
  'EngagementStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: engagementTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);
