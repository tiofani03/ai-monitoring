import { ClaudeCodeIntegration } from './packages/integrations/src/claude-code';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

async function test() {
  const claudeConfigPath = path.join(os.homedir(), '.claude.json');
  
  // Write mock file
  const mockData = {
    history: [
      {
        sessionId: 'test-session-1',
        model: 'claude-3-5-sonnet',
        timestamp: new Date().toISOString(),
        usage: {
          input_tokens: 150,
          output_tokens: 45
        }
      }
    ]
  };
  
  await fs.writeFile(claudeConfigPath, JSON.stringify(mockData, null, 2));
  
  const integration = new ClaudeCodeIntegration();
  const detected = await integration.detect();
  console.log('Detected:', detected);
  
  if (detected) {
    const rawEvents = await integration.collect();
    console.log('Raw Events:', rawEvents);
    
    if (rawEvents.length > 0) {
      const normalized = await integration.normalize(rawEvents[0]);
      console.log('Normalized Event:', normalized);
    }
  }
}

test().catch(console.error);
