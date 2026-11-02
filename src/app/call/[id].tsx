import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { findCoach } from '@/data/coaches';
import { findPerson } from '@/data/people';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { fonts } from '@/theme';

// "Calm rings", always dark whatever the app's light/dark setting.
const C = {
  bg: '#14170F',
  text: '#F2ECDF',
  muted: '#ABA593',
  btn: '#262C1D',
  chip: '#2A3121',
  olive: '#556B2F',
  cream: '#F7F1E6',
  peach: '#F4B595',
  peachText: '#3A2210',
  red: '#C2412D',
  ring2: '#3A4A1F',
};

type Phase = 'ringing' | 'live' | 'ended';

// Demo call with someone you follow: rings, "picks up", and runs a timer.
// Your own camera shows for real in video calls; the other person is pretend
// until Mile Club has a calling service and a server.
export default function Call() {
  const { id, video } = useLocalSearchParams<{ id: string; video?: string }>();
  const { activities, logCall } = useStore();
  const p = findPerson(id);
  const c = p ? undefined : findCoach(id);
  const name = p?.firstName ?? c?.name ?? 'Member';
  const shared = activities.find((a) => (a.participants.includes(id) || a.hostId === id) && (a.participants.includes('me') || a.hostId === 'me'));

  const [phase, setPhase] = useState<Phase>('ringing');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(video === '1');
  const [front, setFront] = useState(true);
  const [perm, requestPerm] = useCameraPermissions();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (videoOn && perm && !perm.granted && perm.canAskAgain) requestPerm();
  }, [videoOn, perm, requestPerm]);

  // Ringing: gently pulsing rings and a buzz, then they "answer".
  useEffect(() => {
    if (phase !== 'ringing') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 800, 400], true);
    const answer = setTimeout(() => {
      setPhase('live');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3500);
    return () => {
      loop.stop();
      Vibration.cancel();
      clearTimeout(answer);
    };
  }, [phase, pulse]);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function end() {
    Vibration.cancel();
    logCall({ personId: id, video: videoOn, secs, answered: phase !== 'ringing' });
    setPhase('ended');
    setTimeout(() => router.back(), 1000);
  }

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const scale = (k: number) => ({ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + k] }) }] });
  const initial = name[0];

  // Video call: their video full screen (pretend), you in the corner.
  if (videoOn && phase === 'live') {
    return (
      <View style={[s.screen, { backgroundColor: '#2C3520' }]}>
        <StatusBar style="light" />
        <View style={s.remote}>
          <Text style={s.remoteLetter}>{initial}</Text>
        </View>
        <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'bottom']}>
          <View style={s.videoTop}>
            <View style={s.namePill}>
              <Text style={s.pillName}>{name}</Text>
              <Text style={s.pillTime}>{clock}</Text>
            </View>
            <View style={s.self}>
              {perm?.granted ? (
                <CameraView style={StyleSheet.absoluteFill} facing={front ? 'front' : 'back'} mirror={front} />
              ) : (
                <Text style={s.selfOff}>Camera{'\n'}off</Text>
              )}
            </View>
          </View>
          <View style={s.bar}>
            <Round small icon="🔄" label="Flip" onPress={() => setFront(!front)} />
            <Round small icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(!muted)} />
            <Round small icon="📷" label="Camera off" onPress={() => setVideoOn(false)} />
            <Round small icon="📞" label="End" red onPress={end} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={s.top}>
        <Text style={s.label}>MILE CLUB CALL</Text>
        <View style={s.avatarWrap}>
          {phase === 'ringing' ? (
            <>
              <Animated.View style={[s.ring, { width: 260, height: 260, borderRadius: 130, borderWidth: 1.5, borderColor: C.chip }, scale(0.06)]} />
              <Animated.View style={[s.ring, { width: 210, height: 210, borderRadius: 105, borderWidth: 2, borderColor: C.ring2 }, scale(0.04)]} />
            </>
          ) : null}
          <View style={[s.ring, { width: 164, height: 164, borderRadius: 82, borderWidth: 3, borderColor: C.peach }]} />
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        </View>
        <Text style={s.name}>{name}</Text>
        <Text style={s.status}>
          {phase === 'ringing' ? (videoOn ? 'Video calling…' : 'Calling…') : phase === 'live' ? clock : `Call ended · ${clock}`}
        </Text>
        {shared ? (
          <View style={s.chip}>
            <Text style={s.chipText}>
              You’re both in {shared.title} · {friendlyDate(shared.date)}
            </Text>
          </View>
        ) : null}
        {muted && phase === 'live' ? <Text style={s.mutedTag}>You’re muted</Text> : null}
      </View>

      {phase === 'ringing' ? (
        <View style={s.ringBtns}>
          <Round big icon="📞" label="Cancel" red onPress={end} />
        </View>
      ) : (
        <View style={s.grid}>
          <Round icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(!muted)} />
          <Round icon="🔊" label="Speaker" on={speaker} onPress={() => setSpeaker(!speaker)} />
          <Round icon="🎥" label="Video" onPress={() => setVideoOn(true)} />
          <Round icon="💬" label="Message" onPress={() => router.replace(`/chat/${id}` as Href)} />
          <Round icon="📞" label="End" red onPress={end} disabled={phase === 'ended'} />
          <Round
            icon="📍"
            label="Location"
            onPress={() => Alert.alert(`Share your location with ${name}?`, 'They will see where you are for the next hour.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Share', onPress: () => Alert.alert('Location shared', `${name} can see where you are for the next hour.`) },
            ])}
          />
        </View>
      )}
      <Text style={s.note}>Demo call: {name} is pretend for now.</Text>
    </SafeAreaView>
  );
}

function Round({ icon, label, onPress, on, red, big, small, disabled }: {
  icon: string; label: string; onPress: () => void; on?: boolean; red?: boolean; big?: boolean; small?: boolean; disabled?: boolean;
}) {
  const size = big ? 74 : small ? 56 : 66;
  const bg = red ? C.red : on ? C.peach : C.btn;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.roundWrap, small && { width: 64 }, disabled && { opacity: 0.4 }]} accessibilityLabel={label}>
      <View style={[s.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
        <Text style={[s.roundIcon, { fontSize: big ? 28 : small ? 22 : 24 }, red && { transform: [{ rotate: '135deg' }] }]}>{icon}</Text>
      </View>
      {small ? null : <Text style={[s.roundLabel, on && { color: C.peach }]}>{label}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: 28 },
  label: { fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 2.5, color: C.muted },
  avatarWrap: { width: 270, height: 270, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  ring: { position: 'absolute' },
  avatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: C.olive, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serif, fontSize: 58, color: C.cream },
  name: { fontFamily: fonts.serif, fontSize: 36, color: C.text, marginTop: 6 },
  status: { fontFamily: fonts.sansMedium, fontSize: 16, color: C.muted, marginTop: 6, fontVariant: ['tabular-nums'] },
  chip: { backgroundColor: C.chip, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginTop: 14, maxWidth: '86%' },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: C.text, textAlign: 'center' },
  mutedTag: { fontFamily: fonts.sansSemi, fontSize: 12, color: C.peachText, backgroundColor: C.peach, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, overflow: 'hidden', marginTop: 10 },
  ringBtns: { alignItems: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 18, paddingHorizontal: 30, marginBottom: 10 },
  roundWrap: { width: '33%', alignItems: 'center', gap: 8 },
  round: { alignItems: 'center', justifyContent: 'center' },
  roundIcon: { color: '#fff' },
  roundLabel: { fontFamily: fonts.sans, fontSize: 13, color: C.muted },
  note: { fontFamily: fonts.sans, fontSize: 12, color: '#6E6B5F', textAlign: 'center', marginBottom: 8 },
  remote: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  remoteLetter: { fontFamily: fonts.serif, fontSize: 200, color: 'rgba(242,236,223,0.18)' },
  videoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8 },
  namePill: { backgroundColor: 'rgba(20,23,15,0.55)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
  pillName: { fontFamily: fonts.serif, fontSize: 18, color: C.text },
  pillTime: { fontFamily: fonts.sansMedium, fontSize: 13, color: C.muted, fontVariant: ['tabular-nums'] },
  self: { width: 104, height: 148, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: C.cream, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  selfOff: { color: C.muted, fontFamily: fonts.sans, fontSize: 12, textAlign: 'center' },
  bar: { position: 'absolute', left: 20, right: 20, bottom: 40, height: 84, borderRadius: 42, backgroundColor: 'rgba(20,23,15,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
});
