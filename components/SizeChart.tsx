import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { type SizeChart } from '../lib/products';
import { colors, typography } from '../theme';

const COLUMN_LABELS: Record<string, string> = {
  chest:       'CHEST',
  waist:       'WAIST',
  length:      'LENGTH',
  shoulder:    'SHOULDER',
  sleeve:      'SLEEVE',
  waistline:   'WAISTLINE',
  hip:         'HIP',
  leg_opening: 'LEG OPENING',
};

function convert(value: number, fromUnit: 'in' | 'cm', toUnit: 'in' | 'cm'): string {
  if (fromUnit === toUnit) return String(value);
  if (fromUnit === 'cm' && toUnit === 'in') return (value / 2.54).toFixed(1);
  return (value * 2.54).toFixed(1);
}

interface Props {
  visible: boolean;
  onClose: () => void;
  chart: SizeChart;
}

export default function SizeChartModal({ visible, onClose, chart }: Props) {
  const [displayUnit, setDisplayUnit] = useState<'in' | 'cm'>(chart.unit);

  // Only include columns that have data in at least one row
  const measureKeys = Object.keys(chart.rows[0] ?? {}).filter(k => {
    if (k === 'size') return false;
    return chart.rows.some(row => (row as Record<string, unknown>)[k] != null);
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>CLOSE</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={[typography.label, styles.title]}>SIZE GUIDE</Text>

          {/* Unit toggle */}
          <View style={styles.unitRow}>
            {(['in', 'cm'] as const).map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => setDisplayUnit(u)}
                style={[
                  styles.unitButton,
                  displayUnit === u ? styles.unitButtonActive : styles.unitButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    displayUnit === u ? styles.unitButtonTextActive : styles.unitButtonTextInactive,
                  ]}
                >
                  {u.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header row */}
              <View style={styles.tableRow}>
                <View style={[styles.th, styles.sizeCol]}>
                  <Text style={styles.thText}>SIZE</Text>
                </View>
                {measureKeys.map((k, i) => (
                  <View
                    key={k}
                    style={[
                      styles.th,
                      i === measureKeys.length - 1 && styles.lastCol,
                    ]}
                  >
                    <Text style={styles.thText}>
                      {COLUMN_LABELS[k] ?? k.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data rows */}
              {chart.rows.map(row => {
                const cells = measureKeys.map(k => {
                  const raw = (row as Record<string, unknown>)[k];
                  if (typeof raw === 'number') {
                    return convert(raw, chart.unit, displayUnit);
                  }
                  return raw != null ? String(raw) : '—';
                });

                return (
                  <View key={row.size} style={styles.tableRow}>
                    <View style={[styles.td, styles.sizeCol]}>
                      <Text style={styles.tdSizeText}>{row.size}</Text>
                    </View>
                    {cells.map((val, i) => (
                      <View
                        key={i}
                        style={[
                          styles.td,
                          i === cells.length - 1 && styles.lastCol,
                        ]}
                      >
                        <Text style={styles.tdText}>{val}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const COL_WIDTH = 72;
const SIZE_COL_WIDTH = 52;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.12)',
    width: '100%',
    maxHeight: '85%',
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  closeText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  unitButtonActive: {
    borderColor: colors.gold,
  },
  unitButtonInactive: {
    borderColor: 'rgba(245,240,232,0.25)',
  },
  unitButtonText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  unitButtonTextActive: {
    color: colors.gold,
  },
  unitButtonTextInactive: {
    color: 'rgba(245,240,232,0.5)',
  },
  tableRow: {
    flexDirection: 'row',
  },
  th: {
    width: COL_WIDTH,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  td: {
    width: COL_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeCol: {
    width: SIZE_COL_WIDTH,
  },
  lastCol: {
    borderRightWidth: 0,
  },
  thText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 7,
    letterSpacing: 1.5,
    color: colors.gold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tdText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.foreground,
    textAlign: 'center',
  },
  tdSizeText: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.gold,
    textAlign: 'center',
  },
});
