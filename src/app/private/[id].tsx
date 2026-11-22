import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
import { faceFor } from '@/data/faces';
import { ACTIVITIES } from '@/data/options';
import { findPerson } from '@/data/people';
import { friendlyDate } from '@/lib/format';
import { CORNER_MIN, useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// One private session: who's invited, who said yes, and the group chat once everyone's in.
export default function PrivateSessionPage() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, privateSessions, cancelPrivate } = useStore();
  const ps = privateSessions?.find((p) => p.id === id);
  if (!ps) return <View style={styles.root} />;

  const act = ACTIVITIES.find((a) => a.id === ps.type);
  const yes = ps.invited.filter((p) => ps.answers[p] === 'accepted').length;
  const total = ps.invited.length + 1;
  const host = profile?.firstName ?? 'Your';

  function cancel() {
    Alert.alert('Cancel this session?', 'Everyone you invited will be told it’s off.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: () => { cancelPrivate(ps!.id); router.back(); } },
    ]);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
        <View style={styles.top}>
          <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/now' as Href))} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.lock}>
            <Feather name="lock" size={12} color={colors.ink} />
            <Text style={styles.lockText}>Private · invite only</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.kind}>{act?.emoji} {act?.label}</Text>
        <Text style={styles.title}>{ps.title}</Text>
        <Text style={styles.sub}>{friendlyDate(ps.date)} {ps.time} · {ps.place}</Text>

        {ps.chatId ? (
          <Pressable style={styles.corner} onPress={() => router.push(`/chat/${ps.chatId}` as Href)}>
            <View style={styles.cornerIcon}><Feather name="users" size={20} color={colors.onMine} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cornerTitle}>{host}’s Corner is open</Text>
              <Text style={styles.cornerSub}>Everyone’s in. Plan and update each other here.</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.wait}>
            <Feather name="clock" size={16} color={colors.muted} />
            <Text style={styles.waitText}>
              {total >= CORNER_MIN
                ? `${yes} of ${ps.invited.length} said yes. ${host}’s Corner (your group chat) opens when everyone’s in.`
                : `${yes} of ${ps.invited.length} said yes. Group chats open for sessions with ${CORNER_MIN}+ people.`}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Who’s coming · {yes + 1}/{total}</Text>
        <View style={styles.person}>
          <Avatar name={host} uri={profile?.photoUri} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pName}>You</Text>
            <Text style={styles.pSub}>Host</Text>
          </View>
          <Text style={[styles.status, styles.statusYes]}>Going</Text>
        </View>
        {ps.invited.map((pid) => {
          const p = findPerson(pid);
          const a = ps.answers[pid];
          return (
            <View key={pid} style={styles.person}>
              <Avatar name={p?.firstName ?? pid} color={p?.color} uri={faceFor(pid)?.photo} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p?.firstName ?? pid}</Text>
                <Text style={styles.pSub} numberOfLines={1}>{faceFor(pid)?.work ?? ''}</Text>
              </View>
              <Text style={[styles.status, a === 'accepted' ? styles.statusYes : a === 'declined' ? styles.statusNo : null]}>
                {a === 'accepted' ? 'Going' : a === 'declined' ? 'Can’t make it' : 'Invited'}
              </Text>
            </View>
          );
        })}

        <View style={{ height: 28 }} />
        <Button title="Cancel session" variant="soft" onPress={cancel} />
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  lockText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink },
  kind: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
  title: { fontFamily: fonts.sansBold, fontSize: 28, color: colors.ink, marginTop: 4, letterSpacing: -0.4 },
  sub: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink, marginTop: 6 },
  corner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginTop: 20, borderWidth: 1.5, borderColor: colors.mine },
  cornerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
  cornerTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  cornerSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  wait: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginTop: 20 },
  waitText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.ink },
  label: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginTop: 28, marginBottom: 4 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  pName: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  pSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  status: { fontFamily: fonts.sansSemi, fontSize: 12.5, color: colors.muted, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
  statusYes: { backgroundColor: colors.mine, color: colors.onMine },
  statusNo: { color: colors.danger },
}));
