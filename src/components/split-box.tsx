import { StyleSheet, Text, View } from 'react-native';

import { euro, split } from '@/data/roles';
import { colors, radius, space, themed } from '@/theme';

// Shows how a payment is shared: 80% to the coach, 20% to Mile Club.
export function SplitBox({ gross, note }: { gross: number; note: string }) {
  const p = split(gross);
  return (
    <View style={styles.split}>
      <View style={styles.bar}>
        <View style={[styles.barCoach, { flex: 80 }]} />
        <View style={[styles.barFee, { flex: 20 }]} />
      </View>
      <View style={styles.line}>
        <Text style={styles.lineLabel}>Total ({note})</Text>
        <Text style={styles.lineValue}>{euro(p.gross)}</Text>
      </View>
      <View style={styles.line}>
        <Text style={[styles.lineLabel, { color: colors.link }]}>● Coach keeps 80%</Text>
        <Text style={[styles.lineValue, { color: colors.link }]}>{euro(p.coach)}</Text>
      </View>
      <View style={styles.line}>
        <Text style={[styles.lineLabel, { color: colors.purple }]}>● Mile Club 20%</Text>
        <Text style={[styles.lineValue, { color: colors.purple }]}>{euro(p.fee)}</Text>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  split: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: space.sm },
  barCoach: { backgroundColor: colors.accent },
  barFee: { backgroundColor: colors.purple },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  lineValue: { fontSize: 17, fontWeight: '900', color: colors.ink },
}));
