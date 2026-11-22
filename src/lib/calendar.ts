import * as Calendar from 'expo-calendar/legacy';
import { Alert, Platform } from 'react-native';

import { startOfToday, type Session } from '@/components/session-cards';

// Add plans to the phone's own calendar (Yana, 2026-11-22). Each plan becomes a 1-hour
// event with a reminder 1 hour before. Asks for calendar permission the first time.
async function writableCalendarId() {
  if (Platform.OS === 'ios') return (await Calendar.getDefaultCalendarAsync()).id;
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return (cals.find((c) => c.allowsModifications && c.isPrimary) ?? cals.find((c) => c.allowsModifications))?.id;
}

export async function addToCalendar(plans: Session[]) {
  if (Platform.OS === 'web') {
    Alert.alert('Add to calendar', 'This works in the app on your phone.');
    return;
  }
  try {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) {
      Alert.alert('Calendar is off', 'Allow Mile Club to use your calendar in your phone’s Settings, then try again.');
      return;
    }
    const calendarId = await writableCalendarId();
    if (!calendarId) throw new Error('no calendar');
    for (const p of plans) {
      const [h, m] = (p.time || '09:00').split(':').map(Number);
      const start = new Date(startOfToday().getTime() + p.day * 86400000);
      start.setHours(h || 9, m || 0, 0, 0);
      await Calendar.createEventAsync(calendarId, {
        title: `${p.title} · Mile Club`,
        startDate: start,
        endDate: new Date(start.getTime() + 60 * 60000),
        location: p.place,
        notes: 'Added from Mile Club',
        alarms: [{ relativeOffset: -60 }],
      });
    }
    Alert.alert('Added to your calendar 📅', plans.length === 1 ? `${plans[0].title} is in your calendar.` : `${plans.length} plans are in your calendar.`);
  } catch {
    Alert.alert('Couldn’t add it', 'Something went wrong adding to your calendar. Please try again.');
  }
}
