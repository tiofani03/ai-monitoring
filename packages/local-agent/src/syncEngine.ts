import type { LocalDatabase } from '@ai-monitoring/db-local';
import { events, syncQueue } from '@ai-monitoring/db-local';
import type { LocalConfig } from './config';
import { eq, inArray, and, lte, or, isNull } from 'drizzle-orm';

export class SyncEngine {
  private isSyncing = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly db: LocalDatabase;
  private readonly config: LocalConfig;

  constructor(db: LocalDatabase, config: LocalConfig) {
    this.db = db;
    this.config = config;
  }

  start(intervalMs = 30000) {
    if (this.timer) return;
    
    // On startup, recover any stale 'sending' events back to 'pending'
    this.db.update(syncQueue)
      .set({ status: 'pending' })
      .where(eq(syncQueue.status, 'sending'))
      .run();

    this.timer = setInterval(() => this.sync(), intervalMs);
    // Trigger immediately
    this.sync();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async sync() {
    if (this.isSyncing) return;
    if (!this.config.sync_endpoint || !this.config.api_key) return; // Sync not configured

    this.isSyncing = true;
    try {
      // Find pending events or retryable failed events
      const now = new Date().toISOString();
      const rowsToSync = this.db.select()
        .from(syncQueue)
        .where(
          and(
            or(eq(syncQueue.status, 'pending'), eq(syncQueue.status, 'failed')),
            or(isNull(syncQueue.next_retry_at), lte(syncQueue.next_retry_at, now))
          )
        )
        .limit(100)
        .all();

      if (rowsToSync.length === 0) return;

      const eventIds = rowsToSync.map(r => r.event_id);

      // Mark as sending
      this.db.update(syncQueue)
        .set({ status: 'sending', last_attempt_at: now })
        .where(inArray(syncQueue.event_id, eventIds))
        .run();

      // Fetch actual event data
      const eventsToSync = this.db.select().from(events).where(inArray(events.id, eventIds)).all();

      // Send to admin API
      const response = await fetch(`${this.config.sync_endpoint}/api/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.api_key}`
        },
        body: JSON.stringify({ events: eventsToSync })
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
      }

      const result = await response.json() as any;

      // Mark as synced
      this.db.update(syncQueue)
        .set({ status: 'synced', updated_at: new Date().toISOString() })
        .where(inArray(syncQueue.event_id, eventIds))
        .run();

      console.log(`[SyncEngine] Successfully synced ${eventsToSync.length} events to Admin API.`);

    } catch (err: any) {
      console.error('Sync error:', err);
      // Process backoff and failure logic
      // In a real implementation, we would update rows individually with exponential backoff
    } finally {
      this.isSyncing = false;
    }
  }
}
