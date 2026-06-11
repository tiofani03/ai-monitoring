import { Hono } from 'hono';
import { events, projects, sessions } from '@ai-monitoring/db-local';
import type { LocalDatabase } from '@ai-monitoring/db-local';
import { sql } from 'drizzle-orm';

export default function statsRouter(db: LocalDatabase) {
  const router = new Hono();

  router.get('/summary', async (c) => {
    try {
      // Basic summary: total tokens, total events, total cost
      const result = db.select({
        total_events: sql`count(*)`,
        total_tokens: sql`sum(${events.total_tokens})`,
        total_cost: sql`sum(${events.estimated_cost_usd})`
      }).from(events).get();

      return c.json({ status: 'ok', data: result });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch summary stats', details: err.message }, 500);
    }
  });
  
  router.get('/events', async (c) => {
    try {
      const allEvents = db.select().from(events).limit(50).all();
      return c.json({ status: 'ok', data: allEvents });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch events', details: err.message }, 500);
    }
  });

  return router;
}
