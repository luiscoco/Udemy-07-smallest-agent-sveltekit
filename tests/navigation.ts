// Component tests inject navigation; real SvelteKit routing is exercised over HTTP.
export function goto(_path: string) { throw new Error('Inject navigation in component tests'); }
