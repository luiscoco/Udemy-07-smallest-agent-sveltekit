import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = { app: 'src/lib/AgentApp.svelte', client: 'src/lib/api.ts', code: 'src/lib/code.ts', handlers: 'src/lib/server/handlers.ts', service: 'src/lib/server/agent-service.ts', route: 'src/routes/api/agent/stream/+server.ts' };
const sources = Object.fromEntries(Object.entries(files).map(([name,path])=>[name,readFileSync(resolve(root,path),'utf8')]));
function excerpt(key, marker, count=5) {
  const lines=sources[key].split(/\r?\n/), index=lines.findIndex(line=>line.includes(marker));
  if(index<0)throw new Error(`Missing source marker: ${files[key]} ${marker}`);
  const selected=lines.slice(index,index+count), indent=Math.min(...selected.filter(line=>line.trim()).map(line=>line.search(/\S/)));
  return selected.map(line=>line.slice(indent)).join('\n').trimEnd();
}
const svg=readFileSync(resolve(root,'scripts/workflow-template.svg'),'utf8');
const labels=[...svg.matchAll(/<text[^>]*>(\d+)\. ([^<]+)<\/text>/g)].map(m=>[Number(m[1]),m[2].replaceAll('&amp;','&').replaceAll('&gt;','>')]);
if(labels.length!==16 || new Set(labels.map(([n])=>n)).size!==16 || labels.some(([n],i)=>n!==i+1))throw new Error('Expected 16 SVG labels');
const steps=[];
function step(number,key,marker,count,text,explanation) {
  const title=labels.find(([index])=>index===number)?.[1];if(!title)throw new Error(`Missing UML label ${number}`);
  steps.push({number,title,source:files[key],language:'typescript',text,code:excerpt(key,marker,count),explanation});
}
step(1,'app','const trimmed = prompt.trim()',6,'The Svelte form trims the prompt and prevents duplicate submissions.','A synchronous lock applies before any async work. Validation is repeated on the server.');
step(2,'client',"const response = await fetch('/api/agent/stream'",6,'The browser posts JSON to a relative same-origin endpoint.','SvelteKit serves the UI and API on the same Node server. Private configuration never enters this client.');
step(3,'handlers','const prompt = validatePrompt(body)',3,'The server treats all JSON input as untrusted.','The request reader also bounds actual body bytes, validates content type and checks Origin. The SDK independently disables built-in tools.');
step(4,'route','export function POST',1,'A real SvelteKit POST route delegates to the server-only handlers.','The runtime composes validated configuration and the SDK service per request. Client modules cannot import this server-only directory.');
step(5,'service','const conversation = queryFn(',6,'The actual SDK query boundary owns the CLI runtime and model transport.','The application supplies a prompt and typed options, then consumes SDK messages. The model exchange itself is internal to the SDK.');
step(6,'service','for await (const message of conversation)',4,'Observe SDK messages until a final result appears.','This runAgent excerpt shows the same loop as the terminal lesson. streamAgent consumes the iterator while forwarding safe progress projections.');
step(7,'service','yield { type, summary, data }',4,'Only allowlisted data leaves the SDK service.','Text, system subtype and final metrics are projected. Thinking, tool inputs, paths, session IDs and raw configuration are excluded.');
step(8,'handlers','const sendEvent =',3,'The handler encodes UTF-8 SSE frames.','Heartbeat comments keep the stream active. Request abort, reader cancellation and the three-minute deadline clean up execution.');
step(9,'app','if (messages.length < 500)',3,'Each safe event appends a timestamped Svelte timeline row.','The 500-row display limit does not prevent final-result processing. State belongs to this component, rather than a shared server store.');
step(10,'service','function resultData(',8,'Normalize answer, turns, duration, estimated cost and error flag.','Non-success subtypes remain failures even if is_error is false. Exact key occurrences are redacted; absent cost remains null.');
step(11,'client',"if (event === 'message')",3,'Validate the final-result contract before delivery to Svelte.','ResultMessage is a public presentation label for a safe SDK result projection. It uses the same SSE message event as progress.');
step(12,'code','export function renderMarkdown',4,'Sanitize Markdown and highlighted code before rendering HTML.','Svelte HTML insertion receives only sanitized Markdown. CodeBlock uses escaped Highlight.js output for trusted source snippets and DOMPurify in the browser.');
step(13,'client',"if (event === 'done')",4,'Require both a final result and done before resolving the stream.','Transport completion does not override an SDK error result. The parser handles split UTF-8, CRLF, comments and multiple frames.');
step(14,'handlers',"} catch { sendEvent('error'",2,'A failure after SSE starts emits a safe error without done.','Query failures instead return HTTP 502. Raw provider exceptions and submitted values never enter these error details.');
step(15,'app','const message = err instanceof Error',3,'Show the safe error and snackbar, then restore controls.','Specific HTTP validation and origin details survive the client boundary. Completion and teardown clear timers and cancel owned requests.');
step(16,'handlers',"if (!config.apiKeyConfigured) { sendEvent",2,'A missing key ends the stream before the SDK service is called.','Simple mode returns 503. Invalid prompts are rejected with 422 before SSE headers. Neither path calls the model.');
if (steps.length !== 16 || steps.some((step,i) => step.number !== i+1 || step.title !== labels[i][1])) throw new Error('Diagram/source cards mismatch');
mkdirSync(resolve(root,'src/lib/lesson'),{recursive:true});
writeFileSync(resolve(root,'src/lib/lesson/workflow.json'),JSON.stringify(steps,null,2)+'\n');
writeFileSync(resolve(root,'static/workflow.svg'),svg);
writeFileSync(resolve(root,'static/workflow.puml'),readFileSync(resolve(root,'scripts/workflow-template.puml')));
console.log('Generated 16 SvelteKit TypeScript source cards and matching UML downloads.');
