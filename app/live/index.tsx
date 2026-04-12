import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, typography } from '../../theme';

const TARGET = new Date('2026-04-10T00:00:00');

const UNITS = [
  { key: 'days',  label: 'DAYS' },
  { key: 'hours', label: 'HRS' },
  { key: 'mins',  label: 'MINS' },
  { key: 'secs',  label: 'SECS' },
] as const;

export default function LiveScreen() {
  const { days, hours, mins, secs } = useCountdown(TARGET);

  const values: Record<typeof UNITS[number]['key'], string> = {
    days, hours, mins, secs,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Page label */}
      <View style={styles.pageLabel}>
        <Text style={styles.pageLabelText}>LIVE</Text>
      </View>

      {/* Countdown */}
      <View style={styles.timerRow}>
        {UNITS.map(({ key, label }, idx) => (
          <View key={key} style={styles.unitWrapper}>
            {/* Separator dot between units */}
            {idx > 0 && <Text style={styles.separator}>:</Text>}
            <View style={styles.unitBlock}>
              <Text style={styles.numberText}>{values[key]}</Text>
              <Text style={styles.unitLabel}>{label}</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    position: 'absolute',
    top: 72,
    alignItems: 'center',
  },
  pageLabelText: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: 40,
    color: colors.gold,
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    marginHorizontal: 6,
    marginBottom: 18, // lift separator to align with number baseline
    opacity: 0.5,
  },
  unitBlock: {
    alignItems: 'center',
    minWidth: 72,
  },
  numberText: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: 'HelveticaNeue-Bold',
    color: colors.goldLight,
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
    letterSpacing: -1,
  },
  unitLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
    marginTop: 6,
    color: colors.gold,
  },
});
