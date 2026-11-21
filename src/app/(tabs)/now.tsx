import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image, type ImageContentPosition } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Animated, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { faceFor } from '@/data/faces';
import { findPerson } from '@/data/people';
import { hasPremium } from '@/lib/swipes';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

// Explore (Yana, 2026-11-21): the ACTIVITY is the main focus, not one person's face.
// Each plan fills the whole page with its own photo (Yana sends one per activity),
// and a bubble shows everyone who's joining. Swipe up for the next plan,
// swipe sideways for the details and the full list of who's going.
const LIME = '#B9E769';

type Plan = {
  id: string; kind: string; emoji: string; title: string; when: string; place: string; km: number;
  level: string; spots: number; hostId: string; going: string[]; about: string; photo: string | number; pos?: ImageContentPosition;
  free?: string; // what makes it free for everyone, e.g. 'bring your own bike'
  venue?: string; // paid place: its members join free, everyone else joins with Premium (Yana, 2026-11-21)
};

// Sample plans until real members post their own. Photos get swapped for Yana's as they come in.
const PLANS: Plan[] = [
  { id: 'x-football', kind: 'Football', emoji: '⚽', title: 'Sunset 5-a-side', when: 'Tonight 19:00', place: 'Westerpark', km: 1.2, level: 'All levels', spots: 3, hostId: 'tom', going: ['tom', 'lucas', 'mateo', 'noah', 'daan', 'sanne', 'lotte'], about: 'Friendly 5-a-side, mixed teams, no keepers. Drinks after for whoever’s up for it.', photo: require('../../../assets/images/photos/explore-football.jpg'), free: 'park activity' },
  { id: 'x-padel', kind: 'Padel', emoji: '🎾', title: 'After-work padel', when: 'Tomorrow 18:30', place: 'Padel Club Oost', km: 2.4, level: 'Intermediate', spots: 1, hostId: 'noah', going: ['noah', 'mateo', 'amira'], about: 'Doubles, one spot left. Rackets to borrow if you don’t have one.', photo: require('../../../assets/images/photos/explore-padel.jpg'), venue: 'Padel Club Oost' },
  { id: 'x-run', kind: 'Running', emoji: '🏃', title: 'Track night intervals', when: 'Tomorrow 18:30', place: 'Olympic Stadium track', km: 0.8, level: 'All paces', spots: 6, hostId: 'sanne', going: ['sanne', 'daan', 'lotte', 'tom'], about: 'Warm-up lap, 6 x 400m in pace groups, cool-down together. Every pace has a group.', photo: require('../../../assets/images/photos/explore-running.jpg'), free: 'runs are open to everyone' },
  { id: 'x-cycling', kind: 'Cycling', emoji: '🚴', title: 'Golden hour ride', when: 'Sun 17:00', place: 'Start at Amstel', km: 1.7, level: 'Easy pace', spots: 5, hostId: 'daan', going: ['daan', 'sanne', 'mateo', 'femke'], about: '20 km along the river at a chatty pace, then drinks by the water.', photo: require('../../../assets/images/photos/explore-cycling.jpg'), pos: { left: '68%' }, free: 'bring your own bike' },
  { id: 'x-basketball', kind: 'Basketball', emoji: '🏀', title: 'Pickup ball at sunset', when: 'Sat 18:00', place: 'Museumplein courts', km: 2.0, level: 'All levels', spots: 4, hostId: 'lucas', going: ['lucas', 'daan', 'mateo', 'tom', 'noah'], about: 'Run-ins to 21, teams picked on the spot. Lights come on when it gets dark.', photo: require('../../../assets/images/photos/explore-basketball.jpg'), free: 'park activity' },
  { id: 'x-pilates', kind: 'Pilates', emoji: '🤸', title: 'Reformer Pilates', when: 'Sat 10:00', place: 'Core Studio, Oud-West', km: 1.4, level: 'All levels', spots: 2, hostId: 'yasmin', going: ['yasmin', 'amira', 'lotte', 'femke', 'sanne'], about: '50-minute reformer class, small group. Brunch next door after if you’re hungry.', photo: require('../../../assets/images/photos/explore-pilates.jpg'), venue: 'Core Studio' },
  { id: 'x-yoga', kind: 'Yoga', emoji: '🧘', title: 'Sunday park yoga', when: 'Every Sun 19:00', place: 'Sarphatipark', km: 1.9, level: 'Beginner friendly', spots: 12, hostId: 'amira', going: ['amira', 'yasmin', 'femke', 'sanne', 'lotte'], about: 'Our weekly park yoga, hosted by Mile Club. Slow flow on the grass as the sun goes down. Bring a mat, or borrow one of ours.', photo: require('../../../assets/images/photos/explore-yoga.jpg'), free: 'weekly, hosted by Mile Club' },
  { id: 'x-gym', kind: 'Gym', emoji: '🏋️', title: 'Group workout', when: 'Mon 18:00', place: 'The Gym Club, Centrum', km: 1.5, level: 'All levels', spots: 3, hostId: 'lotte', going: ['lotte', 'tom', 'lucas', 'yasmin', 'sanne', 'daan'], about: '45 minutes of circuits in teams. Hard work, loud music, high fives at the end.', photo: require('../../../assets/images/photos/explore-gym.jpg'), venue: 'The Gym Club' },
  { id: 'x-sauna', kind: 'Sauna', emoji: '🧖', title: 'Sauna after gym', when: 'Mon 19:15', place: 'The Gym Club, Centrum', km: 1.5, level: 'Everyone', spots: 4, hostId: 'femke', going: ['femke', 'lotte', 'tom', 'lucas', 'yasmin'], about: 'Straight from the group workout into the sauna. 30 minutes of heat, cold shower, good chats.', photo: require('../../../assets/images/photos/explore-sauna.jpg'), venue: 'The Gym Club' },
];

function nameOf(id: string) {
  return findPerson(id)?.firstName ?? id[0]!.toUpperCase() + id.slice(1);
}

// Overlapping round faces, like a group chat bubble.
function Faces({ ids, me, size = 30 }: { ids: string[]; me?: { name: string; uri?: string }; size?: number }) {
  const shown = ids.slice(0, me ? 4 : 5);
  return (
    <View style={{ flexDirection: 'row' }}>
      {me ? (
        <View style={[styles.faceRing, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
          <Avatar name={me.name} uri={me.uri} size={size} />
        </View>
      ) : null}
      {shown.map((id, i) => (
        <View key={id} style={[styles.faceRing, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }, (i > 0 || me) && { marginLeft: -size * 0.32 }]}>
          <Avatar name={nameOf(id)} color={findPerson(id)?.color} uri={faceFor(id)?.photo} size={size} />
        </View>
      ))}
    </View>
  );
}

function PlanPage({
  plan, w, h, joined, me, onJoin,
}: {
  plan: Plan; w: number; h: number; joined: boolean; me: { name: string; uri?: string };
  onJoin: () => void;
}) {
  useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const count = plan.going.length + (joined ? 1 : 0);
  const left = Math.max(0, plan.spots - (joined ? 1 : 0));
  const firsts = (joined ? ['You', ...plan.going.slice(0, 1).map(nameOf)] : plan.going.slice(0, 2).map(nameOf)).join(', ');
  const rest = count - 2;
  const host = findPerson(plan.hostId);
  const hostFace = faceFor(plan.hostId);
  const people = joined ? ['me', ...plan.going] : plan.going;

  const joinBtn = (
    <Pressable onPress={onJoin} style={({ pressed }) => [styles.join, joined && styles.joinOn, pressed && { transform: [{ scale: 0.97 }] }]} accessibilityLabel={joined ? 'Leave this plan' : 'Join this plan'}>
      {joined ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
      <Text style={[styles.joinText, joined && { color: '#FFFFFF' }]}>{joined ? 'You’re in' : 'Join'}</Text>
    </Pressable>
  );

  return (
    <View style={{ width: w, height: h }}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}>
        {/* Page 1: the activity, full page */}
        <View style={{ width: w, height: h }}>
          <Image source={typeof plan.photo === 'string' ? { uri: plan.photo } : plan.photo} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={plan.pos ?? 'center'} transition={250} cachePolicy="memory-disk" recyclingKey={plan.id} />
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.92)']} locations={[0, 0.22, 0.42, 0.86]} style={StyleSheet.absoluteFill} />

          {/* who's going, at the top */}
          <Pressable onPress={() => scroller.current?.scrollTo({ x: w, animated: true })} style={[styles.goingBubble, { top: insets.top + 58 }]} accessibilityLabel={`${count} people going. See who`}>
            <Faces ids={plan.going} me={joined ? me : undefined} size={30} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.goingTitle} numberOfLines={1}>{firsts}{rest > 0 ? ` + ${rest}` : ''}</Text>
              <Text style={styles.goingSub}>{count} going · {left > 0 ? `${left} spot${left === 1 ? '' : 's'} left` : 'Full'}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <View style={styles.info}>
            <View style={styles.kind}>
              <Text style={styles.kindText}>{plan.emoji}  {plan.kind.toUpperCase()}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{plan.title.toUpperCase()}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}><Feather name="clock" size={13} color={LIME} /><Text style={styles.statText}>{plan.when}</Text></View>
              <View style={styles.stat}><Feather name="map-pin" size={13} color={LIME} /><Text style={styles.statText}>{plan.place} · {plan.km.toFixed(1)} km</Text></View>
              <View style={styles.stat}><Feather name="bar-chart-2" size={13} color={LIME} /><Text style={styles.statText}>{plan.level}</Text></View>
            </View>
            <Pressable style={styles.host} onPress={() => router.push(`/person/${plan.hostId}`)}>
              <Avatar name={nameOf(plan.hostId)} color={host?.color} uri={hostFace?.photo} size={32} />
              <Text style={styles.hostText} numberOfLines={1}>
                Hosted by <Text style={{ fontFamily: fonts.sansBold }}>{nameOf(plan.hostId)}</Text>{hostFace?.work ? ` · ${hostFace.work}` : ''}
              </Text>
            </Pressable>
            {plan.venue ? (
              <View style={styles.access}>
                <Feather name="star" size={13} color={LIME} />
                <Text style={styles.accessText} numberOfLines={2}>{plan.venue} members join free · Not a member? Join with Premium</Text>
              </View>
            ) : (
              <View style={styles.access}>
                <Feather name="check-circle" size={13} color={LIME} />
                <Text style={styles.accessText}>Free for everyone · {plan.free ?? 'open to all'}</Text>
              </View>
            )}
            <View style={styles.buttons}>
              {joinBtn}
              <Pressable style={styles.round} onPress={() => router.push(`/chat/${plan.hostId}` as Href)} accessibilityLabel={`Message ${nameOf(plan.hostId)}`}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.round} onPress={() => scroller.current?.scrollTo({ x: w, animated: true })} accessibilityLabel="Plan details">
                <Feather name="info" size={21} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Page 2: the details and everyone going */}
        <ScrollView style={{ width: w, height: h, backgroundColor: colors.bg }} contentContainerStyle={[styles.detail, { paddingTop: insets.top + 64 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.dKind}>{plan.emoji} {plan.kind}</Text>
          <Text style={styles.dTitle}>{plan.title}</Text>
          <Text style={styles.dSub}>{plan.when} · {plan.place} · {plan.level}</Text>
          <Text style={styles.dBody}>{plan.about}</Text>
          {plan.venue ? (
            <View style={styles.dAccess}>
              <Feather name="star" size={16} color={colors.ink} />
              <Text style={styles.dAccessText}>
                This one costs money at {plan.venue}. If you’re a member there, you join free. If not, Mile Club Premium gets you in free.
              </Text>
            </View>
          ) : null}
          <View style={{ marginTop: 18, flexDirection: 'row' }}>{joinBtn}</View>

          <Text style={styles.dLabel}>Who’s going · {count}</Text>
          {people.map((id) => {
            const isMe = id === 'me';
            const f = isMe ? undefined : faceFor(id);
            return (
              <Pressable key={id} style={styles.person} onPress={isMe ? undefined : () => router.push(`/person/${id}`)} disabled={isMe}>
                <Avatar name={isMe ? me.name : nameOf(id)} uri={isMe ? me.uri : f?.photo} color={isMe ? undefined : findPerson(id)?.color} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pName}>{isMe ? 'You' : nameOf(id)}{id === plan.hostId ? '  ·  Host' : ''}</Text>
                  <Text style={styles.pWork} numberOfLines={1}>{isMe ? 'See you there' : f?.work ?? 'Mile Club member'}</Text>
                </View>
                {isMe ? null : <Feather name="chevron-right" size={18} color={colors.muted} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={[styles.dashes, { top: insets.top + 48 }]} pointerEvents="none">
        {[0, 1].map((i) => <View key={i} style={[styles.dash, page === i && styles.dashOn, page === 1 && { backgroundColor: i === 1 ? colors.ink : colors.edge }]} />)}
      </View>
    </View>
  );
}

export default function Explore() {
  useTheme();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, blocked } = useStore();
  const [h, setH] = useState(0);
  const [what, setWhat] = useState('any');
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [asking, setAsking] = useState<Plan | null>(null); // paid plan: are you a member there?
  const [memberOf, setMemberOf] = useState<string[]>([]); // venues the user said they're a member of
  const [joined, setJoined] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [fade] = useState(() => new Animated.Value(0));
  const list = useRef<FlatList<Plan>>(null);
  if (!profile) return <Redirect href="/welcome" />;

  const me = { name: profile.firstName, uri: profile.photoUri };
  const kinds = [...new Set(PLANS.map((p) => p.kind))];
  const items = PLANS.filter((p) => !blocked.includes(p.hostId) && (what === 'any' || p.kind === what));

  function say(text: string) {
    setToast(text);
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function toggleJoin(p: Plan) {
    if (joined.includes(p.id)) {
      Haptics.selectionAsync().catch(() => {});
      setJoined((x) => x.filter((id) => id !== p.id));
      say('You left this plan');
      return;
    }
    if (p.venue && !memberOf.includes(p.venue) && !hasPremium()) {
      setAsking(p);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setJoined((x) => [...x, p.id]);
    say(`You’re in. See you ${p.when.replace(/^(Tonight|Tomorrow)/, (m) => m.toLowerCase())} 💪`);
  }

  return (
    <View style={styles.screen} onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}>
      {focused ? <StatusBar style="light" /> : null}
      {h > 0 ? (
        <FlatList
          ref={list}
          data={items}
          keyExtractor={(p) => p.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={h}
          snapToAlignment="start"
          getItemLayout={(_, i) => ({ length: h, offset: h * i, index: i })}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          renderItem={({ item }) => (
            <PlanPage
              plan={item}
              w={width}
              h={h}
              me={me}
              joined={joined.includes(item.id)}
              onJoin={() => toggleJoin(item)}
            />
          )}
        />
      ) : null}

      {/* top bar over the photos */}
      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable style={styles.topPill} onPress={() => setPicking(true)}>
          <Text style={styles.topPillText}>{what === 'any' ? 'All plans' : what}</Text>
          <Feather name="chevron-down" size={14} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.topRound} onPress={() => setStarting(true)} accessibilityLabel="Start a plan">
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 120, opacity: fade }]}>
        <Text style={styles.toastText}>{toast}</Text>
      </Animated.View>

      <Modal visible={!!asking} transparent animationType="fade" onRequestClose={() => setAsking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setAsking(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Are you a member of {asking?.venue}?</Text>
            <Text style={styles.startSub}>{asking?.kind} here costs money. Members of {asking?.venue} join free. Not a member? Premium gets you into the {asking?.kind.toLowerCase()} for free.</Text>
            <View style={{ height: 16 }} />
            <Pressable
              style={styles.start}
              onPress={() => {
                const p = asking!;
                setMemberOf((x) => [...x, p.venue!]);
                setAsking(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setJoined((x) => [...x, p.id]);
                say(`You’re in. See you ${p.when.replace(/^(Tonight|Tomorrow)/, (m) => m.toLowerCase())} 💪`);
              }}>
              <View style={styles.startIcon}><Feather name="check" size={20} color={colors.onMine} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.startTitle}>Yes, I’m a member</Text>
                <Text style={styles.startSub}>Join free</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.start}
              onPress={() => {
                setAsking(null);
                router.push('/premium' as Href);
              }}>
              <View style={styles.startIcon}><Feather name="star" size={20} color={colors.onMine} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.startTitle}>Join with Premium</Text>
                <Text style={styles.startSub}>Padel, gym, sauna, pilates and more, free</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={starting} transparent animationType="fade" onRequestClose={() => setStarting(false)}>
        <Pressable style={styles.backdrop} onPress={() => setStarting(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Start something</Text>
            {[
              { icon: 'globe' as const, title: 'Open plan', sub: 'Shows on Explore. Anyone nearby can ask to join.', href: '/create-activity' },
              { icon: 'lock' as const, title: 'Private session', sub: 'Invite friends only. With 4+ people you get a group chat.', href: '/private-session' },
            ].map((o) => (
              <Pressable
                key={o.title}
                style={styles.start}
                onPress={() => {
                  setStarting(false);
                  router.push(o.href as Href);
                }}>
                <View style={styles.startIcon}><Feather name={o.icon} size={20} color={colors.onMine} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.startTitle}>{o.title}</Text>
                  <Text style={styles.startSub}>{o.sub}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>What do you feel like doing?</Text>
            <View style={styles.options}>
              {['any', ...kinds].map((k) => (
                <Pressable
                  key={k}
                  style={[styles.option, what === k && styles.optionOn]}
                  onPress={() => {
                    setWhat(k);
                    setPicking(false);
                    list.current?.scrollToOffset({ offset: 0, animated: false });
                  }}>
                  <Text style={[styles.optionText, what === k && { color: '#000' }]}>
                    {k === 'any' ? 'All plans' : `${PLANS.find((p) => p.kind === k)!.emoji} ${k}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    top: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)' },
    topPillText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#FFFFFF' },
    topRound: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center' },
    dashes: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dash: { width: 16, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
    dashOn: { width: 26, backgroundColor: '#FFFFFF' },
    goingBubble: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 30, backgroundColor: 'rgba(20,20,20,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
    faceRing: { backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#141414' },
    goingTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: '#FFFFFF' },
    goingSub: { fontFamily: fonts.sansSemi, fontSize: 12, color: LIME, marginTop: 1 },
    info: { position: 'absolute', left: 20, right: 20, bottom: 22 },
    kind: { alignSelf: 'flex-start', backgroundColor: LIME, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
    kindText: { fontFamily: fonts.sansBold, fontSize: 11.5, letterSpacing: 1.2, color: '#000' },
    title: { fontFamily: fonts.logo, fontSize: 46, lineHeight: 48, color: '#FFFFFF', letterSpacing: -0.5, marginTop: 10 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 10 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statText: { fontFamily: fonts.sansSemi, fontSize: 13.5, color: '#FFFFFF' },
    host: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    hostText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(255,255,255,0.9)' },
    access: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    accessText: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 12.5, color: 'rgba(255,255,255,0.92)' },
    dAccess: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 14 },
    dAccessText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.ink },
    buttons: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
    join: { flex: 1, flexDirection: 'row', gap: 6, height: 54, borderRadius: 27, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
    joinOn: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: LIME },
    joinText: { fontFamily: fonts.sansBold, fontSize: 17, color: '#000', letterSpacing: 0.2 },
    round: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    detail: { paddingHorizontal: 20, paddingBottom: 40 },
    dKind: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
    dTitle: { fontFamily: fonts.sansBold, fontSize: 28, color: colors.ink, marginTop: 4, letterSpacing: -0.4 },
    dSub: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink, marginTop: 6 },
    dBody: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: colors.muted, marginTop: 10 },
    dLabel: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginTop: 28, marginBottom: 6 },
    person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
    pName: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
    pWork: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
    toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
    toastText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#FFFFFF' },
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
    sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, marginBottom: 14 },
    start: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 10 },
    startIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
    startTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
    startSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.card },
    optionOn: { backgroundColor: LIME },
    optionText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  }),
);
