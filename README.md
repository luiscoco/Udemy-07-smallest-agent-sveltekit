# The Smallest Agent — SvelteKit + Node.js + TypeScript

Independent edition 07: Svelte 5 runes, SvelteKit 3 routes, Node adapter and the actual TypeScript Claude Agent SDK. UI and API share port 4800. Includes Stream/Simple lab, five lesson sections, large pastel cards, dark theme, safe Markdown/code highlighting and 16 source-linked UML steps.

## Windows Terminal (PowerShell)

From **Lesson 0**, enter this edition and install with Node.js 24:

```powershell
cd .\07-smallest-agent-sveltekit
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Set `ANTHROPIC_API_KEY` to your own Anthropic key. Leave `CLAUDE_MODEL` and `AGENT_SYSTEM_PROMPT` blank for SDK defaults. `AGENT_MAX_TURNS=1` is the lesson default (valid range 1–10). Existing process variables override `.env`; restart after changes. Never put keys in PUBLIC_ or VITE_ variables or commit them. No real key is created/copied by this implementation.

Stay in **07-smallest-agent-sveltekit**:

```powershell
npm run dev
```

Open **http://127.0.0.1:4800**. API docs: http://127.0.0.1:4800/docs; machine schema: /openapi.json. Ctrl+C stops the server. There is no separate backend terminal or Python virtual environment. `Start-Application.ps1` also finds its own project directory if invoked by path. `npm ci` requires the checked-in root lockfile; run from this folder to avoid ENOENT.

## Checks and production

```powershell
npm run generate:lesson
npm run typecheck
npm test
npm run build
# Stop development first, then:
npm start
```

Production defaults to http://127.0.0.1:4800. The start helper sets the project cwd before loading adapter-node. Server configuration explicitly reads this project's `.env` because adapter-node itself does not load it. HOST/PORT can override listening settings, but `paths.origin` in vite.config.ts must reflect the public protocol for deployment; rebuild after changing that config. The local app deliberately binds loopback. Public deployments need their own authentication and request controls.

## Implementation

`src/routes/[[section]]` supplies `/`, `/lab`, `/learn`, `/setup`, `/architecture` and `/walkthrough`. SvelteKit reuses the page/component on section navigation, keeping lab state local and intact. `src/lib/server` owns configuration, input validation, SDK options and SSE. Client types have no server dependencies. SvelteKit 3 configuration lives in vite.config.ts, uses #lib imports and $app/tsconfig.

The SDK runs with built-in tools disabled, isolated settings/skills/MCP/plugins, no session persistence and one turn by default. Server projections exclude thinking, raw configuration, session IDs and tool inputs; exact key occurrences are redacted. Markdown is sanitized with DOMPurify and fenced code highlighted with Highlight.js. The source generator reads actual implementation markers and writes 16 matching cards and local SVG/PlantUML downloads. Regenerate after source changes.

`POST /api/agent/query` returns a normalized final result. `POST /api/agent/stream` returns SDK-message SSE, rather than tokens; final result and done are both required. Error results remain failures. Health reports only connectivity/key presence. Missing key returns 503 for query or SSE error; input is rejected before SDK execution. Invalid JSON/origin/body/type/prompt yield 400/403/413/415/422. Provider query failure is safe 502. Streams support heartbeats, disconnect cancellation and a three-minute deadline. No live model answers are preloaded.

## References

- [SvelteKit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)
- [Node adapter](https://svelte.dev/docs/kit/adapter-node)
- [Claude Agent SDK TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript)
- [Course visual reference](https://github.com/luiscoco/Udemy-Claude-Agent-SDK-lesson01-app)

See VERIFICATION.md for executed checks and limits, ASSETS.md for visual provenance and BUILD-PROMPT.txt for the complete standalone recreation prompt.
