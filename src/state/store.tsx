import { Storage } from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { sampleActivities } from '@/data/activities';
import { sampleSessions, type CoachSession } from '@/data/coaches';
import type { Role } from '@/data/roles';
import { PEOPLE } from '@/data/people';
import type { Activity, Profile } from '@/data/types';
import { canSeeRun } from '@/lib/meet';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

// Someone asking to book one of the user's own coach sessions.
export type IncomingRequest = { id: string; sessionId: string; personId: string; status: RequestStatus; note?: string };

// Someone asking to join one of the user's own group runs.
export type RunRequest = { id: string; activityId: string; personId: string; status: RequestStatus; at: number };

// A photo the user posted on Explore (mock: the picture stays on this phone only).
export type MyPost = { id: string; uri?: string; caption: string; at: number }; // no uri = text-only post

// A comment under any Explore post. authorId is 'me' or a sample person id.
export type PostComment = { id: string; authorId: string; text: string; at: number };

// A call the user made, shown as a line in the chat with that person.
export type CallLog = { id: string; personId: string; video: boolean; secs: number; answered: boolean; at: number };

// Demo: sample coaches and hosts answer a request after this long.
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
  // Group runs: swiping to join sends a request; the user takes part only once the host accepts.
  runRequests: Record<string, { status: RequestStatus; at: number }>; // the user's requests, by activity id
  runIncoming: RunRequest[]; // people asking to join runs the user hosts
  following: string[]; // people and coaches the user follows (private: only the user sees this list)
  myPosts: MyPost[]; // photos the user shared on Explore, newest first
  comments: Record<string, PostComment[]>; // the user's comments, by post id
  calls: CallLog[]; // call history, shown in chats
  admin: boolean; // Mile Club admin (mock switch in the side menu): can call anyone
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
  runStatus: (activityId: string) => RequestStatus | undefined;
  cancelRunRequest: (activityId: string) => void;
  respondRun: (requestId: string, status: 'accepted' | 'declined') => void;
  toggleFollow: (id: string) => void;
  setAdmin: (on: boolean) => void;
  logCall: (c: Omit<CallLog, 'id' | 'at'>) => void;
  deleteCall: (id: string) => void;
  addPost: (uri: string | undefined, caption: string) => void;
  deletePost: (id: string) => void;
  addComment: (postId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  cancelBooking: (sessionId: string) => void;
  block: (personId: string) => void;
  reset: () => void;
};

const KEY = 'mileclub-state-v1';
const empty: State = { profile: null, myActivities: [], joined: [], blocked: [], skipped: [], kudos: [], mySessions: [], booked: [], requests: {}, incoming: [], runRequests: {}, runIncoming: [], following: [], myPosts: [], comments: {}, calls: [], admin: false };

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
    .filter((a) => !state.blocked.includes(a.hostId) && canSeeRun(state.profile, a))
    .map((a) => {
      const accepted = state.runIncoming
        .filter((r) => r.activityId === a.id && r.status === 'accepted' && !a.participants.includes(r.personId))
        .map((r) => r.personId);
      const me = state.joined.includes(a.id) && !a.participants.includes('me') ? ['me'] : [];
      return accepted.length || me.length ? { ...a, participants: [...a.participants, ...accepted, ...me] } : a;
    });

  // Demo: sample coaches accept pending requests after a short wait.
  useEffect(() => {
    const t = setInterval(() => {
      setState((prev) => {
        const due = Object.entries(prev.requests).filter(
          ([, r]) => r.status === 'pending' && Date.now() - r.at > DEMO_REPLY_MS,
        );
        const runDue = Object.entries(prev.runRequests ?? {}).filter(
          ([, r]) => r.status === 'pending' && Date.now() - r.at > DEMO_REPLY_MS,
        );
        if (!due.length && !runDue.length) return prev;
        const requests = { ...prev.requests };
        for (const [id, r] of due) requests[id] = { ...r, status: 'accepted' };
        // Demo: hosts of sample runs accept, and the run moves into the user's plans.
        const runRequests = { ...prev.runRequests };
        const joined = [...prev.joined];
        for (const [id, r] of runDue) {
          runRequests[id] = { ...r, status: 'accepted' };
          if (!joined.includes(id)) joined.push(id);
        }
        const next = { ...prev, requests, runRequests, joined };
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
      // Demo: a couple of people ask to join straight away, so there are requests to accept or decline.
      const asking: RunRequest[] = PEOPLE.filter((p) => p.activities.includes(input.type))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, Math.max(0, input.groupSize - 1)))
        .map((p, i) => ({ id: `${activity.id}-r${i}`, activityId: activity.id, personId: p.id, status: 'pending', at: Date.now() }));
      update((s) => ({ ...s, myActivities: [activity, ...s.myActivities], runIncoming: [...asking, ...s.runIncoming] }));
      return activity;
    },
    // Join button on a run: ask to join, cancel a waiting request, or leave once accepted.
    toggleJoin: (id) =>
      update((s) => {
        if (s.joined.includes(id)) {
          const runRequests = { ...s.runRequests };
          delete runRequests[id];
          return { ...s, joined: s.joined.filter((x) => x !== id), runRequests };
        }
        const runRequests = { ...s.runRequests };
        if (runRequests[id]?.status === 'pending') delete runRequests[id];
        else runRequests[id] = { status: 'pending', at: Date.now() };
        return { ...s, runRequests };
      }),
    // Swipe to join: sends a request to the host.
    join: (id) =>
      update((s) =>
        s.joined.includes(id) || s.runRequests[id]
          ? s
          : { ...s, runRequests: { ...s.runRequests, [id]: { status: 'pending', at: Date.now() } } },
      ),
    runStatus: (id) => (state.joined.includes(id) ? 'accepted' : state.runRequests[id]?.status),
    cancelRunRequest: (id) =>
      update((s) => {
        const runRequests = { ...s.runRequests };
        delete runRequests[id];
        return { ...s, runRequests, joined: s.joined.filter((x) => x !== id) };
      }),
    respondRun: (rid, status) =>
      update((s) => ({ ...s, runIncoming: s.runIncoming.map((r) => (r.id === rid ? { ...r, status } : r)) })),
    skip: (id) => update((s) => (s.skipped.includes(id) ? s : { ...s, skipped: [...s.skipped, id] })),
    clearSkipped: () => update((s) => ({ ...s, skipped: [] })),
    toggleKudos: (postId) =>
      update((s) => ({
        ...s,
        kudos: s.kudos.includes(postId) ? s.kudos.filter((x) => x !== postId) : [...s.kudos, postId],
      })),
    toggleFollow: (id) =>
      update((s) => ({ ...s, following: s.following.includes(id) ? s.following.filter((x) => x !== id) : [...s.following, id] })),
    setAdmin: (on) => update((s) => ({ ...s, admin: on })),
    deleteCall: (id) => update((s) => ({ ...s, calls: (s.calls ?? []).filter((c) => c.id !== id) })),
    logCall: (c) => update((s) => ({ ...s, calls: [...(s.calls ?? []), { ...c, id: `call${Date.now()}`, at: Date.now() }] })),
    addPost: (uri, caption) =>
      update((s) => ({ ...s, myPosts: [{ id: `mp${Date.now()}`, uri, caption: caption.trim(), at: Date.now() }, ...s.myPosts] })),
    deletePost: (id) => update((s) => ({ ...s, myPosts: s.myPosts.filter((p) => p.id !== id) })),
    addComment: (postId, text) =>
      update((s) => ({
        ...s,
        comments: {
          ...s.comments,
          [postId]: [...(s.comments[postId] ?? []), { id: `c${Date.now()}`, authorId: 'me', text: text.trim(), at: Date.now() }],
        },
      })),
    deleteComment: (postId, cid) =>
      update((s) => ({ ...s, comments: { ...s.comments, [postId]: (s.comments[postId] ?? []).filter((c) => c.id !== cid) } })),
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
