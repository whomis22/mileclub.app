import { Storage } from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { sampleActivities } from '@/data/activities';
import { sampleSessions, type CoachSession } from '@/data/coaches';
import type { Role } from '@/data/roles';
import { PEOPLE } from '@/data/people';
import type { Activity, Profile } from '@/data/types';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

// Someone asking to book one of the user's own coach sessions.
export type IncomingRequest = { id: string; sessionId: string; personId: string; status: RequestStatus; note?: string };

// Demo: sample coaches answer a request after this long.
const DEMO_REPLY_MS = 20000;

type State = {
  profile: Profile | null;
  myActivities: Activity[]; // activities the user created
  joined: string[]; // ids of activities the user joined
  blocked: string[]; // person ids
  skipped: string[]; // activity ids swiped left
  kudos: string[]; // feed post ids the user high-fived
  mySessions: CoachSession[]; // paid sessions the user hosts as a coach
  booked: string[]; // old: sessions booked before requests existed (treated as accepted)
  requests: Record<string, { status: RequestStatus; at: number }>; // user's booking requests, by session id
  incoming: IncomingRequest[]; // requests to the user's own sessions (when they're a coach)
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
  statusOf: (sessionId: string) => RequestStatus | undefined;
  respond: (requestId: string, status: 'accepted' | 'declined') => void;
  cancelBooking: (sessionId: string) => void;
  block: (personId: string) => void;
  reset: () => void;
};

const KEY = 'mileclub-state-v1';
const empty: State = { profile: null, myActivities: [], joined: [], blocked: [], skipped: [], kudos: [], mySessions: [], booked: [], requests: {}, incoming: [] };

function load(): State {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return empty;
    const s: State = { ...empty, ...JSON.parse(raw) };
    for (const id of s.booked) s.requests = { ...s.requests, [id]: { status: 'accepted', at: 0 } };
    return { ...s, booked: [] };
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

  // Demo: sample coaches accept pending requests after a short wait.
  useEffect(() => {
    const t = setInterval(() => {
      setState((prev) => {
        const due = Object.entries(prev.requests).filter(
          ([, r]) => r.status === 'pending' && Date.now() - r.at > DEMO_REPLY_MS,
        );
        if (!due.length) return prev;
        const requests = { ...prev.requests };
        for (const [id, r] of due) requests[id] = { ...r, status: 'accepted' };
        const next = { ...prev, requests };
        try {
          Storage.setItemSync(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const sessions = [...state.mySessions, ...sampleCoachSessions].map((cs) => {
    const extra =
      (state.requests[cs.id]?.status === 'accepted' ? 1 : 0) +
      state.incoming.filter((r) => r.sessionId === cs.id && r.status === 'accepted').length;
    return extra ? { ...cs, booked: cs.booked + extra } : cs;
  });

  const store: Store = {
    ...state,
    activities,
    sessions,
    hostSession: (input) => {
      // Demo only: pretend a few people already booked, so the earnings screen has numbers in it.
      const demoBooked = Math.round(input.spots * 0.4);
      const cs: CoachSession = { ...input, id: `me-s-${Date.now()}`, coachId: 'me', booked: demoBooked };
      // Demo: a few people ask to join straight away, so there are requests to accept or decline.
      const notes = ['First time training with a coach!', 'Training for my first half marathon.', 'Can I bring a friend next time?'];
      const asking = PEOPLE.slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, input.spots - demoBooked))
        .map((p, i) => ({ id: `${cs.id}-r${i}`, sessionId: cs.id, personId: p.id, status: 'pending' as const, note: notes[i] }));
      update((s) => ({ ...s, mySessions: [cs, ...s.mySessions], incoming: [...asking, ...s.incoming] }));
      return cs;
    },
    setRole: (role) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, role } } : s)),
    book: (id) => update((s) => ({ ...s, requests: { ...s.requests, [id]: { status: 'pending', at: Date.now() } } })),
    cancelBooking: (id) =>
      update((s) => {
        const requests = { ...s.requests };
        delete requests[id];
        return { ...s, requests };
      }),
    statusOf: (id) => state.requests[id]?.status,
    respond: (rid, status) =>
      update((s) => ({ ...s, incoming: s.incoming.map((r) => (r.id === rid ? { ...r, status } : r)) })),
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
