import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Button, Chip, Chips, Label, Screen } from '@/components/ui';
import { ACTIVITIES, LEVELS, NEIGHBORHOOD_NAMES, type ActivityId, type Level, type Neighborhood } from '@/data/options';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, radius, space, themed, useTheme } from '@/theme';

function nextDays(n: number) {
  const pad = (x: number) => String(x).padStart(2, '0');
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}

const TIMES = ['07:00', '07:30', '08:00', '09:00', '10:00', '12:00', '12:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const SIZES = [4, 6, 8, 10, 12, 15];

export default function CreateActivity() {
  useTheme();
  const { createActivity, profile } = useStore();
  const [type, setType] = useState<ActivityId | undefined>(profile?.activities[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [location, setLocation] = useState('');
  const [neighborhood, setNeighborhood] = useState<Neighborhood | undefined>(profile?.neighborhood);
  const [level, setLevel] = useState<Level | undefined>(profile?.level);
  const [groupSize, setGroupSize] = useState<number>();
  const [womenOnly, setWomenOnly] = useState(false);
  const [description, setDescription] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [weekly, setWeekly] = useState(false);

  const ready = type && title.trim() && date && time && location.trim() && neighborhood && level && groupSize && description.trim();

  function submit() {
    if (!ready) return;
    const a = createActivity({
      type, title: title.trim(), date, time, location: location.trim(), neighborhood, level, groupSize,
      description: description.trim(), free: true, womenOnly,
      distance: distance.trim() || undefined, pace: pace.trim() || undefined,
      recurring: weekly ? 'Every week' : undefined,
    });
    router.dismiss();
    router.push(`/activity/${a.id}`);
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
      <Body muted>Pick the basics and we’ll suggest people who’d be a good fit.</Body>
      <Label>Activity</Label>
      <Chips>
        {ACTIVITIES.map((a) => (
          <Chip key={a.id} label={`${a.emoji} ${a.label}`} selected={type === a.id} onPress={() => setType(a.id)} />
        ))}
      </Chips>
      <Label>Name it</Label>
      {input(title, setTitle, 'e.g. Sunday Vondelpark 5K')}
      <Label>Day</Label>
      <Chips>
        {nextDays(10).map((d) => (
          <Chip key={d} label={friendlyDate(d)} selected={date === d} onPress={() => setDate(d)} />
        ))}
      </Chips>
      <Label>Time</Label>
      <Chips>
        {TIMES.map((t) => (
          <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
        ))}
      </Chips>
      <Label>Meeting point</Label>
      {input(location, setLocation, 'A public spot, e.g. Vondelpark main entrance')}
      <Label>Neighbourhood</Label>
      <Chips>
        {NEIGHBORHOOD_NAMES.map((n) => (
          <Chip key={n} label={n} selected={neighborhood === n} onPress={() => setNeighborhood(n)} />
        ))}
      </Chips>
      <Label>Difficulty</Label>
      <Chips>
        {LEVELS.map((l) => (
          <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </Chips>
      <Label>Group size</Label>
      <Chips>
        {SIZES.map((s) => (
          <Chip key={s} label={`${s} people`} selected={groupSize === s} onPress={() => setGroupSize(s)} />
        ))}
      </Chips>
      {profile?.gender === 'Woman' ? (
        <>
          <Label>Who can join</Label>
          <Chips>
            <Chip label="Everyone" selected={!womenOnly} onPress={() => setWomenOnly(false)} />
            <Chip label="♀ Women only" selected={womenOnly} onPress={() => setWomenOnly(true)} />
          </Chips>
        </>
      ) : null}
      <Label>Description</Label>
      {input(description, setDescription, "What should people expect? Pace, vibe, what to bring…", true)}
      <Label>Optional</Label>
      {input(distance, setDistance, 'Distance, e.g. 5 km')}
      <TextInputSpacer />
      {input(pace, setPace, 'Pace, e.g. 6:00/km')}
      <TextInputSpacer />
      <Chips>
        <Chip label="🔁 Repeat every week" selected={weekly} onPress={() => setWeekly(!weekly)} />
      </Chips>
      <TextInputSpacer big />
      <Button title="CREATE ACTIVITY" variant="secondary" onPress={submit} disabled={!ready} />
    </Screen>
  );
}

function TextInputSpacer({ big }: { big?: boolean }) {
  return <View style={{ height: big ? space.xl : space.sm }} />;
}

const styles = themed(() => StyleSheet.create({
  input: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: 14, fontSize: 16, color: colors.ink,
  },
}));
