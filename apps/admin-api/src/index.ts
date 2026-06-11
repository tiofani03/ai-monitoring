import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { initDb } from '@ai-monitoring/db-admin';
import syncRouter from './routes/sync';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_monitoring';
const db = initDb(dbUrl);

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0' });
});

// Register routes
app.route('/api/sync', syncRouter(db));

const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
console.log(`Admin API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
