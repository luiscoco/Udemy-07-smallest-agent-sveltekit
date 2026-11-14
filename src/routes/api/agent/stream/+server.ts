import { handlers } from '#lib/server/runtime.js';
export function POST({ request }: { request: Request }) { return handlers().stream(request); }
