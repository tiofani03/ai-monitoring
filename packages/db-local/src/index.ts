import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql, desc, gte } from 'drizzle-orm';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// Setup default DB path in user's home directory
const getDbPath = () => {
  const home = os.homedir();
  const dir = path.join(home, '.ai-usage');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'local-tracker.db');
};

export const initDb = (dbPath: string = getDbPath()) => {
  const sqlite = new Database(dbPath);
  
  // Set required Pragmas
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
};

export interface StatsOptions {
  startDate?: string;
}

export const getDashboardStats = (db: LocalDatabase, options?: StatsOptions) => {
  const query = db.select().from(schema.events);
  if (options?.startDate) {
    query.where(gte(schema.events.timestamp, options.startDate));
  }
  const allEvents = query.all();
  
  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;
  let eventsCount = allEvents.length;

  for (const ev of allEvents) {
    if (ev.input_tokens) inputTokens += ev.input_tokens;
    if (ev.output_tokens) outputTokens += ev.output_tokens;
    if (ev.estimated_cost_usd) cost += ev.estimated_cost_usd;
  }

  // Get recent 10 events
  const recentQuery = db.select().from(schema.events).orderBy(desc(schema.events.timestamp)).limit(10);
  if (options?.startDate) {
    recentQuery.where(gte(schema.events.timestamp, options.startDate));
  }
  const recentEvents = recentQuery.all();

  return {
    inputTokens,
    outputTokens,
    cost,
    events: eventsCount,
    recentActivity: recentEvents.map(r => ({
      tool: r.tool,
      action: r.event_type,
      model: r.model,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
      tokens: r.total_tokens || 0,
      cost: r.estimated_cost_usd,
      time: r.timestamp,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
    })).reverse()
  };
};

export const getLocalMetricsOverTime = (db: LocalDatabase, options?: StatsOptions) => {
  const query = db.select({
    date: sql<string>`substr(${schema.events.timestamp}, 1, 10)`,
    tokens: sql<number>`COALESCE(SUM(${schema.events.total_tokens}), 0)`,
    cost: sql<number>`COALESCE(SUM(${schema.events.estimated_cost_usd}), 0)`,
    events: sql<number>`COUNT(${schema.events.id})`
  })
  .from(schema.events)
  .groupBy(sql`substr(${schema.events.timestamp}, 1, 10)`)
  .orderBy(sql`substr(${schema.events.timestamp}, 1, 10)`);

  if (options?.startDate) {
    query.where(gte(schema.events.timestamp, options.startDate));
  }

  const result = query.all();

  return result.map(r => ({
    date: r.date,
    tokens: Number(r.tokens),
    cost: Number(r.cost),
    events: Number(r.events)
  }));
};

export const getLocalModelDistribution = (db: LocalDatabase, options?: StatsOptions) => {
  const query = db.select({
    model: schema.events.model,
    provider: schema.events.provider,
    inputTokens: sql<number>`COALESCE(SUM(${schema.events.input_tokens}), 0)`,
    outputTokens: sql<number>`COALESCE(SUM(${schema.events.output_tokens}), 0)`,
    cost: sql<number>`COALESCE(SUM(${schema.events.estimated_cost_usd}), 0)`,
    events: sql<number>`COUNT(${schema.events.id})`,
    lastUsed: sql<string>`MAX(${schema.events.timestamp})`
  })
  .from(schema.events)
  .groupBy(schema.events.model, schema.events.provider)
  .orderBy(desc(sql`SUM(${schema.events.total_tokens})`));

  if (options?.startDate) {
    query.where(gte(schema.events.timestamp, options.startDate));
  }

  const result = query.all();

  return result.map(r => ({
    name: r.model || 'unknown',
    provider: r.provider || '-',
    inputTokens: Number(r.inputTokens),
    outputTokens: Number(r.outputTokens),
    cost: Number(r.cost),
    requests: Number(r.events),
    lastUsed: r.lastUsed
  }));
};

export const getLocalTraces = (db: LocalDatabase) => {
  const rawActivity = db.select()
    .from(schema.events)
    .orderBy(desc(schema.events.timestamp))
    .all();

  return rawActivity.map(r => ({
    ...r,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
  }));
};

export const upsertUsageEvent = (db: LocalDatabase, eventData: typeof schema.events.$inferInsert) => {
  db.transaction(() => {
    db.insert(schema.events)
      .values(eventData)
      .onConflictDoUpdate({
        target: schema.events.id,
        set: eventData
      })
      .run();

    // Add to sync queue if it doesn't exist
    db.insert(schema.syncQueue)
      .values({
        event_id: eventData.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .onConflictDoNothing()
      .run();
  });
};

export type LocalDatabase = ReturnType<typeof initDb>;

export * from './schema';
