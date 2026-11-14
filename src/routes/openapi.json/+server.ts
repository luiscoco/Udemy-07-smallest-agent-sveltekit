const prompt = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string', minLength: 1, maxLength: 4000 } } } } } };
export function GET() {
  return Response.json({ openapi: '3.1.0', info: { title: 'Smallest Agent SvelteKit API', version: '1.0.0' }, paths: {
    '/api/health': { get: { summary: 'Connectivity and key presence, never credentials', responses: { '200': { description: 'status and api_key_configured' } } } },
    ...Object.fromEntries(['query','stream'].map(mode => [`/api/agent/${mode}`, { post: { summary: mode === 'query' ? 'Final normalized agent result' : 'POST SSE: message, done or error', requestBody: prompt, responses: Object.fromEntries([200,400,403,413,415,422,502,503].map(status => [status, { description: status === 200 ? (mode === 'query' ? 'AgentResult JSON' : 'text/event-stream; error after headers uses an error event') : 'Safe detail string' }])) } }]))
  } });
}
