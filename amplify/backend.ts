import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { embedContentFunction } from './functions/embed-content/resource';
import { Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';

// Define the backend with all resources
const backend = defineBackend({
  auth,
  data,
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

// Get the Lambda function
const embedLambda = backend.embedContentFunction.resources.lambda;

// Add environment variables for table names
embedLambda.addEnvironment('ENGAGEMENT_TABLE_NAME', engagementTable.tableName);
embedLambda.addEnvironment('PHASE_NOTE_TABLE_NAME', phaseNoteTable.tableName);
embedLambda.addEnvironment('ACTIVITY_TABLE_NAME', activityTable.tableName);
embedLambda.addEnvironment('COMMENT_TABLE_NAME', commentTable.tableName);

// ===========================================
// IAM PERMISSIONS FOR BEDROCK
// ===========================================

const bedrockPolicy = new Policy(
  Stack.of(embedLambda),
  'EmbedFunctionBedrockPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
        ],
      }),
    ],
  }
);

embedLambda.role?.attachInlinePolicy(bedrockPolicy);

// ===========================================
// IAM PERMISSIONS FOR DYNAMODB
// ===========================================

// Grant read/write access to all 4 tables
engagementTable.grantReadWriteData(embedLambda);
phaseNoteTable.grantReadWriteData(embedLambda);
activityTable.grantReadWriteData(embedLambda);
commentTable.grantReadWriteData(embedLambda);

// ===========================================
// DYNAMODB STREAM PERMISSIONS
// ===========================================

const streamPolicy = new Policy(
  Stack.of(embedLambda),
  'EmbedFunctionStreamPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [
          `${engagementTable.tableArn}/stream/*`,
          `${phaseNoteTable.tableArn}/stream/*`,
          `${activityTable.tableArn}/stream/*`,
          `${commentTable.tableArn}/stream/*`,
        ],
      }),
    ],
  }
);

embedLambda.role?.attachInlinePolicy(streamPolicy);

// ===========================================
// DYNAMODB STREAM EVENT SOURCE MAPPINGS
// ===========================================

// PhaseNote stream -> embedding function
const phaseNoteStreamMapping = new EventSourceMapping(
  Stack.of(phaseNoteTable),
  'PhaseNoteStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: phaseNoteTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);
phaseNoteStreamMapping.node.addDependency(streamPolicy);

// Activity stream -> embedding function
const activityStreamMapping = new EventSourceMapping(
  Stack.of(activityTable),
  'ActivityStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: activityTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);
activityStreamMapping.node.addDependency(streamPolicy);

// Comment stream -> embedding function
const commentStreamMapping = new EventSourceMapping(
  Stack.of(commentTable),
  'CommentStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: commentTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);
commentStreamMapping.node.addDependency(streamPolicy);

// Engagement stream -> embedding function
const engagementStreamMapping = new EventSourceMapping(
  Stack.of(engagementTable),
  'EngagementStreamMapping',
  {
    target: embedLambda,
    eventSourceArn: engagementTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    retryAttempts: 3,
  }
);
engagementStreamMapping.node.addDependency(streamPolicy);
