import type { PostComment } from '@/state/store';

// Sample comments so posts have some life before launch. Times are minutes ago.
const raw: Record<string, [string, string, number][]> = {
  f1: [
    ['daan', 'That fog looks unreal. Congrats on the PB!', 50],
    ['sanne', 'Saving a spot for me next time? 🙋‍♀️', 30],
  ],
  f2: [['femke', 'Week 4 already, you are flying', 120]],
  f3: [
    ['lotte', 'This is exactly what I needed after work', 600],
    ['noah', 'Count me in next Sunday', 400],
    ['yasmin', 'So calm 🧘', 200],
  ],
  f5: [
    ['amira', 'HUGE. So proud of you!', 900],
    ['tom', 'Next stop 10K 💪', 700],
  ],
};

export function sampleComments(postId: string): PostComment[] {
  return (raw[postId] ?? []).map(([authorId, text, minsAgo], i) => ({
    id: `s-${postId}-${i}`,
    authorId,
    text,
    at: Date.now() - minsAgo * 60000,
  }));
}

export function agoLabel(at: number) {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 60 / 24)}d`;
}
