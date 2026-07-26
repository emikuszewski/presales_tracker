/**
 * Amplify Data Client Setup
 */

import { generateClient } from 'aws-amplify/data';

export const client = generateClient({ authMode: 'userPool' });
