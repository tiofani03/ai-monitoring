import { z } from 'zod';

export const TokenCountStatusSchema = z.enum(['unknown', 'estimated', 'exact']);
export type TokenCountStatus = z.infer<typeof TokenCountStatusSchema>;

export const SyncModeSchema = z.enum([
  'metadata_only',
  'redacted_content',
  'full_content'
]);
export type SyncMode = z.infer<typeof SyncModeSchema>;

export const EventTypeSchema = z.enum([
  'session.started',
  'message.sent',
  'message.completed',
  'tool.call',
  'completion',
  'error'
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const UsageEventSchema = z.object({
  id: z.string().uuid(),
  device_id: z.string(),
  
  tool: z.string(),
  integration: z.string(),
  integration_version: z.string().nullish(),
  
  project_hash: z.string().nullish(),
  project_alias: z.string().nullish(),
  
  session_id: z.string().nullish(),
  message_id: z.string().nullish(),
  
  timestamp: z.string().datetime(),
  started_at: z.string().datetime().nullish(),
  ended_at: z.string().datetime().nullish(),
  duration_ms: z.number().int().nullish(),
  
  provider: z.string().nullish(),
  model: z.string().nullish(),
  
  input_tokens: z.number().int().nullish(),
  output_tokens: z.number().int().nullish(),
  total_tokens: z.number().int().nullish(),
  token_count_status: TokenCountStatusSchema,
  
  pricing_rule_id: z.string().nullish(),
  estimated_cost_usd: z.number().nullish(),
  
  event_type: EventTypeSchema,
  sync_mode: SyncModeSchema,
  
  metadata: z.record(z.unknown()).nullish(),
  
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

export const IntegrationCapabilitiesSchema = z.object({
  hasLogs: z.boolean(),
  hasExactTokenUsage: z.boolean(),
  hasStdoutCapture: z.boolean(),
  hasSessionId: z.boolean(),
  hasModelInfo: z.boolean(),
  supportsContentCapture: z.boolean()
});

export type IntegrationCapabilities = z.infer<typeof IntegrationCapabilitiesSchema>;

export const RawIntegrationEventSchema = z.object({
  raw_type: z.string(),
  raw_data: z.record(z.unknown()),
  captured_at: z.string().datetime()
});

export type RawIntegrationEvent = z.infer<typeof RawIntegrationEventSchema>;

export interface UsageIntegration {
  id: string;
  name: string;
  detect(): Promise<boolean>;
  capabilities(): Promise<IntegrationCapabilities>;
  collect(): Promise<RawIntegrationEvent[]>;
  normalize(raw: RawIntegrationEvent): Promise<UsageEvent[]>;
}
