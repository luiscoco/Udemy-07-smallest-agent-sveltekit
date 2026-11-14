import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'], alias: { '$app/navigation': fileURLToPath(new URL('./tests/navigation.ts', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['tests/app.test.ts'] }
});
