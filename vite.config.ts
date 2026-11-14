import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [sveltekit({ adapter: adapter(), paths: { origin: 'http://127.0.0.1:4800' } })],
  ssr: { external: ['@anthropic-ai/claude-agent-sdk'] }
});
