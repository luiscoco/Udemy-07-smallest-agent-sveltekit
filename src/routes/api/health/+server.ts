import { loadConfig } from '#lib/server/config.js';
export function GET() {
  return Response.json({ status: 'ok', api_key_configured: loadConfig().apiKeyConfigured });
}
