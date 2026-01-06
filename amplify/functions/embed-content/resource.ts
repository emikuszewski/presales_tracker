import { defineFunction } from '@aws-amplify/backend';

export const embedContentFunction = defineFunction({
  name: 'embed-content',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 256,
  runtime: 20,
});
