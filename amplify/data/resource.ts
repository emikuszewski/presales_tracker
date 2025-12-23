import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Team Member model
  TeamMember: a.model({
    email: a.email().required(),
    name: a.string().required(),
    initials: a.string().required(),
    isAdmin: a.boolean().default(false),
    isActive: a.boolean().default(true),
    engagements: a.hasMany('Engagement', 'ownerId'),
  }).authorization(allow => [allow.authenticated()]),

  // Engagement model
  Engagement: a.model({
    company: a.string().required(),
    contactName: a.string().required(),
    contactEmail: a.email(),
    contactPhone: a.string(),
    industry: a.enum([
      'FINANCIAL_SERVICES',
      'HEALTHCARE', 
      'TECHNOLOGY',
      'RETAIL',
      'MANUFACTURING',
      'GOVERNMENT'
    ]),
    dealSize: a.string(),
    currentPhase: a.enum([
      'DISCOVER',
      'DESIGN',
      'DEMONSTRATE',
      'VALIDATE',
      'ENABLE'
    ]),
    startDate: a.date(),
    lastActivity: a.date(),
    
    // Single owner for Phase 1 (co-owners in Phase 2)
    ownerId: a.id().required(),
    owner: a.belongsTo('TeamMember', 'ownerId'),
    
    // Integration fields
    salesforceId: a.string(),
    salesforceUrl: a.string(),
    jiraTicket: a.string(),
    jiraUrl: a.string(),
    slackChannel: a.string(),
    
    // Archive support
    isArchived: a.boolean().default(false),
    
    // Relationships
    phases: a.hasMany('Phase', 'engagementId'),
    activities: a.hasMany('Activity', 'engagementId'),
  }).authorization(allow => [allow.authenticated()]),

  // Phase model
  Phase: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    phaseType: a.enum([
      'DISCOVER',
      'DESIGN',
      'DEMONSTRATE',
      'VALIDATE',
      'ENABLE'
    ]),
    status: a.enum([
      'PENDING',
      'IN_PROGRESS',
      'COMPLETE'
    ]),
    completedDate: a.date(),
    notes: a.string(),
    // Links stored as JSON array: [{title: string, url: string}]
    links: a.json(),
  }).authorization(allow => [allow.authenticated()]),

  // Activity model
  Activity: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    date: a.date().required(),
    type: a.enum([
      'MEETING',
      'DEMO',
      'DOCUMENT',
      'EMAIL',
      'SUPPORT',
      'WORKSHOP',
      'CALL'
    ]),
    description: a.string().required(),
  }).authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
