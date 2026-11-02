import { findPerson } from '@/data/people';
import type { Activity } from '@/data/types';
import type { CoachSession } from '@/data/coaches';
import { findCoach } from '@/data/coaches';
import type { Notice } from '@/state/store';

// Words and link for a notice about a join request.
export function describeNotice(n: Notice, activities: Activity[], sessions: CoachSession[]) {
  if (n.activityId) {
    const a = activities.find((x) => x.id === n.activityId);
    const host = a ? findPerson(a.hostId)?.firstName ?? 'The host' : 'The host';
    const title = a?.title ?? 'the run';
    return n.kind === 'accepted'
      ? { icon: '🎉', title: `${host} accepted you`, body: `You’re in for ${title}. Tap to see the details.`, href: `/activity/${n.activityId}` }
      : { icon: '🙌', title: `${host} can’t take you this time`, body: `${title} didn’t work out. Tap to find others to work out with.`, href: `/suggest?activityId=${n.activityId}` };
  }
  const s = sessions.find((x) => x.id === n.sessionId);
  const coach = s ? findCoach(s.coachId)?.name ?? 'The coach' : 'The coach';
  return n.kind === 'accepted'
    ? { icon: '🎉', title: `${coach} accepted your booking`, body: `${s?.title ?? 'Your session'} is confirmed.`, href: `/session/${n.sessionId}` }
    : { icon: '🙌', title: `${coach} can’t take you this time`, body: 'Tap to find other sessions.', href: '/train' };
}
