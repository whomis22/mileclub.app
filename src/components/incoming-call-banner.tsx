import Feather from '@expo/vector-icons/Feather';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findCoach } from '@/data/coaches';
import { faceFor } from '@/data/faces';
import { findPerson } from '@/data/people';
import { callHref, findCallGroup, stopRinging, useRinging } from '@/lib/ringing';
import { useStore } from '@/state/store';
import { fonts } from '@/theme';

const LIME = '#B9E769';
const RED = '#FF5A5F';

// Layout #33 (Yana, 2026-11-22): a call drops in at the top of whatever screen
// you're on. Tap the card for the full call screen, or answer/decline right here.
export function IncomingCallBanner() {
  const insets = useSafeAreaInsets();
  const r = useRinging();
  const { corners, logCall } = useStore();
  const ringtone = useAudioPlayer(require('../../assets/sounds/ringtone.m4a'));
  const status = useAudioPlayerStatus(ringtone);

  // Ring and buzz while the banner is showing; give up after 30 seconds.
  useEffect(() => {
    if (!r) return;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    ringtone.seekTo(0);
    ringtone.play();
    if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 800, 400], true);
    const t = setTimeout(() => missed(), 30000);
    return () => {
      clearTimeout(t);
      ringtone.pause();
      Vibration.cancel();
    };
  }, [r?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (r && status.didJustFinish) {
      ringtone.seekTo(0);
      ringtone.play();
    }
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return null;

  let title = 'Mile Club member';
  let photos: (string | undefined)[] = [];
  let sub = r.video ? 'Mile Club Video' : 'Mile Club Audio';
  if (r.group) {
    const g = findCallGroup(r.id, corners);
    title = g?.name ?? 'Group call';
    photos = (g?.members ?? []).slice(0, 2).map((m) => faceFor(m)?.photo);
    sub = r.video ? 'Group video call' : 'Group call';
  } else {
    const p = findPerson(r.id);
    title = p?.firstName ?? findCoach(r.id)?.name ?? title;
    photos = [faceFor(r.id)?.photo];
  }

  function missed() {
    if (!r!.group) logCall({ personId: r!.id, video: !!r!.video, secs: 0, answered: false, incoming: true });
    stopRinging();
  }
  function open(answer: boolean) {
    const href = callHref(r!, answer);
    stopRinging();
    router.push(href as Href);
  }

  return (
    <View style={[s.wrap, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Pressable style={s.card} onPress={() => open(false)} accessibilityLabel={`${title} is calling. Open the call`}>
        <View style={s.faces}>
          {photos.length ? (
            photos.map((uri, k) => (
              <View key={k} style={[s.faceRing, k > 0 && { marginLeft: -18 }]}>
                {uri ? <Image source={{ uri }} style={s.face} /> : <View style={[s.face, { backgroundColor: '#333' }]} />}
              </View>
            ))
          ) : (
            <View style={[s.face, { backgroundColor: '#333' }]} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.sub}>{sub}</Text>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
        </View>
        <Pressable onPress={missed} style={[s.btn, { backgroundColor: RED }]} accessibilityLabel="Decline" hitSlop={6}>
          <Feather name="phone" size={20} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>
        <Pressable onPress={() => open(true)} style={[s.btn, { backgroundColor: LIME }]} accessibilityLabel="Accept" hitSlop={6}>
          <Feather name={r.video ? 'video' : 'phone'} size={20} color="#000" />
        </Pressable>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 10, right: 10, zIndex: 200 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C1C1E', borderRadius: 28, padding: 12, paddingRight: 14, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  faces: { flexDirection: 'row' },
  faceRing: { borderRadius: 26, borderWidth: 2, borderColor: '#1C1C1E' },
  face: { width: 46, height: 46, borderRadius: 23 },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: '#9A9A9E' },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: '#fff', marginTop: 1 },
  btn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
