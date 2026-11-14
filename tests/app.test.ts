import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import AgentApp from '../src/lib/AgentApp.svelte';
import { renderMarkdown, highlightCode } from '../src/lib/code';
import type { AgentClient, AgentMessage, AgentResult } from '../src/lib/types';
const answer: AgentResult = { result: '**Hello!**\n\n```typescript\nconst greeting = "hi";\n```', num_turns: 1, duration_ms: 42, total_cost_usd: null, is_error: false };
function client(overrides: Partial<AgentClient> = {}): AgentClient {
  return { health: vi.fn(async () => ({ status: 'ok' as const, api_key_configured: false })), query: vi.fn(async () => answer), stream: vi.fn(async (_prompt,onMessage) => { onMessage({ type: 'SystemMessage', summary: 'Initialized', data: { subtype: 'init' } }); onMessage({ type: 'ResultMessage', summary: 'Final answer received', data: answer }); }), ...overrides };
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); document.documentElement.classList.remove('dark'); });
describe('Svelte application interactions', () => {
  it('updates every tab on one reused component and retains the lab prompt', async () => {
    const navigate = vi.fn(async (path: string) => view.rerender({ section: path.slice(1) || 'lab', client: fake, navigate }));
    const fake = client();
    const view = render(AgentApp, { section: 'lab', client: fake, navigate });
    await fireEvent.input(screen.getByLabelText('What would you like to ask?'), { target: { value: 'Remember this question' } });
    const tabs = [['What you will learn','Small enough to understand. Real enough to explore.','learn'],['How to run','One command starts the application.','setup'],['Architecture & workflow','See how the pieces connect.','architecture'],['Code walkthrough','The same loop. A SvelteKit structure.','walkthrough'],['Application lab','Start with a little curiosity.','']];
    for (const [label,heading,path] of tabs) {
      const link = screen.getByRole('link',{ name: label });
      await fireEvent.click(link);
      await waitFor(() => expect(link.getAttribute('aria-current')).toBe('page'));
      expect(navigate).toHaveBeenLastCalledWith(`/${path}`);
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
      if (path === 'architecture') { expect(view.container.querySelectorAll('.workflow-code-step')).toHaveLength(16); expect(view.container.querySelector('.hljs-keyword')).toBeTruthy(); }
    }
    expect((screen.getByLabelText('What would you like to ask?') as HTMLTextAreaElement).value).toBe('Remember this question');
  });
  it('runs Simple mode with trimmed input, safe Markdown and final metrics', async () => {
    const fake = client(); render(AgentApp,{ client: fake });
    await fireEvent.click(screen.getByRole('button',{ name: 'Simple' }));
    await fireEvent.input(screen.getByLabelText('What would you like to ask?'), { target: { value: '  Hi  ' } });
    await fireEvent.click(screen.getByRole('button',{ name: 'Run agent ↗' }));
    await waitFor(() => expect(screen.getByText('success')).toBeTruthy());
    expect(fake.query).toHaveBeenCalledWith('Hi',expect.any(AbortSignal));
    expect(screen.getByText('Hello!').tagName).toBe('STRONG'); expect(screen.getByText('Not reported')).toBeTruthy();
    expect(document.querySelector('.markdown .hljs-keyword')).toBeTruthy();
  });
  it('streams safe SDK events and exposes expandable JSON', async () => {
    const view = render(AgentApp,{ client: client() });
    await fireEvent.click(screen.getByRole('button',{ name: 'Run agent ↗' }));
    await waitFor(() => expect(screen.getByText('success')).toBeTruthy());
    expect(view.container.querySelectorAll('.timeline-row')).toHaveLength(2);
    expect(screen.getByText('2 events')).toBeTruthy(); expect(screen.getAllByText('View JSON details')).toHaveLength(2);
  });
  it('locks duplicate submissions immediately, including Ctrl+Enter', async () => {
    let release!: (value: AgentResult) => void;
    const fake = client({ query: vi.fn(() => new Promise<AgentResult>(resolve => release = resolve)) });
    render(AgentApp,{ client: fake }); await fireEvent.click(screen.getByRole('button',{ name: 'Simple' }));
    const input = screen.getByLabelText('What would you like to ask?');
    await fireEvent.keyDown(input,{ ctrlKey: true, key: 'Enter' });
    await fireEvent.keyDown(input,{ ctrlKey: true, key: 'Enter' });
    expect(fake.query).toHaveBeenCalledTimes(1); expect((input as HTMLTextAreaElement).disabled).toBe(true);
    release(answer); await waitFor(() => expect(screen.getByText('success')).toBeTruthy());
  });
  it('shows specific errors, restores controls and supports theme persistence', async () => {
    render(AgentApp,{ client: client({ stream: vi.fn(async () => { throw new Error('Configure the server key'); }) }) });
    await fireEvent.click(screen.getByRole('button',{ name: 'Run agent ↗' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Configure the server key'));
    expect((screen.getByRole('button',{ name: 'Run agent ↗' }) as HTMLButtonElement).disabled).toBe(false);
    await fireEvent.click(screen.getByRole('button',{ name: 'Switch to dark mode' }));
    await waitFor(() => expect(localStorage.getItem('agent-theme')).toBe('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  it('does not treat an error result or missing final result as success', async () => {
    const fake = client({ stream: vi.fn(async (_prompt,receive) => receive({ type: 'ResultMessage', summary: 'Failed', data: { ...answer, is_error: true } })) });
    const view = render(AgentApp,{ client: fake });
    await fireEvent.click(screen.getByRole('button',{ name: 'Run agent ↗' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('could not complete'));
    await view.rerender({ client: client({ stream: vi.fn(async () => {}) }) });
    await fireEvent.click(screen.getByRole('button',{ name: 'Run agent ↗' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('without a result'));
  });
  it('escapes code and removes unsafe model HTML while retaining syntax colors', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)"><script>alert(1)</script>\n\n```typescript\nconst x = 1;\n```');
    expect(html).not.toContain('onerror'); expect(html).not.toContain('<script'); expect(html).toContain('hljs-keyword');
    expect(highlightCode('<script>alert(1)</script>','unknown')).toContain('&lt;script&gt;');
  });
});
