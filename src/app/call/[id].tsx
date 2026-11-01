import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { findPerson } from '@/data/people';
import { fonts, themed, useTheme } from '@/theme';

// Pretend voice call with someone you follow. No real calling yet (needs a calling service later).
export default function Call() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = findPerson(id);
  const c = p ? undefined : findCoach(id);
  const name = p?.firstName ?? c?.name ?? 'Member';
  const [secs, setSecs] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const ring = setTimeout(() => setSecs(0), 2500);
    return () => clearTimeout(ring);
  }, []);
  useEffect(() => {
    if (secs < 0) return;
    const t = setTimeout(() => setSecs((s) => s + 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const status = secs < 0 ? 'Calling…' : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Text style={styles.label}>MILE CLUB AUDIO</Text>
        <Avatar name={name} color={p?.color ?? c?.color} size={120} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <View style={styles.row}>
        <Round label={muted ? 'Unmute' : 'Mute'} icon={muted ? '🔇' : '🎙️'} on={muted} onPress={() => setMuted(!muted)} />
        <Round label="Speaker" icon="🔊" on={speaker} onPress={() => setSpeaker(!speaker)} />
      </View>
      <Pressable style={styles.end} onPress={() => router.back()} accessibilityLabel="End call">
        <Text style={styles.endIcon}>📞</Text>
      </Pressable>
      <Text style={styles.note}>Demo call. Real calling comes once Mile Club has a server.</Text>
    </SafeAreaView>
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
  screen: { flex: 1, backgroundColor: '#1D2116', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  top: { alignItems: 'center', gap: 14, marginTop: 40 },
  label: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 2, color: '#B9C09F' },
  name: { fontFamily: fonts.serif, fontSize: 32, color: '#F7F1E6' },
  status: { fontFamily: fonts.sansMedium, fontSize: 16, color: '#D9D2C2' },
  row: { flexDirection: 'row', gap: 48 },
  roundWrap: { alignItems: 'center', gap: 8 },
  round: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  roundOn: { backgroundColor: '#F7F1E6' },
  roundIcon: { fontSize: 26 },
  roundLabel: { fontFamily: fonts.sans, fontSize: 13, color: '#D9D2C2' },
  end: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#D9483B', alignItems: 'center', justifyContent: 'center' },
  endIcon: { fontSize: 30, transform: [{ rotate: '135deg' }] },
  note: { fontFamily: fonts.sans, fontSize: 12, color: '#8E927F' },
}));
