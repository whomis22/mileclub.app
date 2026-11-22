// Sample portrait photos and a "what I do" line for the sample members,
// used on the For You cards until people upload their own photos.
import type { ActivityId } from './options';

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=70`;

// wants = what they're looking for someone to do with them, and when (every day for now).
export type Strength = { icon: string; label: string };

export const FACES: Record<string, { photo: string; work: string; wants: { type: ActivityId; at: string; what: string }; bio?: string; strengths?: Strength[] }> = {
  sanne: { bio: 'Training for my first 10k and looking for people to run with after work. Dinner after is a must.', strengths: [{ icon: 'flash', label: 'Endurance' }, { icon: 'walk', label: 'Running' }, { icon: 'body', label: 'Pilates' }], wants: { type: 'running', at: '18:30', what: 'Easy 5k, then dinner' }, photo: u('1494790108377-be9c29b29330'), work: 'Product designer · New to running' },
  daan: { bio: 'Half-marathon runner who loves an early ride. Always up for intervals or a long Sunday run.', strengths: [{ icon: 'speedometer', label: 'Speed' }, { icon: 'bicycle', label: 'Cycling' }, { icon: 'trophy', label: 'Race ready' }], wants: { type: 'cycling', at: '07:00', what: 'Morning ride before work' }, photo: u('1500648767791-00dcc994a43e'), work: 'Engineer · Half-marathon runner' },
  amira: { bio: 'Founder by day, yogi at lunch. Looking for calm, consistent workout friends.', strengths: [{ icon: 'leaf', label: 'Flexibility' }, { icon: 'body', label: 'Yoga' }, { icon: 'heart', label: 'Pilates' }], wants: { type: 'yoga', at: '12:30', what: 'Lunchtime yoga' }, photo: u('1531123897727-8f129e1688ce'), work: 'Founder · Yoga & pilates' },
  lucas: { bio: 'Gym most evenings, pickup basketball on weekends. Need a spotter for leg day.', strengths: [{ icon: 'barbell', label: 'Strength' }, { icon: 'basketball', label: 'Basketball' }, { icon: 'fitness', label: 'Gym' }], wants: { type: 'gym', at: '18:00', what: 'Gym buddy for leg day' }, photo: u('1500048993953-d23a436266cf'), work: 'Student · Cycling & 5-a-side' },
  femke: { bio: 'Long walks, saunas and the odd hike. Here to slow down and meet good people.', strengths: [{ icon: 'trail-sign', label: 'Hiking' }, { icon: 'water', label: 'Sauna' }, { icon: 'sunny', label: 'Outdoors' }], wants: { type: 'hiking', at: '10:00', what: 'Long walk + sauna' }, photo: u('1438761681033-6461ffad8d80'), work: 'Doctor · Sauna Sundays' },
  noah: { bio: 'Lawyer who lives for padel and tennis after work. Need a 4th for doubles.', strengths: [{ icon: 'tennisball', label: 'Tennis' }, { icon: 'flash', label: 'Agility' }, { icon: 'people', label: 'Doubles' }], wants: { type: 'tennis', at: '19:30', what: 'Tennis doubles, need a 4th' }, photo: u('1506794778202-cad84cf45f1d'), work: 'Lawyer · Padel after work' },
  yasmin: { bio: 'Trying a new class every week. Reformer pilates is my current obsession.', strengths: [{ icon: 'body', label: 'Pilates' }, { icon: 'sparkles', label: 'New things' }, { icon: 'musical-notes', label: 'Dance' }], wants: { type: 'pilates', at: '17:30', what: 'Reformer pilates class' }, photo: u('1488426862026-3ee34a7d66df'), work: 'Content creator · Trying new things' },
  tom: { bio: 'Chef who runs at sunrise and lifts in the afternoon. Coffee after is non-negotiable.', strengths: [{ icon: 'sunny', label: 'Early runs' }, { icon: 'barbell', label: 'Strength' }, { icon: 'cafe', label: 'Coffee' }], wants: { type: 'running', at: '06:30', what: 'Sunrise run + coffee' }, photo: u('1507003211169-0a1dd7228f2d'), work: 'Chef · Strength & coffee' },
  lotte: { bio: 'Teacher, sunset runner, strength sessions twice a week. Friendly pace, always.', strengths: [{ icon: 'barbell', label: 'Strength' }, { icon: 'walk', label: 'Running' }, { icon: 'happy', label: 'Motivator' }], wants: { type: 'strength', at: '20:00', what: 'Evening strength session' }, photo: u('1544005313-94ddf0286df2'), work: 'Teacher · Sunset runs' },
  mateo: { bio: 'Musician who climbs and plays padel. Looking for a gym buddy for push day.', strengths: [{ icon: 'fitness', label: 'Gym' }, { icon: 'tennisball', label: 'Padel' }, { icon: 'trending-up', label: 'Climbing' }], wants: { type: 'gym', at: '17:00', what: 'Push day at the gym' }, photo: u('1539571696357-5a69c17a67c6'), work: 'Musician · Padel & climbing' },
};

export function faceFor(id: string) {
  return FACES[id];
}

// The next time this person's plan happens: later today, or tomorrow if it's already passed.
export function nextWant(id: string, now = Date.now()) {
  const w = FACES[id]?.wants;
  if (!w) return undefined;
  const [h, m] = w.at.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h!, m!, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  const today = new Date(now).getDate() === d.getDate();
  return { ...w, when: d, label: `${today ? (h! >= 17 ? 'Tonight' : 'Today') : 'Tomorrow'} ${w.at}` };
}
