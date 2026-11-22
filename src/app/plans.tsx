import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTop } from '@/components/page-top';
import { DAY, SessionCard, sessionLabel, sessionsThisWeek, startOfToday } from '@/components/session-cards';
import { addToCalendar } from '@/lib/calendar';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// All of this week's plans (Yana, 2026-11-22): Messages shows 3, this page shows the rest.
export default function Plans() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day?: string }>();
  const { corners = [], privateSessions = [], planJoins = [] } = useStore();
  const pick = day !== undefined && day !== '' ? Number(day) : null;
  const all = sessionsThisWeek(corners, privateSessions, planJoins).filter((s) => pick === null || s.day === pick);
  const days = [...new Set(all.map((s) => s.day))];
  const today = startOfToday().getTime();
  const heading = (d: number) => {
    const date = new Date(today + d * 86400000);
    return d === 0 ? 'TODAY' : d === 1 ? 'TOMORROW' : `${DAY[date.getDay()].toUpperCase()} ${date.getDate()}`;
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
      <PageTop title={pick === null ? 'Your plans this week' : `Plans ${heading(pick).toLowerCase()}`} />
      <Text style={styles.sub}>{all.length} {all.length === 1 ? 'plan' : 'plans'}</Text>
      {all.length ? (
        <Pressable onPress={() => addToCalendar(all)} style={({ pressed }) => [styles.cal, pressed && { opacity: 0.7 }]} accessibilityLabel="Add these plans to my calendar">
          <Feather name="calendar" size={17} color={colors.onMine} />
          <Text style={styles.calText}>Add {all.length === 1 ? 'it' : 'all'} to my calendar</Text>
        </Pressable>
      ) : null}
      {days.map((d) => (
        <View key={d}>
          <Text style={styles.label}>{heading(d)}</Text>
          {all.filter((s) => s.day === d).map((s) => (
            <View key={s.key} style={{ marginBottom: 10 }}><SessionCard s={s} big label={sessionLabel(s)} /></View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  cal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 24, backgroundColor: colors.mine, marginTop: space.md },
  calText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.onMine },
  label: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: space.xl, marginBottom: space.sm },
}));
