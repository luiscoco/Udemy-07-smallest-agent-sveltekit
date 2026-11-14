import { error } from '@sveltejs/kit';
export function load({ params }: { params: { section?: string } }) {
  const section = params.section || 'lab';
  if (!['lab', 'learn', 'setup', 'architecture', 'walkthrough'].includes(section)) error(404);
  return { section };
}
