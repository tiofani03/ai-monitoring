import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  device_id: text('device_id').notNull(),
  tool: text('tool').notNull(),
  integration: text('integration').notNull(),
  integration_version: text('integration_version'),
  project_hash: text('project_hash'),
  project_alias: text('project_alias'),
  session_id: text('session_id'),
  message_id: text('message_id'),
  timestamp: text('timestamp').notNull(),
  started_at: text('started_at'),
  ended_at: text('ended_at'),
  duration_ms: integer('duration_ms'),
  provider: text('provider'),
  model: text('model'),
  input_tokens: integer('input_tokens'),
  output_tokens: integer('output_tokens'),
  total_tokens: integer('total_tokens'),
  token_count_status: text('token_count_status').notNull(), // 'unknown', 'estimated', 'exact'
  pricing_rule_id: text('pricing_rule_id'),
  estimated_cost_usd: real('estimated_cost_usd'),
  event_type: text('event_type').notNull(),
  sync_mode: text('sync_mode').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
});

export const projects = sqliteTable('projects', {
  hash: text('hash').primaryKey(),
  alias: text('alias'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  project_hash: text('project_hash'),
  start_time: text('start_time').notNull(),
  end_time: text('end_time'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
});

export const syncQueue = sqliteTable('sync_queue', {
  event_id: text('event_id').primaryKey().references(() => events.id),
  status: text('status').notNull(), // 'pending', 'sending', 'synced', 'failed', 'dead_letter'
  retry_count: integer('retry_count').notNull().default(0),
  next_retry_at: text('next_retry_at'),
  last_attempt_at: text('last_attempt_at'),
  last_error: text('last_error'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
});

export const pricingRules = sqliteTable('pricing_rules', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  input_price_per_1m_tokens: real('input_price_per_1m_tokens').notNull(),
  output_price_per_1m_tokens: real('output_price_per_1m_tokens').notNull(),
  currency: text('currency').notNull().default('USD'),
  effective_from: text('effective_from').notNull(),
  effective_to: text('effective_to'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' })
});

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hostname: text('hostname').notNull(),
  os: text('os').notNull(),
  arch: text('arch').notNull(),
  tracker_version: text('tracker_version').notNull(),
  created_at: text('created_at').notNull(),
  last_seen_at: text('last_seen_at').notNull()
});
