import { Hono } from 'hono';
import { UsageEventSchema } from '@ai-monitoring/shared';
import { events, syncQueue } from '@ai-monitoring/db-local';
import type { LocalDatabase } from '@ai-monitoring/db-local';
import type { LocalConfig } from '../config';

export default function eventsRouter(db: LocalDatabase, config: LocalConfig) {
  const router = new Hono();

  router.post('/', async (c) => {
    try {
      const body = await c.req.json();
      const event = UsageEventSchema.parse(body);

      // Insert event and add to sync queue within a transaction
      db.transaction((tx) => {
        tx.insert(events).values(event).run();
        
        tx.insert(syncQueue).values({
          event_id: event.id,
          status: 'pending',
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).run();
      });

      return c.json({ status: 'ok', event_id: event.id });
    } catch (err: any) {
      console.error('Failed to insert event', err);
      return c.json({ error: 'Invalid event payload', details: err.message }, 400);
    }
  });

  return router;
}
