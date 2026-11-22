import { useEffect, useState } from 'react';
import { findThread, type ChatThread } from '@/data/messages';

// A call that is ringing right now, shown as the banner at the top of the app
// (layout #33, Yana 2026-11-22). Demo only: real calls need a calling service.
// A one-to-one call has a person id; a group call has the group chat's id.
export type Ring = { id: string; video?: boolean; group?: boolean; at: number };

let current: Ring | null = null;
const listeners = new Set<(r: Ring | null) => void>();

export function ring(r: Omit<Ring, 'at'>) {
  current = { ...r, at: Date.now() };
  listeners.forEach((l) => l(current));
}

export function stopRinging() {
  current = null;
  listeners.forEach((l) => l(null));
}

export function useRinging() {
  const [r, setR] = useState<Ring | null>(current);
  useEffect(() => {
    listeners.add(setR);
    return () => {
      listeners.delete(setR);
    };
  }, []);
  return r;
}

// Where to go for a ringing call: the full incoming screen, or straight into the call.
export function callHref(r: Pick<Ring, 'id' | 'video' | 'group'>, answer: boolean) {
  const base = r.group ? `/group-call/${r.id}` : `/call/${r.id}`;
  const q = [answer ? 'answer=1' : 'incoming=1', r.video ? 'video=1' : ''].filter(Boolean).join('&');
  return `${base}?${q}`;
}

// Demo group for "Try an incoming group call" in Settings.
export const DEMO_GROUP_CALL = 'demo-corner';
const DEMO_GROUP = { id: DEMO_GROUP_CALL, name: 'Sanne’s Corner', members: ['sanne', 'amira', 'noah'] };

// The group chat a group call belongs to (sample chats, session Corners, or the demo).
export function findCallGroup(id: string, corners: ChatThread[] | undefined): { id: string; name: string; members?: string[] } | undefined {
  if (id === DEMO_GROUP_CALL) return DEMO_GROUP;
  return findThread(id) ?? (corners ?? []).find((c) => c.id === id);
}
