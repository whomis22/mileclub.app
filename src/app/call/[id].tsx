import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { findPerson } from '@/data/people';
import { fonts, themed, useTheme } from '@/theme';

type Phase = 'ringing' | 'live' | 'ended';

// Demo call with someone you follow: rings, "picks up", and runs a timer.
// Your own camera shows for real in video calls; the other person is pretend
// until Mile Club has a calling service and a server.
export default function Call() {
  useTheme();
  const { id, video } = useLocalSearchParams<{ id: string; video?: string }>();
  const p = findPerson(id);
  const c = p ? undefined : findCoach(id);
  const name = p?.firstName ?? c?.name ?? 'Member';
  const color = p?.color ?? c?.color ?? '#556B2F';

  const [phase, setPhase] = useState<Phase>('ringing');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(video === '1');
  const [front, setFront] = useState(true);
  const [perm, requestPerm] = useCameraPermissions();
  const [pulse] = useState(() => new Animated.Value(0));

  // Ask for the camera when video is turned on.
  useEffect(() => {
    if (videoOn && perm && !perm.granted && perm.canAskAgain) requestPerm();
  }, [videoOn, perm, requestPerm]);

  // Ringing: pulsing rings and a buzz, then they "answer".
  useEffect(() => {
    if (phase !== 'ringing') return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
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
    setPhase('ended');
    setTimeout(() => router.back(), 1200);
  }

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const status = phase === 'ringing' ? 'Ringing…' : phase === 'live' ? clock : `Call ended · ${clock}`;
  const showSelf = videoOn && perm?.granted && phase !== 'ended';
  const theirVideo = videoOn && phase === 'live';

  const ring = (delay: number) => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5 - delay, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7 + delay] }) }],
  });

  return (
    <View style={[styles.screen, theirVideo && { backgroundColor: color }]}>
      {theirVideo ? (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.fakeVideo}>
            <Text style={styles.fakeLetter}>{name[0]}</Text>
          </View>
          <View style={styles.shade} />
        </View>
      ) : null}

      <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.label}>{videoOn ? 'MILE CLUB VIDEO' : 'MILE CLUB AUDIO'}</Text>
          {theirVideo ? null : (
            <View style={styles.avatarWrap}>
              {phase === 'ringing' ? (
                <>
                  <Animated.View style={[styles.ring, ring(0)]} />
                  <Animated.View style={[styles.ring, ring(0.2)]} />
                </>
              ) : null}
              <Avatar name={name} color={color} size={120} />
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>{status}</Text>
          {muted && phase === 'live' ? <Text style={styles.mutedTag}>You’re muted</Text> : null}
        </View>

        {showSelf ? (
          <View style={styles.selfView}>
            <CameraView style={StyleSheet.absoluteFill} facing={front ? 'front' : 'back'} mirror={front} />
          </View>
        ) : null}

        <View>
          <View style={styles.row}>
            <Round label={muted ? 'Unmute' : 'Mute'} icon={muted ? '🔇' : '🎙️'} on={muted} onPress={() => setMuted(!muted)} />
            <Round label="Speaker" icon="🔊" on={speaker} onPress={() => setSpeaker(!speaker)} />
            <Round label={videoOn ? 'Video on' : 'Video'} icon="🎥" on={videoOn} onPress={() => setVideoOn(!videoOn)} />
            {videoOn ? <Round label="Flip" icon="🔄" on={false} onPress={() => setFront(!front)} /> : null}
          </View>
          <Pressable style={[styles.end, phase === 'ended' && { opacity: 0.4 }]} onPress={end} disabled={phase === 'ended'} accessibilityLabel="End call">
            <Text style={styles.endIcon}>📞</Text>
          </Pressable>
          <Text style={[styles.note, theirVideo && { color: '#F7F1E6' }]}>
            {videoOn && perm && !perm.granted ? 'Allow the camera to show yourself. ' : ''}Demo call: {name} is pretend for now.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Round({ label, icon, on, onPress }: { label: string; icon: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.roundWrap} accessibilityLabel={label}>
      <View style={[styles.round, on && styles.roundOn]}>
        <Text style={styles.roundIcon}>{icon}</Text>
      </View>
      <Text style={styles.roundLabel}>{label}</Text>
    </Pressable>
  );
}

// Always dark, like a phone's call screen.
const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1D2116' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },
  fakeVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fakeLetter: { fontFamily: fonts.serif, fontSize: 200, color: 'rgba(255,255,255,0.25)' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  top: { alignItems: 'center', gap: 12, marginTop: 30 },
  label: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 2, color: '#B9C09F' },
  avatarWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#F4B595' },
  name: { fontFamily: fonts.serif, fontSize: 30, color: '#F7F1E6' },
  status: { fontFamily: fonts.sansMedium, fontSize: 16, color: '#D9D2C2' },
  mutedTag: { fontFamily: fonts.sansSemi, fontSize: 12, color: '#1D2116', backgroundColor: '#F4B595', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, overflow: 'hidden' },
  selfView: { position: 'absolute', right: 16, top: 70, width: 110, height: 160, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: '#000' },
  row: { flexDirection: 'row', gap: 22, justifyContent: 'center' },
  roundWrap: { alignItems: 'center', gap: 8 },
  round: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  roundOn: { backgroundColor: '#F7F1E6' },
  roundIcon: { fontSize: 24 },
  roundLabel: { fontFamily: fonts.sans, fontSize: 12, color: '#D9D2C2' },
  end: { alignSelf: 'center', marginTop: 28, width: 76, height: 76, borderRadius: 38, backgroundColor: '#D9483B', alignItems: 'center', justifyContent: 'center' },
  endIcon: { fontSize: 30, transform: [{ rotate: '135deg' }] },
  note: { fontFamily: fonts.sans, fontSize: 12, color: '#8E927F', textAlign: 'center', marginTop: 16, paddingHorizontal: 24 },
}));
