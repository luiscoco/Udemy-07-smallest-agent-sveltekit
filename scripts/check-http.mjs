import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4800';
for (const [path, text] of [['/','Start with a little curiosity.'],['/learn','Small enough to understand. Real enough to explore.'],['/setup','One command starts the application.'],['/architecture','See how the pieces connect.'],['/walkthrough','The same loop. A SvelteKit structure.'],['/docs','API documentation']]) {
  const response = await fetch(base + path); assert.equal(response.status,200,path);
  const html = await response.text(); assert.ok(html.includes(text), path);
  if (path === '/architecture') { assert.equal((html.match(/class="lesson-step workflow-code-step"/g)||[]).length,16); assert.ok(html.includes('hljs-keyword')); }
}
for (const path of ['/astronaut.png','/workflow.svg','/workflow.puml','/openapi.json']) assert.equal((await fetch(base+path)).status,200,path);
assert.equal((await fetch(base+'/unknown-lesson')).status,404);
const health = await (await fetch(base+'/api/health')).json();
assert.deepEqual(health,{status:'ok',api_key_configured:false});
const post = (mode,prompt,origin=base,extra={}) => fetch(`${base}/api/agent/${mode}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...extra},body:JSON.stringify({prompt})});
for (const mode of ['query','stream']) {
  assert.equal((await post(mode,'')).status,422);
  assert.equal((await post(mode,'Hi','https://foreign.invalid',{'X-Forwarded-Host':'foreign.invalid'})).status,403);
  const local = await fetch(`http://localhost:4800/api/agent/${mode}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:4800'},body:'{"prompt":""}'});
  assert.equal(local.status,422);
}
assert.equal((await post('query','Hi')).status,503);
const stream = await post('stream','Hi'); assert.ok(stream.headers.get('content-type').includes('text/event-stream'));
const frames = await stream.text(); assert.ok(frames.includes('event: error')); assert.ok(!frames.includes('event: done'));
assert.equal((await post('query','x'.repeat(40000))).status,413);
assert.equal((await fetch(base+'/api/agent/query',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'})).status,400);
assert.equal((await fetch(base+'/api/agent/query',{method:'POST',headers:{'Content-Type':'text/plain',Origin:base},body:'Hello'})).status,415);
console.log('HTTP checks passed: all lesson routes, 16 highlighted cards, docs/assets/schema, health, 404, validation, both loopback origins and no-key query/SSE.');
