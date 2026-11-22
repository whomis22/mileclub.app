import Feather from '@expo/vector-icons/Feather';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { faceFor } from '@/data/faces';
import { findPerson } from '@/data/people';
import { findCallGroup, stopRinging } from '@/lib/ringing';
import { useStore } from '@/state/store';
import { fonts } from '@/theme';

const LIME = '#B9E769';
const RED = '#FF5A5F';
const TILE = '#141414';
const DOCK = '#1C1C1E';

// Group calls for a group chat, always dark (Yana, 2026-11-22):
// - someone starts a call in the group: layout #35 (purple glow, everyone's faces, Join call)
// - in the call: layout #56 (tiles, the person talking glows lime, floating button bar)
// Video calls use the same tiles, with everyone's video inside them.
// Demo only: the others are pretend until Mile Club has a calling service.
export default function GroupCall() {
  const { id, video, incoming, answer } = useLocalSearchParams<{ id: string; video?: string; incoming?: string; answer?: string }>();
  const { corners, profile } = useStore();
  const group = findCallGroup(id, corners);
  const name = group?.name ?? 'Group call';
  const members = (group?.members?.length ? group.members : ['sanne', 'amira', 'noah']).filter((m) => findPerson(m));
  const host = findPerson(members[0])?.firstName ?? 'Someone';

  const [phase, setPhase] = useState<'ringing' | 'live'>(incoming === '1' && answer !== '1' ? 'ringing' : 'live');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [videoOn, setVideoOn] = useState(video === '1');
  const [front, setFront] = useState(true);
  const [talking, setTalking] = useState(0);
  // When you start the call, the others pick up one by one.
  const [joined, setJoined] = useState(incoming === '1' ? members.length : 0);
  const [perm, requestPerm] = useCameraPermissions();
  const ringtone = useAudioPlayer(require('../../../assets/sounds/ringtone.m4a'));
  const ringStatus = useAudioPlayerStatus(ringtone);

  useEffect(() => stopRinging(), []);
  useEffect(() => {
    if (videoOn && perm && !perm.granted && perm.canAskAgain) requestPerm();
  }, [videoOn, perm, requestPerm]);

  // Ringing (#35): ringtone + buzz until you join or say not now.
  useEffect(() => {
    if (phase !== 'ringing') return;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    ringtone.seekTo(0);
    ringtone.play();
    if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 800, 400], true);
    return () => {
      ringtone.pause();
      Vibration.cancel();
    };
  }, [phase, ringtone]);
  useEffect(() => {
    if (phase === 'ringing' && ringStatus.didJustFinish) {
      ringtone.seekTo(0);
      ringtone.play();
    }
  }, [ringStatus.didJustFinish, phase, ringtone]);

  // In the call: timer, people joining, and the "talking" glow moving around.
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    const talk = setInterval(() => setTalking((x) => (x + 1) % Math.max(1, members.length)), 3200);
    return () => {
      clearInterval(t);
      clearInterval(talk);
    };
  }, [phase, members.length]);
  useEffect(() => {
    if (phase !== 'live' || joined >= members.length) return;
    const t = setTimeout(() => setJoined((j) => j + 1), 1400);
    return () => clearTimeout(t);
  }, [phase, joined, members.length]);

  function join() {
    setPhase('live');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  function leave() {
    Vibration.cancel();
    if (router.canGoBack()) router.back();
    else router.replace('/' as Href);
  }

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const others = members.length > 1 ? `${host}, ${findPerson(members[1])?.firstName}${members.length > 2 ? ` and ${members.length - 2} other${members.length > 3 ? 's' : ''}` : ''}` : host;

  // ---------- #35: a group call is ringing ----------
  if (phase === 'ringing') {
    return (
      <View style={s.screen}>
        <StatusBar style="light" />
        <LinearGradient colors={['rgba(108,76,241,0.75)', 'rgba(108,76,241,0.15)', '#000']} locations={[0, 0.4, 0.75]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
          <View style={s.ringTop}>
            <View style={s.stack}>
              {members.slice(0, 4).map((m, k) => (
                <View key={m} style={[s.stackRing, k > 0 && { marginLeft: -22 }]}>
                  <Face id={m} size={66} />
                </View>
              ))}
            </View>
            <Text style={s.ringLabel}>{videoOn ? 'Group video call' : 'Group call'}</Text>
            <Text style={s.ringName} numberOfLines={2} adjustsFontSizeToFit>{name}</Text>
            <Text style={s.ringSub}>{others} {members.length > 1 ? 'are' : 'is'} in</Text>
          </View>
          <View style={s.ringBottom}>
            <Pressable style={({ pressed }) => [s.pill, { backgroundColor: LIME }, pressed && { opacity: 0.8 }]} onPress={join}>
              <Feather name={videoOn ? 'video' : 'users'} size={20} color="#000" />
              <Text style={[s.pillText, { color: '#000' }]}>Join call</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.pill, { backgroundColor: 'rgba(255,255,255,0.14)' }, pressed && { opacity: 0.8 }]} onPress={leave}>
              <Text style={[s.pillText, { color: '#fff' }]}>Not now</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- #56: in the group call (voice and video) ----------
  const people = [...members.map((m, k) => ({ id: m, label: findPerson(m)?.firstName ?? m, here: k < joined })), { id: 'me', label: 'You', here: true }];
  const few = people.length <= 4;
  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <View style={s.head}>
          <Pressable onPress={leave} hitSlop={10} accessibilityLabel="Minimise" style={s.headBtn}>
            <Feather name="chevron-down" size={26} color="#fff" />
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{name}</Text>
            <Text style={s.sub}>{people.filter((p) => p.here).length} {people.filter((p) => p.here).length === 1 ? 'person' : 'people'} · {clock}{muted ? ' · muted' : ''}</Text>
          </View>
          <View style={s.headBtn} />
        </View>

        <ScrollView contentContainerStyle={[s.grid, few && { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
          {people.map((p, k) => {
            const isTalking = p.here && p.id !== 'me' && k === talking;
            const showVideo = videoOn && p.here;
            return (
              <View key={p.id} style={[s.tile, few ? s.tileBig : s.tileSmall, isTalking && s.tileTalking, !p.here && { opacity: 0.5 }]}>
                {showVideo ? (
                  p.id === 'me' ? (
                    perm?.granted ? (
                      <CameraView style={StyleSheet.absoluteFill} facing={front ? 'front' : 'back'} mirror={front} />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, s.center]}>
                        <Face id="me" size={70} uri={profile?.photoUri} />
                      </View>
                    )
                  ) : (
                    <Image source={{ uri: faceFor(p.id)?.photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  )
                ) : (
                  <View style={[StyleSheet.absoluteFill, s.center]}>
                    <Face id={p.id} size={few ? 80 : 60} uri={p.id === 'me' ? profile?.photoUri : undefined} />
                  </View>
                )}
                <View style={[s.tag, !showVideo && s.tagPlain]}>
                  {p.id === 'me' && muted ? <Feather name="mic-off" size={12} color="#fff" /> : null}
                  <Text style={s.tagText}>{p.here ? p.label : `${p.label} · ringing…`}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={s.dock}>
          {videoOn ? <DockBtn icon="refresh-cw" label="Flip camera" onPress={() => setFront(!front)} /> : null}
          <DockBtn icon={muted ? 'mic-off' : 'mic'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(!muted)} />
          <DockBtn icon={speaker ? 'volume-2' : 'volume-x'} label="Speaker" onPress={() => setSpeaker(!speaker)} />
          <DockBtn icon={videoOn ? 'video' : 'video-off'} label={videoOn ? 'Camera off' : 'Camera on'} on={videoOn} onPress={() => setVideoOn(!videoOn)} />
          <DockBtn icon="user-plus" label="Add people" onPress={() => Alert.alert('Add people', 'Coming soon to Mile Club group calls.')} />
          <Pressable onPress={leave} style={({ pressed }) => [s.end, pressed && { opacity: 0.8 }]} accessibilityLabel="Leave call">
            <Feather name="phone" size={22} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
        </View>
        <Text style={s.note}>Demo call: the others are pretend for now.</Text>
      </SafeAreaView>
    </View>
  );
}

function Face({ id, size, uri }: { id: string; size: number; uri?: string }) {
  const photo = uri ?? faceFor(id)?.photo;
  const p = findPerson(id);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (photo) return <Image source={{ uri: photo }} style={box} />;
  return (
    <View style={[box, s.center, { backgroundColor: p?.color ?? '#333' }]}>
      <Text style={{ color: '#fff', fontFamily: fonts.sansBold, fontSize: size * 0.4 }}>{(p?.firstName ?? 'You')[0]}</Text>
    </View>
  );
}

function DockBtn({ icon, label, on, onPress }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => [s.dockBtn, on && { backgroundColor: LIME }, pressed && { opacity: 0.7 }]}>
      <Feather name={icon} size={21} color={on ? '#000' : '#fff'} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  // #35
  ringTop: { alignItems: 'center', paddingHorizontal: 28, marginTop: 70, gap: 6 },
  stack: { flexDirection: 'row', marginBottom: 18 },
  stackRing: { borderRadius: 40, borderWidth: 3, borderColor: '#1A1033' },
  ringLabel: { fontFamily: fonts.sans, fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  ringName: { fontFamily: fonts.sansBold, fontSize: 36, color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  ringSub: { fontFamily: fonts.sans, fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  ringBottom: { marginTop: 'auto', paddingHorizontal: 28, gap: 12, marginBottom: 28 },
  pill: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pillText: { fontFamily: fonts.sansBold, fontSize: 17 },
  // #56
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },
  headBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 19, color: '#fff' },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: '#9A9A9E', marginTop: 2, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start', paddingHorizontal: 14, rowGap: 12, paddingBottom: 120 },
  tile: { width: '48.3%', borderRadius: 24, backgroundColor: TILE, overflow: 'hidden' },
  tileBig: { aspectRatio: 0.78 },
  tileSmall: { aspectRatio: 1 },
  tileTalking: { borderWidth: 3, borderColor: LIME },
  tag: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  tagPlain: { left: 0, right: 0, bottom: 14, backgroundColor: 'transparent', justifyContent: 'center' },
  tagText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' },
  dock: { position: 'absolute', left: 16, right: 16, bottom: 44, height: 76, borderRadius: 38, backgroundColor: DOCK, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  dockBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  end: { width: 54, height: 54, borderRadius: 27, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  note: { position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: fonts.sans },
});

