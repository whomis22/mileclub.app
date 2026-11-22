import type { Activity, Profile } from '@/data/types';
import { PLANS } from '@/data/plans';
import type { MyPost, PostComment } from '@/state/store';

// Achievements (Yana, 2026-11-21): free members tick off a set of 10. Finishing set 1 earns
// one free padel or pilates session; finishing set 2 earns the blue tick. Ticks 6-10 of set 1
// and all of set 2 are still being decided by Yana, so they show as "Coming soon".
export type Tick = { id: string; icon: string; title: string; hint: string; done: boolean; progress?: [number, number]; soon?: boolean };

type Input = {
  profile: Profile;
  myPosts: MyPost[];
  comments: Record<string, PostComment[]>;
  activities: Activity[];
  planJoins: string[];
  stars?: Record<string, number>; // best rating from each person (no ratings yet)
};

export const SET_SIZE = 10;

export function firstSet(n: Input): Tick[] {
  const p = n.profile;
  const profileParts = [!!p.photoUri, p.activities.length > 0, p.availability.length > 0, p.goals.length > 0];
  const profileDone = profileParts.filter(Boolean).length;

  const posts = n.myPosts.length;
  const comments = Object.values(n.comments).flat().filter((c) => c.authorId === 'me').length;
  const shared = Math.max(posts, comments);

  const joinedPlans = PLANS.filter((x) => n.planJoins.includes(x.id));
  const mine = n.activities.filter((a) => a.participants.includes('me') && a.hostId !== 'me');
  const group = joinedPlans.length > 0 || mine.some((a) => !a.solo && a.groupSize >= 3);
  const run = joinedPlans.some((x) => x.kind === 'Running') || mine.some((a) => a.type === 'running');
  const bestStars = Math.max(0, ...Object.values(n.stars ?? {}));

  const ticks: Tick[] = [
    { id: 'profile', icon: 'person-circle-outline', title: 'Complete your profile', hint: profileDone === 4 ? 'All done' : 'Add a photo, your activities, goals and when you’re free', done: profileDone === 4, progress: [profileDone, 4] },
    { id: 'share', icon: 'chatbubbles-outline', title: 'Make 5 posts or 5 comments', hint: `${posts} posts · ${comments} comments`, done: shared >= 5, progress: [Math.min(shared, 5), 5] },
    { id: 'group', icon: 'people-outline', title: 'Join a group session', hint: 'Join any plan with 3+ people', done: group },
    { id: 'run', icon: 'walk-outline', title: 'Join someone on their run', hint: 'Join a run someone else is hosting', done: run },
    { id: 'stars', icon: 'star-outline', title: 'Get 5 stars from 1 person', hint: 'People rate you after a session together', done: bestStars >= 5, progress: [bestStars, 5] },
  ];
  for (let i = ticks.length; i < SET_SIZE; i++) ticks.push({ id: `soon${i}`, icon: 'lock-closed-outline', title: 'Coming soon', hint: 'A new challenge is on its way', done: false, soon: true });
  return ticks;
}
