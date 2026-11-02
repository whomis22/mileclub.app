import { FOLLOWS_YOU } from '@/data/people';

// Two members can call each other only when they follow each other.
// Admins can call anyone.
export function callRule(id: string, following: string[], admin: boolean) {
  if (admin) return { ok: true as const };
  const iFollow = following.includes(id);
  const theyFollow = FOLLOWS_YOU.includes(id);
  if (iFollow && theyFollow) return { ok: true as const };
  return { ok: false as const, iFollow, theyFollow };
}
