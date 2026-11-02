import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { findCoach } from '@/data/coaches';
import { findPerson } from '@/data/people';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { fonts } from '@/theme';

// "Big photo" on black, always dark whatever the app's light/dark setting.
const C = {
  bg: '#000000',
  text: '#F2ECDF',
  muted: '#A1A1A1',
  btn: '#1F1F1F',
  chip: '#262626',
  olive: '#556B2F',
  cream: '#F7F1E6',
  peach: '#F4B595',
  peachText: '#3A2210',
  red: '#D2422E',
  green: '#4E9A3A',
  ring2: '#3A3A3A',
};

type Phase = 'ringing' | 'live' | 'ended';

// Demo call with someone you follow: rings, "picks up", and runs a timer.
// Your own camera shows for real in video calls; the other person is pretend
// until Mile Club has a calling service and a server.
export default function Call() {
  const { id, video, incoming: inc } = useLocalSearchParams<{ id: string; video?: string; incoming?: string }>();
  const incoming = inc === '1';
  // Mile Club's own ringtone (soft marimba chimes), only when someone calls you.
  const ringtone = useAudioPlayer(require('../../../assets/sounds/ringtone.m4a'));
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
    if (incoming) {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      ringtone.seekTo(0);
      ringtone.play();
    }
    // Calling out: they "answer" after a moment. Someone calling you: wait for Accept.
    const answer = incoming
      ? undefined
      : setTimeout(() => {
          setPhase('live');
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 3500);
    return () => {
      loop.stop();
      Vibration.cancel();
      if (incoming) ringtone.pause();
      if (answer) clearTimeout(answer);
    };
  }, [phase, pulse, incoming, ringtone]);

  // Loop the ringtone until the call is answered or declined.
  const ringStatus = useAudioPlayerStatus(ringtone);
  useEffect(() => {
    if (incoming && phase === 'ringing' && ringStatus.didJustFinish) {
      ringtone.seekTo(0);
      ringtone.play();
    }
  }, [ringStatus.didJustFinish, incoming, phase, ringtone]);

  function accept() {
    setPhase('live');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function end() {
    Vibration.cancel();
    logCall({ personId: id, video: videoOn, secs, answered: phase !== 'ringing', incoming });
    if (incoming) ringtone.pause();
    // Close straight away, like a real phone hang-up.
    if (router.canGoBack()) router.back();
    else router.replace('/' as Href);
  }

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const scale = (k: number) => ({ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + k] }) }] });
  const initial = name[0];

  // Video call: their video full screen (pretend), you in the corner.
  if (videoOn && phase === 'live') {
    return (
      <View style={[s.screen, { backgroundColor: '#0D0D0D' }]}>
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

  const hue = p?.color ?? c?.color ?? C.olive;
  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      {/* Big photo: their picture fills the top and fades into black. */}
      <View style={[s.hero, { backgroundColor: hue }]}>
        <Animated.Text style={[s.heroLetter, phase === 'ringing' ? scale(0.04) : null]}>{initial}</Animated.Text>
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', '#000']}
          locations={[0, 0.3, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <Text style={s.label}>MILE CLUB CALL</Text>
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.status}>
            {phase === 'ringing'
              ? incoming
                ? videoOn ? 'Wants to video call…' : 'Calling you…'
                : videoOn ? 'Video calling…' : 'Calling…'
              : phase === 'live'
                ? clock
                : `Call ended · ${clock}`}
            {muted && phase === 'live' ? '  ·  Muted' : ''}
          </Text>
          {shared ? (
            <Text style={s.shared} numberOfLines={1}>
              You’re both in {shared.title} · {friendlyDate(shared.date)}
            </Text>
          ) : null}
        </View>

        {phase === 'ringing' && incoming ? (
          <>
            <View style={s.miniRow}>
              <Round icon="⏰" label="Remind me" onPress={() => {
                end();
                Alert.alert('Reminder set', `We’ll remind you to call ${name} back in an hour.`);
              }} />
              <Round icon="📞" label="Decline" red onPress={end} />
              <Round icon="💬" label="Message" onPress={() => {
                Vibration.cancel();
                ringtone.pause();
                logCall({ personId: id, video: videoOn, secs: 0, answered: false, incoming });
                router.replace(`/chat/${id}` as Href);
              }} />
            </View>
            <SlideToAnswer onAnswer={accept} />
          </>
        ) : (
          <View style={s.voiceBar}>
            {phase === 'live' ? (
              <>
                <Round small icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(!muted)} />
                <Round small icon="🔊" label="Speaker" on={speaker} onPress={() => setSpeaker(!speaker)} />
                <Round small icon="🎥" label="Video" onPress={() => setVideoOn(true)} />
                <Round small icon="💬" label="Message" onPress={() => router.replace(`/chat/${id}` as Href)} />
                <Round
                  small
                  icon="📍"
                  label="Location"
                  onPress={() => Alert.alert(`Share your location with ${name}?`, 'They will see where you are for the next hour.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Share', onPress: () => Alert.alert('Location shared', `${name} can see where you are for the next hour.`) },
                  ])}
                />
              </>
            ) : (
              <>
                <Round small icon="🔊" label="Speaker" on={speaker} onPress={() => setSpeaker(!speaker)} />
                <Round small icon={muted ? '🔇' : '🎙️'} label={muted ? 'Unmute' : 'Mute'} on={muted} onPress={() => setMuted(!muted)} />
              </>
            )}
            <Round small icon="📞" label="End" red onPress={end} />
          </View>
        )}
        <Text style={s.note}>Demo call: {name} is pretend for now.</Text>
      </SafeAreaView>
    </View>
  );
}

// Drag the green button to the right to pick up, like an iPhone.
function SlideToAnswer({ onAnswer }: { onAnswer: () => void }) {
  const [x] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(0);
  const max = Math.max(0, width - 64);
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_e, g) => x.setValue(Math.min(max, Math.max(0, g.dx))),
    onPanResponderRelease: (_e, g) => {
      // A full slide answers. A quick tap on the green button does too.
      if (g.dx > max * 0.7 || Math.abs(g.dx) < 6) {
        Animated.timing(x, { toValue: max, duration: 120, useNativeDriver: true }).start(onAnswer);
      } else {
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });
  return (
    <View style={s.slide} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Text style={s.slideText}>slide to answer</Text>
      <Animated.View
        style={[s.knob, { transform: [{ translateX: x }] }]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Accept"
        {...pan.panHandlers}>
        <View style={s.knobIn}>
          <Text style={s.knobIcon}>📞</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Round({ icon, label, onPress, on, red, accept, big, small, disabled }: {
  icon: string; label: string; onPress: () => void; on?: boolean; red?: boolean; accept?: boolean; big?: boolean; small?: boolean; disabled?: boolean;
}) {
  const size = big ? 74 : small ? 48 : 66;
  const bg = red ? C.red : accept ? C.green : on ? C.peach : C.btn;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.roundWrap, small && { width: 52 }, disabled && { opacity: 0.4 }]} accessibilityLabel={label}>
      <View style={[s.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
        <Text style={[s.roundIcon, { fontSize: big ? 28 : small ? 20 : 24 }, red && { transform: [{ rotate: '135deg' }] }]}>{icon}</Text>
      </View>
      {small ? null : <Text style={[s.roundLabel, on && { color: C.peach }]}>{label}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  fill: { flex: 1 },
  hero: { position: 'absolute', left: 0, right: 0, top: 0, height: '66%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroLetter: { fontFamily: fonts.serif, fontSize: 220, color: 'rgba(255,255,255,0.85)', marginTop: -40 },
  label: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 2.5, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 12 },
  info: { marginTop: 'auto', paddingHorizontal: 24, gap: 4 },
  name: { fontFamily: fonts.serif, fontSize: 44, color: C.text },
  status: { fontFamily: fonts.sansMedium, fontSize: 16, color: C.muted, fontVariant: ['tabular-nums'] },
  shared: { fontFamily: fonts.sans, fontSize: 13, color: C.peach, marginTop: 2 },
  miniRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 26 },
  slide: { height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, marginTop: 22, marginBottom: 14, justifyContent: 'center', padding: 4 },
  slideText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: fonts.sansMedium, fontSize: 16, color: C.muted },
  knob: { width: 64, height: 64, borderRadius: 32 },
  knobIn: { flex: 1, borderRadius: 32, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  knobIcon: { fontSize: 26 },
  roundWrap: { width: 76, alignItems: 'center', gap: 8 },
  round: { alignItems: 'center', justifyContent: 'center' },
  roundIcon: { color: '#fff' },
  roundLabel: { fontFamily: fonts.sans, fontSize: 13, color: C.muted },
  voiceBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#141414', borderRadius: 36, marginHorizontal: 16, marginTop: 24, marginBottom: 14, paddingVertical: 12, paddingHorizontal: 6 },
  note: { fontFamily: fonts.sans, fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginBottom: 8 },
  remote: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  remoteLetter: { fontFamily: fonts.serif, fontSize: 200, color: 'rgba(242,236,223,0.18)' },
  videoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8 },
  namePill: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
  pillName: { fontFamily: fonts.serif, fontSize: 18, color: C.text },
  pillTime: { fontFamily: fonts.sansMedium, fontSize: 13, color: C.muted, fontVariant: ['tabular-nums'] },
  self: { width: 104, height: 148, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: C.cream, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  selfOff: { color: C.muted, fontFamily: fonts.sans, fontSize: 12, textAlign: 'center' },
  bar: { position: 'absolute', left: 20, right: 20, bottom: 40, height: 84, borderRadius: 42, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
});
