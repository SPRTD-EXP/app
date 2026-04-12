import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function GhostButton({ label, onPress, fullWidth, style }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.btn, fullWidth && styles.fullWidth, pressed && styles.pressed, style]}
      activeOpacity={0.85}
    >
      <Text style={[styles.label, pressed && styles.labelPressed]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: 'rgba(245, 240, 232, 0.55)',
    paddingVertical: 11,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  pressed: { borderColor: colors.gold },
  label: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    color: colors.foreground,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  labelPressed: { color: colors.gold },
});
