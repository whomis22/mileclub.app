import { Storage } from 'expo-sqlite/kv-store';
import { createContext, useContext, useState, type ReactNode } from 'react';

import { sampleActivities } from '@/data/activities';
import { sampleSessions, type CoachSession } from '@/data/coaches';
import type { Role } from '@/data/roles';
import type { Activity, Profile } from '@/data/types';

type State = {
  profile: Profile | null;
  myActivities: Activity[]; // activities the user created
  joined: string[]; // ids of activities the user joined
  blocked: string[]; // person ids
  skipped: string[]; // activity ids swiped left
  kudos: string[]; // feed post ids the user high-fived
  mySessions: CoachSession[]; // paid sessions the user hosts as a coach
  booked: string[]; // paid session ids the user booked (mock payment)
};

type Store = State & {
  activities: Activity[];
  saveProfile: (p: Profile) => void;
  createActivity: (a: Omit<Activity, 'id' | 'participants' | 'hostId'>) => Activity;
  toggleJoin: (id: string) => void;
  join: (id: string) => void;
  skip: (id: string) => void;
  clearSkipped: () => void;
  toggleKudos: (postId: string) => void;
  sessions: CoachSession[];
  hostSession: (s: Omit<CoachSession, 'id' | 'coachId' | 'booked'>) => CoachSession;
  setRole: (role: Role) => void;
  book: (sessionId: string) => void;
  cancelBooking: (sessionId: string) => void;
  block: (personId: string) => void;
  reset: () => void;
};

const KEY = 'mileclub-state-v1';
const empty: State = { profile: null, myActivities: [], joined: [], blocked: [], skipped: [], kudos: [], mySessions: [], booked: [] };

function load(): State {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

const Ctx = createContext<Store | null>(null);
const samples = sampleActivities();
const sampleCoachSessions = sampleSessions();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  const update = (fn: (s: State) => State) =>
    setState((prev) => {
      const next = fn(prev);
      try {
        Storage.setItemSync(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const activities = [...state.myActivities, ...samples]
    .filter((a) => !state.blocked.includes(a.hostId))
    .map((a) =>
      state.joined.includes(a.id) && !a.participants.includes('me')
        ? { ...a, participants: [...a.participants, 'me'] }
        : a,
    );

  const sessions = [...state.mySessions, ...sampleCoachSessions].map((cs) =>
    state.booked.includes(cs.id) ? { ...cs, booked: cs.booked + 1 } : cs,
  );

  const store: Store = {
    ...state,
    activities,
    sessions,
    hostSession: (input) => {
      // Demo only: pretend a few people already booked, so the earnings screen has numbers in it.
      const demoBooked = Math.max(1, Math.round(input.spots * 0.6));
      const cs: CoachSession = { ...input, id: `me-s-${Date.now()}`, coachId: 'me', booked: demoBooked };
      update((s) => ({ ...s, mySessions: [cs, ...s.mySessions] }));
      return cs;
    },
    setRole: (role) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, role } } : s)),
    book: (id) => update((s) => (s.booked.includes(id) ? s : { ...s, booked: [...s.booked, id] })),
    cancelBooking: (id) => update((s) => ({ ...s, booked: s.booked.filter((x) => x !== id) })),
    saveProfile: (profile) => update((s) => ({ ...s, profile })),
    createActivity: (input) => {
      const activity: Activity = { ...input, id: `me-${Date.now()}`, participants: ['me'], hostId: 'me' };
      update((s) => ({ ...s, myActivities: [activity, ...s.myActivities] }));
      return activity;
    },
    toggleJoin: (id) =>
      update((s) => ({
        ...s,
        joined: s.joined.includes(id) ? s.joined.filter((x) => x !== id) : [...s.joined, id],
      })),
    join: (id) => update((s) => (s.joined.includes(id) ? s : { ...s, joined: [...s.joined, id] })),
    skip: (id) => update((s) => (s.skipped.includes(id) ? s : { ...s, skipped: [...s.skipped, id] })),
    clearSkipped: () => update((s) => ({ ...s, skipped: [] })),
    toggleKudos: (postId) =>
      update((s) => ({
        ...s,
        kudos: s.kudos.includes(postId) ? s.kudos.filter((x) => x !== postId) : [...s.kudos, postId],
      })),
    block: (personId) => update((s) => ({ ...s, blocked: [...s.blocked, personId] })),
    reset: () => update(() => empty),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
