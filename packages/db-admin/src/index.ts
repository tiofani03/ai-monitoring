import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const initDb = (connectionString: string) => {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
};

export type AdminDatabase = ReturnType<typeof initDb>;

export * from './schema';

import { sql, desc, gte } from 'drizzle-orm';

export interface StatsOptions {
  startDate?: string;
}

export const getAdminDashboardStats = async (db: AdminDatabase, options?: StatsOptions) => {
  const query = db.select({
    inputTokens: sql<number>`COALESCE(SUM(${schema.events.input_tokens}), 0)`,
    outputTokens: sql<number>`COALESCE(SUM(${schema.events.output_tokens}), 0)`,
    cost: sql<number>`COALESCE(SUM(${schema.events.estimated_cost_usd}), 0)`,
    events: sql<number>`COUNT(${schema.events.id})`
  }).from(schema.events);
  
  if (options?.startDate) {
    query.where(gte(schema.events.timestamp, new Date(options.startDate)));
  }
  
  const result = await query.execute();

  const recentQuery = db.select({
    device: schema.events.device_id,
    tool: schema.events.tool,
    action: schema.events.event_type,
    model: schema.events.model,
    input_tokens: schema.events.input_tokens,
    output_tokens: schema.events.output_tokens,
    tokens: schema.events.total_tokens,
    cost: schema.events.estimated_cost_usd,
    time: schema.events.timestamp,
    metadata: schema.events.metadata
  })
  .from(schema.events)
  .orderBy(desc(schema.events.timestamp))
  .limit(20);

  if (options?.startDate) {
    recentQuery.where(gte(schema.events.timestamp, new Date(options.startDate)));
  }

  const rawActivity = await recentQuery.execute();

  const recentActivity = rawActivity.map(r => ({
    ...r,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
  }));

  return {
    inputTokens: Number(result[0].inputTokens) || 0,
    outputTokens: Number(result[0].outputTokens) || 0,
    cost: Number(result[0].cost) || 0,
    events: Number(result[0].events) || 0,
    recentActivity
  };
};

export const getAdminMetricsOverTime = async (db: AdminDatabase, options?: StatsOptions) => {
  const query = db.select({
    date: sql<string>`DATE(${schema.events.timestamp})`,
    tokens: sql<number>`COALESCE(SUM(${schema.events.total_tokens}), 0)`,
    cost: sql<number>`COALESCE(SUM(${schema.events.estimated_cost_usd}), 0)`,
    events: sql<number>`COUNT(${schema.events.id})`
  })
  .from(schema.events)
  .groupBy(sql`DATE(${schema.events.timestamp})`)
  .orderBy(sql`DATE(${schema.events.timestamp})`);

  if (options?.startDate) {
    query.where(gte(schema.events.timestamp, new Date(options.startDate)));
  }

  const result = await query.execute();

  return result.map(r => ({
    date: r.date,
    tokens: Number(r.tokens),
    cost: Number(r.cost),
    events: Number(r.events)
  }));
};

export const getAdminModelDistribution = async (db: AdminDatabase, options?: StatsOptions) => {
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
    query.where(gte(schema.events.timestamp, new Date(options.startDate)));
  }

  const result = await query.execute();

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

export const getAdminTraces = async (db: AdminDatabase) => {
  const rawActivity = await db.select()
    .from(schema.events)
    .orderBy(desc(schema.events.timestamp))
    .execute();

  return rawActivity.map(r => ({
    ...r,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
  }));
};
