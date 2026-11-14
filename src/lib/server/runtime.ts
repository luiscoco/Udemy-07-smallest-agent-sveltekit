import { loadConfig } from './config.js';
import { createAgentService } from './agent-service.js';
import { createHandlers } from './handlers.js';
export function handlers() {
  const config = loadConfig();
  return createHandlers(config, createAgentService(config));
}
