import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import {
  Canvas,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import GhostButton from '../../components/GhostButton';
import { colors, typography, spacing } from '../../theme';

// ─── Animated Skia radial gradient background ────────────────────────────────

function SkiaBackground() {
  const { width, height } = useWindowDimensions();

  // Slow pulse: opacity cycles between dim (0.04) and bright (0.14)
  const [glowOpacity, setGlowOpacity] = useState(0.06);

  useEffect(() => {
    let rising = true;
    const id = setInterval(() => {
      setGlowOpacity(prev => {
        const next = rising ? prev + 0.004 : prev - 0.004;
        if (next >= 0.14) rising = false;
        if (next <= 0.04) rising = true;
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  const cx = width / 2;
  const cy = height * 0.38; // center of gradient sits at upper 38% of screen
  const radius = Math.max(width, height) * 0.65;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ flex: 1 }}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(cx, cy)}
            r={radius}
            colors={[
              `rgba(255, 243, 175, ${glowOpacity})`,
              colors.background,
            ]}
            positions={[0, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

// ─── Contact modal ────────────────────────────────────────────────────────────

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

function ContactModal({ visible, onClose }: ContactModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit() {
    // TODO: wire to backend / email service
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalLabel}>CONTACT</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHeading}>PARTNER WITH SPRTD</Text>
          <Text style={styles.modalSubheading}>
            Reach out to discuss solutions, partnerships, or sponsorships.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="NAME"
            placeholderTextColor="rgba(245,240,232,0.25)"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="EMAIL"
            placeholderTextColor="rgba(245,240,232,0.25)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="MESSAGE"
            placeholderTextColor="rgba(245,240,232,0.25)"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <GhostButton label="SEND MESSAGE" onPress={handleSubmit} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SolutionsScreen() {
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Skia animated background */}
      <SkiaBackground />

      {/* Contact modal */}
      <ContactModal visible={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Hero content — centered */}
      <View style={styles.heroContent}>
        {/* Page label */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 700, delay: 200 }}
        >
          <Text style={styles.pageLabel}>SOLUTIONS</Text>
        </MotiView>

        {/* Main heading */}
        <MotiView
          from={{ opacity: 0, translateY: -16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 900, delay: 400 }}
        >
          <Text style={styles.heroHeading}>EARN LOYALTY.{'\n'}BUILD TRUST.</Text>
        </MotiView>

        {/* Subheading */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 800, delay: 700 }}
        >
          <Text style={styles.subheading}>
            TOOLS BUILT FOR THE MOVEMENT.{'\n'}BUILT FOR YOUR BUSINESS.
          </Text>
        </MotiView>

        {/* CTAs */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 900 }}
          style={styles.ctaRow}
        >
          <GhostButton
            label="CONTACT US"
            onPress={() => setContactOpen(true)}
            style={styles.ctaButton}
          />
          <GhostButton
            label="VIEW POLICIES"
            onPress={() => router.push('/policies' as never)}
            style={styles.ctaButton}
          />
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPaddingH,
    gap: 20,
  },
  pageLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  heroHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 48,
    textTransform: 'uppercase',
    color: colors.goldLight,
    letterSpacing: -0.5,
    lineHeight: 46,
    textAlign: 'center',
    // Subtle text shadow for legibility over gradient (RN iOS only, Android ignored)
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 24,
  },
  subheading: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 13,
    color: colors.foreground,
    letterSpacing: 1.3,
    lineHeight: 20.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  ctaButton: {
    flex: 1,
  },

  // Contact modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
  },
  modalClose: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 14,
    color: colors.foreground,
    opacity: 0.5,
  },
  modalHeading: {
    ...typography.heading,
    fontSize: 20,
    letterSpacing: 1.0,
  },
  modalSubheading: {
    ...typography.bodyCopy,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 12,
    color: colors.foreground,
    letterSpacing: 0.5,
    backgroundColor: colors.background,
  },
  inputMultiline: {
    height: 88,
    paddingTop: 10,
  },
});
