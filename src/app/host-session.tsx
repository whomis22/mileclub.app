import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Chip, Chips, Label, Screen } from '@/components/ui';
import { SESSION_KINDS, type SessionKind } from '@/data/coaches';
import { ACTIVITIES, NEIGHBORHOOD_NAMES, type ActivityId, type Neighborhood } from '@/data/options';
import { euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

function nextDays(n: number) {
  const pad = (x: number) => String(x).padStart(2, '0');
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}

const TIMES = ['07:00', '08:00', '09:00', '10:00', '12:00', '17:30', '18:30', '19:00', '19:30', '20:00'];
const SPOTS = [1, 5, 10, 15, 25, 50];
const PRICES = [10, 15, 20, 30, 40, 60];

export default function HostSession() {
  const { hostSession, profile } = useStore();
  const [kind, setKind] = useState<SessionKind>('Group training');
  const [type, setType] = useState<ActivityId>(profile?.activities[0] ?? 'running');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [location, setLocation] = useState('');
  const [neighborhood, setNeighborhood] = useState<Neighborhood | undefined>(profile?.neighborhood);
  const [price, setPrice] = useState(20);
  const [customPrice, setCustomPrice] = useState('');
  const [spots, setSpots] = useState(10);
  const [description, setDescription] = useState('');

  const finalPrice = customPrice ? Number(customPrice.replace(',', '.')) || 0 : price;
  const per = split(finalPrice);
  const full = split(finalPrice * spots);
  const ready = title.trim() && date && time && location.trim() && neighborhood && finalPrice > 0 && description.trim();

  function submit() {
    if (!ready) return;
    const s = hostSession({
      kind, type, title: title.trim(), date, time, location: location.trim(), neighborhood,
      price: finalPrice, spots, description: description.trim(),
    });
    router.dismiss();
    router.push(`/session/${s.id}`);
  }

  const input = (value: string, onChange: (t: string) => void, placeholder: string, multiline = false) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      style={[styles.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
    />
  );

  return (
    <Screen edges={['bottom']}>
      <Body muted>Set a price and Mile Club handles bookings. You keep 80% of every booking.</Body>
      <Label>Type of session</Label>
      <Chips>
        {SESSION_KINDS.map((k) => <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />)}
      </Chips>
      <Label>Sport</Label>
      <Chips>
        {ACTIVITIES.map((a) => (
          <Chip key={a.id} label={`${a.emoji} ${a.label}`} selected={type === a.id} onPress={() => setType(a.id)} />
        ))}
      </Chips>
      <Label>Name it</Label>
      {input(title, setTitle, 'e.g. Marathon Prep Long Run')}
      <Label>Day</Label>
      <Chips>
        {nextDays(10).map((d) => <Chip key={d} label={friendlyDate(d)} selected={date === d} onPress={() => setDate(d)} />)}
      </Chips>
      <Label>Time</Label>
      <Chips>{TIMES.map((t) => <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />)}</Chips>
      <Label>Meeting point</Label>
      {input(location, setLocation, 'e.g. Olympic Stadium main entrance')}
      <Label>Neighbourhood</Label>
      <Chips>
        {NEIGHBORHOOD_NAMES.map((n) => (
          <Chip key={n} label={n} selected={neighborhood === n} onPress={() => setNeighborhood(n)} />
        ))}
      </Chips>
      <Label>Spots</Label>
      <Chips>
        {SPOTS.map((n) => <Chip key={n} label={n === 1 ? '1-on-1' : `${n} people`} selected={spots === n} onPress={() => setSpots(n)} />)}
      </Chips>
      <Label>Price per person</Label>
      <Chips>
        {PRICES.map((p) => (
          <Chip key={p} label={euro(p)} selected={!customPrice && price === p} onPress={() => { setPrice(p); setCustomPrice(''); }} />
        ))}
      </Chips>
      <View style={{ height: space.sm }} />
      {input(customPrice, (t) => setCustomPrice(t.replace(/[^0-9.,]/g, '')), 'Or type your own price in €')}

      <View style={styles.preview}>
        <Text style={styles.previewKicker}>YOUR CUT</Text>
        <Text style={styles.previewBig}>You keep {euro(per.coach)} per person</Text>
        <Text style={styles.previewSmall}>
          {euro(finalPrice)} price · Mile Club’s 20% is {euro(per.fee)}
        </Text>
        <Text style={styles.previewFull}>
          If all {spots} spot{spots === 1 ? '' : 's'} fill up, you earn {euro(full.coach)}.
        </Text>
      </View>

      <Label>What do people get?</Label>
      {input(description, setDescription, 'Plan, pace, what to bring, who it’s for…', true)}
      <View style={{ height: space.xl }} />
      <Button title="PUBLISH SESSION" variant="secondary" onPress={submit} disabled={!ready} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: 14, fontSize: 16, color: colors.ink,
  },
  preview: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space.lg, marginTop: space.lg },
  previewKicker: { color: colors.peach, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  previewBig: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  previewSmall: { color: '#fff', opacity: 0.7, fontSize: 14, marginTop: 2 },
  previewFull: { color: colors.accent, fontSize: 15, fontWeight: '800', marginTop: space.sm },
});
