import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { Storage } from '@/lib/kv';

// The vibration when the app opens (Yana, 2026-11-21): pick one on Settings → Opening vibration.
// Each step is [ms after start, kind]. The app opens 1600ms after start.
type Kind = 'soft' | 'light' | 'medium' | 'heavy' | 'rigid' | 'success';
type Step = [number, Kind];

export const PATTERNS: { id: string; name: string; feel: string; steps: Step[] }[] = [
  { id: 'heartbeat', name: 'Soft heartbeat', feel: 'Two gentle double-beats, then a light tap (the one you have now)', steps: [[80, 'soft'], [240, 'light'], [800, 'soft'], [960, 'light'], [1600, 'light']] },
  { id: 'strong', name: 'Strong heartbeat', feel: 'The same heartbeat, but you really feel it', steps: [[80, 'medium'], [240, 'heavy'], [800, 'medium'], [960, 'heavy'], [1600, 'medium']] },
  { id: 'firm', name: 'Single firm tap', feel: 'One solid tap as the app opens. Clean and simple', steps: [[1600, 'heavy']] },
  { id: 'double', name: 'Quick double tap', feel: 'Tap-tap, like a nudge saying “let’s go”', steps: [[1450, 'rigid'], [1600, 'rigid']] },
  { id: 'rising', name: 'Rising buzz', feel: 'Starts soft and builds up, like a warm-up', steps: [[200, 'soft'], [450, 'light'], [700, 'light'], [950, 'medium'], [1200, 'medium'], [1450, 'heavy'], [1600, 'heavy']] },
  { id: 'success', name: 'Success ping', feel: 'The little “done!” buzz your phone uses for good news', steps: [[1600, 'success']] },
  { id: 'none', name: 'No vibration', feel: 'Opens quietly', steps: [] },
];

const KEY = 'mileclub-open-haptic-v1';

export function getOpenPattern() {
  let id = 'heartbeat';
  try {
    id = Storage.getItemSync(KEY) ?? id;
  } catch {}
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]!;
}

export function setOpenPattern(id: string) {
  try {
    Storage.setItemSync(KEY, id);
  } catch {}
}

function buzz(kind: Kind) {
  const S = Haptics.ImpactFeedbackStyle;
  const p =
    kind === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync({ soft: S.Soft, light: S.Light, medium: S.Medium, heavy: S.Heavy, rigid: S.Rigid }[kind]);
  p.catch(() => {});
}

// Plays a pattern; returns a function that stops it. `shift` moves it earlier (for previews).
export function playPattern(steps: Step[], shift = 0) {
  if (Platform.OS === 'web') return () => {};
  const timers = steps.map(([at, kind]) => setTimeout(() => buzz(kind), Math.max(0, at - shift)));
  return () => timers.forEach(clearTimeout);
}
