import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
process.env.HOST ||= '127.0.0.1';
process.env.PORT ||= '4800';
await import('../build/index.js');
