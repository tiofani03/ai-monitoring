import type { UsageIntegration, IntegrationCapabilities, RawIntegrationEvent, UsageEvent } from '@ai-monitoring/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export class ClaudeCodeIntegration implements UsageIntegration {
  id = 'claude-code';
  name = 'Claude Code CLI';
  private projectsPath = path.join(os.homedir(), '.claude', 'projects');

  private async getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? this.getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
  }

  async detect(): Promise<boolean> {
    try {
      await fs.access(this.projectsPath);
      return true;
    } catch {
      return false;
    }
  }

  async capabilities(): Promise<IntegrationCapabilities> {
    return {
      hasLogs: true,
      hasExactTokenUsage: true,
      hasStdoutCapture: false,
      hasSessionId: true,
      hasModelInfo: true,
      supportsContentCapture: true
    };
  }

  async collect(): Promise<RawIntegrationEvent[]> {
    try {
      const rawEvents: RawIntegrationEvent[] = [];
      const projectDirs = await fs.readdir(this.projectsPath, { withFileTypes: true });
      
      for (const dir of projectDirs) {
        if (!dir.isDirectory()) continue;
        
        const dirPath = path.join(this.projectsPath, dir.name);
        const files = await this.getFiles(dirPath);
        
        for (const filePath of files) {
          if (!filePath.endsWith('.jsonl')) continue;
          
          const file = path.basename(filePath);
          const sessionId = file.replace('.jsonl', '');
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            
            let messages: any[] = [];
            let inputTokens = 0;
            let outputTokens = 0;
            let model = 'claude-3-5-sonnet';
            let timestamp = '';
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.timestamp) {
                  timestamp = data.timestamp; // Always update to latest timestamp
                }
                
                if (data.type === 'user' && data.message) {
                  messages.push({ role: 'user', content: typeof data.message.content === 'string' ? data.message.content : JSON.stringify(data.message.content) });
                } else if (data.type === 'assistant' && data.message) {
                  // extract content
                  let text = '';
                  if (Array.isArray(data.message.content)) {
                    text = data.message.content.filter((c:any) => c.type === 'text').map((c:any) => c.text).join('\n');
                  } else {
                    text = String(data.message.content);
                  }
                  
                  if (text) {
                    messages.push({ role: 'assistant', content: text });
                  }
                  
                  if (data.message.usage) {
                    inputTokens += data.message.usage.input_tokens || 0;
                    outputTokens += data.message.usage.output_tokens || 0;
                  }
                  
                  if (data.message.model) {
                    model = data.message.model;
                  }
                }
              } catch (e) {
                // ignore invalid line
              }
            }
            
            if (messages.length > 0) {
              rawEvents.push({
                raw_type: 'claude_session',
                captured_at: timestamp || new Date().toISOString(),
                raw_data: {
                  sessionId,
                  messages,
                  inputTokens,
                  outputTokens,
                  model
                }
              });
            }
            
          } catch (err) {
            // ignore read error
          }
        }
      }
      
      return rawEvents;
    } catch (error) {
      console.error(`Failed to collect from ${this.projectsPath}:`, error);
      return [];
    }
  }

  async normalize(raw: RawIntegrationEvent): Promise<UsageEvent[]> {
    const data = raw.raw_data as any;
    
    // Use session ID as the deterministic hash base
    const uniqueString = `${data.sessionId}`;
    const hash = crypto.createHash('sha1').update(uniqueString).digest('hex');
    const deterministicId = [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '4' + hash.slice(13, 16),
      '8' + hash.slice(17, 20),
      hash.slice(20, 32)
    ].join('-');

    const usage: UsageEvent = {
      id: deterministicId,
      device_id: 'local-device', // Will be overridden by daemon
      tool: this.name,
      integration: this.id,
      timestamp: raw.captured_at,
      session_id: data.sessionId,
      model: data.model || 'claude-3-5-sonnet',
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.inputTokens + data.outputTokens,
      token_count_status: 'exact',
      event_type: 'message.completed',
      sync_mode: 'metadata_only', // Will be overridden by daemon
      metadata: data.messages && data.messages.length > 0 ? { messages: data.messages } : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return [usage];
  }
}
