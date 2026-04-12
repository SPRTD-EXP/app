import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import GhostButton from '../../components/GhostButton';
import { useCart } from '../../context/CartContext';
import { colors, typography } from '../../theme';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const { clearCart } = useCart();

  // Clear cart on mount — same behavior as website
  useEffect(() => {
    (async () => {
      await clearCart();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700, delay: 100 }}
        style={styles.inner}
      >
        {/* Label */}
        <Text style={styles.label}>ORDER CONFIRMED</Text>

        {/* Heading */}
        <Text style={styles.heading}>THANK YOU.</Text>

        {/* Confirmation message */}
        <Text style={styles.message}>
          YOUR ORDER HAS BEEN RECEIVED.{'\n'}A CONFIRMATION EMAIL WILL BE SENT SHORTLY.
        </Text>

        {/* CTA */}
        <View style={styles.ctaWrapper}>
          <GhostButton
            label="CONTINUE SHOPPING"
            onPress={() => router.push('/shop/core' as never)}
          />
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  label: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  heading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 40,
    textTransform: 'uppercase',
    color: colors.goldLight,
    letterSpacing: 4,
    lineHeight: 44,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 12,
    lineHeight: 19.2,
    letterSpacing: 1.0,
    color: colors.gold,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 4,
  },
  ctaWrapper: {
    marginTop: 32,
  },
});
