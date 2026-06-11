import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import type { SyncMode } from '@ai-monitoring/shared';

const ConfigSchema = z.object({
  device_id: z.string().uuid(),
  device_name: z.string(),
  sync_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  sync_mode: z.enum(['metadata_only', 'redacted_content', 'full_content']).default('metadata_only'),
  database_path: z.string().optional(),
  debug: z.boolean().default(false)
});

export type LocalConfig = z.infer<typeof ConfigSchema>;

const getConfigPath = () => {
  const home = os.homedir();
  return path.join(home, '.ai-usage', 'config.json');
};

export const loadConfig = (): LocalConfig => {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return ConfigSchema.parse(data);
  }
  
  // Default config if not exists
  const defaultConfig: LocalConfig = {
    device_id: crypto.randomUUID(),
    device_name: os.hostname(),
    sync_mode: 'metadata_only',
    debug: false
  };
  
  // Ensure dir exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};
