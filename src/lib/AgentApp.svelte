<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from './api.js';
  import { isAgentResult, type AgentClient, type AgentResult, type Health, type TimelineMessage } from './types.js';
  import { renderMarkdown } from './code.js';
  import CodeBlock from './CodeBlock.svelte';
  import Lesson from './Lesson.svelte';
  let { section = 'lab', client = api, navigate = (path: string) => goto(path) }: { section?: string; client?: AgentClient; navigate?: (path: string) => unknown } = $props();
  const sections = [['lab','Application lab'],['learn','What you will learn'],['setup','How to run'],['architecture','Architecture & workflow'],['walkthrough','Code walkthrough']];
  const examples = ['Hello world!', 'Explain what an AI agent is in one sentence.', 'What is TypeScript?'];
  let prompt = $state('Hello world!'), mode = $state('stream');
  let status = $state<'idle'|'running'|'success'|'error'>('idle');
  let result = $state<AgentResult | null>(null), messages = $state<TimelineMessage[]>([]);
  let health = $state<Health | null>(null), checked = $state(false), elapsed = $state(0);
  let error = $state(''), notice = $state(''), dark = $state(false), hydrated = $state(false);
  let busy = false, controller: AbortController | undefined, timer: ReturnType<typeof setInterval> | undefined;
  const answer = $derived(renderMarkdown(result?.result || ''));
  onMount(() => {
    try { dark = localStorage.getItem('agent-theme') === 'dark'; } catch { /* Storage may be unavailable. */ }
    hydrated = true;
    const healthAbort = new AbortController();
    client.health(healthAbort.signal).then(value => { health = value; checked = true; }).catch(() => { if (!healthAbort.signal.aborted) checked = true; });
    return () => { healthAbort.abort(); controller?.abort(); clearInterval(timer); };
  });
  $effect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('agent-theme', dark ? 'dark' : 'light'); } catch { }
  });
  $effect(() => { if (notice) { const id = setTimeout(() => notice = '', 7000); return () => clearTimeout(id); } });
  function navigateSection(event: MouseEvent, id: string) {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(id === 'lab' ? '/' : `/${id}`);
  }
  async function run(event?: Event) {
    event?.preventDefault();
    const trimmed = prompt.trim();
    if (busy || !trimmed || trimmed.length > 4000) return;
    busy = true;
    status = 'running'; notice = ''; result = null; messages = []; error = ''; elapsed = 0;
    const started = performance.now();
    controller = new AbortController();
    timer = setInterval(() => elapsed = Math.round(performance.now() - started), 100);
    let final: AgentResult | null = null;
    try {
      if (mode === 'stream') {
        await client.stream(trimmed, message => {
          if (messages.length < 500) messages = [...messages, { ...message, elapsed: Math.round(performance.now() - started) }];
          if (message.type === 'ResultMessage' && isAgentResult(message.data)) { final = message.data; result = message.data; }
        }, controller.signal);
        if (!final) throw new Error('The agent finished without a result. Please try again.');
      } else { final = await client.query(trimmed, controller.signal); result = final; }
      if ((final as AgentResult | null)?.is_error) throw new Error('The agent could not complete this prompt. Check the server configuration and try again.');
      status = 'success';
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        const message = err instanceof Error ? err.message : 'The request failed. Check the server connection and API key.';
        error = message; notice = message; status = 'error';
      } else status = 'idle';
    } finally { clearInterval(timer); elapsed = Math.round(performance.now() - started); busy = false; }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(result?.result || ''); notice = 'Answer copied'; }
    catch { notice = 'Clipboard unavailable. Select the answer to copy it.'; }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([result?.result || ''], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'claude-answer.md'; link.click(); URL.revokeObjectURL(url);
  }
</script>

<a class="skip-link" href="#lesson-content">Skip to lesson content</a>
<header class="topbar"><a class="brand" href="/"><span class="brand-icon">a<span>·</span></span><span>The Smallest Agent<small>CLAUDE AGENT SDK · SVELTEKIT + NODE.JS + TYPESCRIPT</small></span></a><div class="header-actions"><span class="health"><i class:online={health?.status === 'ok'}></i>{!checked ? 'Checking server…' : health ? 'Server connected' : 'Server offline'}</span>{#if health && !health.api_key_configured}<span class="warning">API key not configured</span>{/if}<a href="/docs" target="_blank" rel="noreferrer">API docs ↗</a><button onclick={() => dark = !dark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀ Light' : '☾ Dark'}</button></div></header>
<main>
  <div class="course-hero"><div><span class="eyebrow">LEARN IT. BUILD IT. WATCH IT WORK.</span><h1>Your first agent.<br /><em>A real web application.</em></h1><p class="hero-lead">Take the smallest agent from the terminal to the browser. Ask a question, follow the messages, and understand every layer of a SvelteKit + Node.js + TypeScript application.</p><div class="hero-tags"><span>Svelte 5 + SvelteKit</span><span>Node.js + Agent SDK</span><span>Built for learning</span></div></div><figure class="mascot"><img src="/astronaut.png" alt="Waving course astronaut" width="380" height="483" /><figcaption>A small step into agent development.</figcaption></figure></div>
  <nav class="lesson-nav" aria-label="Application sections">{#each sections as [id,label]}<a href={id === 'lab' ? '/' : `/${id}`} aria-current={section === id ? 'page' : undefined} onclick={event => navigateSection(event,id)}>{label}</a>{/each}</nav>
  <div id="lesson-content" tabindex="-1">
    <section hidden={section !== 'lab'} aria-labelledby="lab-title">
      <div class="section-intro lab-intro"><div><span class="eyebrow">APPLICATION LAB</span><h2 id="lab-title">Start with a little curiosity.</h2><p>One prompt. One agent. See exactly what comes back.</p></div><a href="/setup" onclick={e => navigateSection(e,'setup')}>Need help getting started? →</a></div>
      <div class="lesson-flow">{#each [['Ask a question','Start with Hello world!'],['Watch the stream','Inspect real SDK messages'],['Read the result','Check the answer and metrics']] as [title,text],i}<div><span>0{i+1}</span><strong>{title}</strong><p>{text}</p></div>{/each}</div>
      <div class="workspace"><div class="left-column">
        <section class="panel" aria-labelledby="prompt-title"><div class="panel-heading"><div><span class="eyebrow">YOUR FIRST TYPESCRIPT AGENT</span><h2 id="prompt-title">Give your agent a prompt</h2></div></div>
          <form onsubmit={run}><label class="field-label" for="prompt">What would you like to ask?</label><textarea class="prompt-input" id="prompt" bind:value={prompt} disabled={status === 'running'} maxlength="4000" rows="5" aria-describedby="prompt-hint" onkeydown={event => { if (event.ctrlKey && event.key === 'Enter') run(event); }}></textarea><div class="field-hints"><span id="prompt-hint">Keep it simple. Your first agent starts with a question.</span><span>{prompt.trim().length}/4000</span></div>
          <div class="examples"><span>TRY A PROMPT</span>{#each examples as example}<button type="button" class="example" disabled={status === 'running'} onclick={() => prompt = example}>{example}</button>{/each}</div>
          <div class="run-toolbar"><div class="mode-toggle" role="group" aria-label="Response mode">{#each ['stream','simple'] as value}<button type="button" aria-pressed={mode === value} disabled={status === 'running'} onclick={() => mode = value}>{value === 'stream' ? 'Stream' : 'Simple'}</button>{/each}</div><button type="submit" class="primary" disabled={status === 'running' || !prompt.trim()}>{status === 'running' ? 'Running…' : 'Run agent ↗'}</button></div><div class="run-footnote"><span>{mode === 'stream' ? 'Watch every SDK message as it arrives' : 'Receive the final answer in one response'}</span><kbd>Ctrl + Enter</kbd></div></form>
        </section>
        <section class="panel answer-panel" aria-labelledby="answer-title" aria-busy={status === 'running'}><div class="panel-heading"><div><span class="eyebrow">02 / OUTPUT</span><h2 id="answer-title">Agent’s answer</h2></div>{#if result}<button onclick={copy} aria-label="Copy answer">Copy</button><button onclick={download}>Download .md</button>{/if}<span class="state" data-state={status}>{status}</span></div>
          {#if status === 'running'}<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span><span>Agent is working<strong>{elapsed} ms</strong></span></div>{/if}
          {#if error}<p class="error-message" role="alert">{error}</p>{/if}
          {#if result}<div class="markdown">{@html answer}</div><div class="stats"><span><strong>{result.num_turns}</strong>turns</span><span><strong>{result.duration_ms}</strong>ms</span><span><strong>{result.total_cost_usd == null ? 'Not reported' : `$${result.total_cost_usd.toFixed(6)}`}</strong>USD</span></div>{/if}
          {#if status === 'idle'}<div class="answer-empty"><span aria-hidden="true">✧</span><p>Your next discovery starts with a question.</p><small>Run the agent to see a real answer here. No sample response is preloaded.</small></div>{/if}
        </section></div>
        <div class="stream-inspector"><section class="panel inspector" aria-labelledby="stream-title"><div class="panel-heading"><div><span class="eyebrow">INSIDE THE AGENT</span><h2 id="stream-title">Message stream</h2></div><span class="count">{messages.length} events</span></div><p class="panel-description">Follow initialization, assistant messages and the final result. Expand an event to inspect its safe JSON.</p><div class="timeline" aria-live="polite" aria-relevant="additions">
        {#each messages as message}<article class="timeline-row"><span class="timeline-dot" data-type={message.type}></span><div class="event-body"><div class="event-heading"><span class="badge" data-type={message.type}>{message.type}</span><time>+{message.elapsed} ms</time></div><p>{message.summary}</p><details><summary>View JSON details</summary><CodeBlock code={JSON.stringify(message.data,null,2)} language="json" /></details></div></article>{/each}
        {#if !messages.length}<div class="empty-stream"><span class="empty-symbol" aria-hidden="true">⌁</span><h3>{mode === 'simple' ? 'Simple mode shows the final answer' : 'Your agent’s journey starts here'}</h3><p>{mode === 'simple' ? 'Switch to Stream before your next run to inspect individual SDK messages.' : 'Run a prompt in Stream mode to see real messages as they arrive.'}</p><div class="sample-flow" aria-label="Illustrative sequence, not a live result">System → Assistant → Result</div></div>{/if}
        </div></section></div></div>
      <aside class="lesson-note"><strong>The same agent, with a web application around it.</strong><p>Your prompt travels through a Svelte component → SvelteKit route handler → the Claude Agent SDK → Claude. Built-in tools are disabled and the API key stays on the server. Submitting a prompt may use API credits.</p><a href="/architecture" onclick={e => navigateSection(e,'architecture')}>Explore the architecture →</a></aside>
    </section>
    <Lesson {section} />
  </div>
  <footer><div><strong>The Smallest Agent · SvelteKit + Node.js + TypeScript Edition</strong><p>A small agent at the core. A real application around it.</p></div><a href="https://github.com/luiscoco/Udemy-Claude-Agent-SDK-lesson01-app" target="_blank" rel="noreferrer">Course design reference ↗</a></footer>
</main>
{#if notice}<div class="snackbar" role="status"><span>{notice}</span><button onclick={() => notice = ''}>Dismiss</button></div>{/if}
