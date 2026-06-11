import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as crypto from 'crypto';

async function seed() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  console.log('Connecting to', connectionString);
  
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    const deviceId = 'test-device-uuid';
    
    // Insert Device
    await db.insert(schema.devices).values({
      id: deviceId,
      api_key_hash: 'dummy-hash',
      name: 'MacBook Pro',
      hostname: 'mbp-local',
      os: 'darwin',
      arch: 'arm64',
      tracker_version: '1.0.0'
    }).onConflictDoNothing();

    // Insert mock events
    const mockEvents = Array.from({ length: 15 }).map((_, i) => ({
      id: crypto.randomUUID(),
      device_id: deviceId,
      tool: 'Claude Code CLI',
      integration: 'claude-code',
      project_hash: 'e3b0c44298fc1c14',
      project_alias: 'ai-monitoring',
      timestamp: new Date(),
      duration_ms: 1500,
      model: 'claude-3-5-sonnet',
      input_tokens: Math.floor(Math.random() * 2000),
      output_tokens: Math.floor(Math.random() * 500),
      total_tokens: 2500,
      token_count_status: 'estimated',
      estimated_cost_usd: 0.015,
      event_type: 'message.completed',
      sync_mode: 'metadata_only',
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db.insert(schema.events).values(mockEvents).onConflictDoNothing();
    
    console.log('Seeded database successfully with mock events.');
  } catch (error) {
    console.error('Failed to seed database:', error);
  } finally {
    await client.end();
  }
}

seed();
