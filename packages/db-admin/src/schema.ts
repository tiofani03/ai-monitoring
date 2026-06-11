import { pgTable, text, integer, real, timestamp, unique } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  api_key_hash: text('api_key_hash').notNull(),
  name: text('name').notNull(),
  hostname: text('hostname').notNull(),
  os: text('os').notNull(),
  arch: text('arch').notNull(),
  tracker_version: text('tracker_version').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  last_seen_at: timestamp('last_seen_at').notNull().defaultNow()
});

export const events = pgTable('events', {
  id: text('id').primaryKey(), // local event id
  device_id: text('device_id').notNull().references(() => devices.id),
  tool: text('tool').notNull(),
  integration: text('integration').notNull(),
  integration_version: text('integration_version'),
  project_hash: text('project_hash'),
  project_alias: text('project_alias'),
  session_id: text('session_id'),
  message_id: text('message_id'),
  timestamp: timestamp('timestamp').notNull(),
  started_at: timestamp('started_at'),
  ended_at: timestamp('ended_at'),
  duration_ms: integer('duration_ms'),
  provider: text('provider'),
  model: text('model'),
  input_tokens: integer('input_tokens'),
  output_tokens: integer('output_tokens'),
  total_tokens: integer('total_tokens'),
  token_count_status: text('token_count_status').notNull(),
  pricing_rule_id: text('pricing_rule_id'),
  estimated_cost_usd: real('estimated_cost_usd'),
  event_type: text('event_type').notNull(),
  sync_mode: text('sync_mode').notNull(),
  metadata: text('metadata'), // store as JSON text
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull()
}, (t) => ({
  unq: unique().on(t.device_id, t.id)
}));

export const projects = pgTable('projects', {
  hash: text('hash').primaryKey(),
  device_id: text('device_id').notNull().references(() => devices.id),
  alias: text('alias'),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  device_id: text('device_id').notNull().references(() => devices.id),
  project_hash: text('project_hash'),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time'),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull()
});

export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey(),
  device_id: text('device_id').notNull().references(() => devices.id),
  batch_size: integer('batch_size').notNull(),
  status: text('status').notNull(),
  error_message: text('error_message'),
  timestamp: timestamp('timestamp').notNull().defaultNow()
});
