import { Storage } from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

// Settings for the Mile Club Members group chat, kept on this phone until there's a server.
export type GroupSettings = { adminsOnly: boolean; reactions: boolean; muted: boolean };

const KEY = 'mileclub-members-group-v1';
const DEFAULTS: GroupSettings = { adminsOnly: true, reactions: true, muted: false };

function read(): GroupSettings {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let current = read();
const listeners = new Set<() => void>();

export function setGroupSetting<K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) {
  current = { ...current, [key]: value };
  try {
    Storage.setItemSync(KEY, JSON.stringify(current));
  } catch {}
  listeners.forEach((l) => l());
}

export function useGroupSettings() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
