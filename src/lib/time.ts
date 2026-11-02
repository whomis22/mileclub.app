import type { Activity } from '@/data/types';

import { parseDate } from './format';

export function startsAt(a: Pick<Activity, 'date' | 'time'>) {
  const d = parseDate(a.date);
  const [h, m] = a.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

// "in 45 min", "in 2h 15m", "tomorrow 07:30"
export function startsIn(a: Pick<Activity, 'date' | 'time'>) {
  const mins = Math.round((startsAt(a).getTime() - Date.now()) / 60000);
  if (mins <= 0) return 'Starting now';
  if (mins < 60) return `Starts in ${mins} min`;
  if (mins < 24 * 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `Starts in ${h}h${m ? ` ${m}m` : ''}`;
  }
  return `Starts in ${Math.round(mins / 60 / 24)} days`;
}

export function hoursAgoLabel(h: number) {
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return h < 48 ? 'Yesterday' : `${Math.floor(h / 24)} days ago`;
}
