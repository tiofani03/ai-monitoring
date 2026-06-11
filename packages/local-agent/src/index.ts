import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadConfig } from './config';
import { ClaudeCodeIntegration } from '@ai-monitoring/integrations';
import { initDb, upsertUsageEvent } from '@ai-monitoring/db-local';
import * as os from 'node:os';
import eventsRouter from './routes/events';
import statsRouter from './routes/stats';
import { SyncEngine } from './syncEngine';

const POLL_INTERVAL = 5000;

async function startDaemon(db: ReturnType<typeof initDb>) {
  console.log('Starting local-agent daemon polling...');

  const claude = new ClaudeCodeIntegration();
  const isAvailable = await claude.detect();

  if (!isAvailable) {
    console.warn(`[Warning] ${claude.name} config not found.`);
  }

  // Define device info
  const deviceId = `device-${os.hostname()}`;

  const poll = async () => {
    try {
      if (await claude.detect()) {
        const rawEvents = await claude.collect();
        for (const raw of rawEvents) {
          const events = await claude.normalize(raw);
          for (const ev of events) {
            ev.device_id = deviceId;
            
            // Enforce sync mode configuration
            if (config.sync_mode !== 'full_content') {
              ev.metadata = null;
            }
            ev.sync_mode = config.sync_mode as any;

            upsertUsageEvent(db, ev);
          }
        }
        console.log(`[Daemon] Synced ${rawEvents.length} events from ${claude.name}`);
      }
    } catch (e) {
      console.error('[Daemon Error]', e);
    }
    setTimeout(poll, POLL_INTERVAL);
  };

  poll();
}

const config = loadConfig();
const db = initDb(config.database_path); // Will use default if undefined

startDaemon(db).catch(console.error);

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', device_id: config.device_id, version: '1.0.0' });
});

// Register routes
app.route('/api/events', eventsRouter(db, config));
app.route('/api/stats', statsRouter(db));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
console.log(`Local Agent running on http://localhost:${port}`);

const engine = new SyncEngine(db, config);
engine.start();

serve({
  fetch: app.fetch,
  port
});
