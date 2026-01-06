import { defineFunction } from '@aws-amplify/backend';

export const embedContentFunction = defineFunction({
  name: 'embed-content',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 256,
  runtime: 20,
  // Put in data resource group so we can access table references
  resourceGroupName: 'data',
});
