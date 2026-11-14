import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/server.test.ts','tests/api.test.ts'] } });
