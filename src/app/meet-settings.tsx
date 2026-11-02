import { StyleSheet, Text } from 'react-native';

import { Body, Card, Chip, Chips, Label, Screen } from '@/components/ui';
import { GENDERS, MEET } from '@/data/options';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Settings: who you are, and who you want to meet up with.
export default function MeetSettings() {
  useTheme();
  const { profile, saveProfile } = useStore();
  if (!profile) return null;
  const meet = profile.meet ?? 'everyone';

  return (
    <Screen edges={['bottom']}>
      <Label>I am</Label>
      <Chips>
        {GENDERS.map((g) => (
          <Chip key={g} label={g} selected={profile.gender === g} onPress={() => saveProfile({ ...profile, gender: g })} />
        ))}
      </Chips>

      <Label>Who do you want to meet up with?</Label>
      <Chips>
        {MEET.map((m) => (
          <Chip key={m.id} label={m.label} selected={meet === m.id} onPress={() => saveProfile({ ...profile, meet: m.id })} />
        ))}
      </Chips>

      <Card style={styles.card}>
        <Text style={styles.title}>
          {meet === 'women' ? 'You’ll only see runs hosted by women, and women in People near you.' : meet === 'men' ? 'You’ll only see runs hosted by men, and men in People near you.' : 'You’ll see runs and people from everyone.'}
        </Text>
        <Body muted>
          {profile.gender === 'Woman'
            ? 'You can also host Women only runs: pick “Women only” when you create a run.'
            : 'Runs marked Women only are only shown to women.'}
        </Body>
        <Body muted>🔒 Nobody else can see this setting.</Body>
      </Card>
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { marginTop: space.xl, gap: space.sm },
  title: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
}));
