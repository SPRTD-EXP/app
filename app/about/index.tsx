import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import GhostButton from '../../components/GhostButton';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { colors, typography, spacing } from '../../theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    name: 'SPRTD.CO',
    tag: 'CLOTHING',
    description:
      'The clothing. Aiming for comfort and excellence for its wearer, the pieces are meant to be worn by those who lead and represent change around us.',
    href: '/shop',
  },
  {
    name: 'SPRTD.LIVE',
    tag: 'EVENTS',
    description:
      'The broadcasts. Events that highlight the prodigies that shine under pressure. These unique challenges encourage viewers and participants to focus their efforts on being the best in the fields that they love.',
    href: '/live',
  },
  {
    name: 'SPRTD.MOVEMENT',
    tag: 'COMMUNITY',
    description:
      'The manifestations. These faces and places represent what SPRTD stands for. Chosen to curate and enforce opportunities for people to lead.',
    href: '/movement',
  },
  {
    name: 'SPRTD.SOLUTIONS',
    tag: 'PROJECTS',
    description:
      'The answers. Providing the software necessary to improve the lives and efforts of the dedicated.',
    href: '/solutions',
  },
];

const STORY_PARAGRAPHS = [
  "SPRTD started with a simple observation: talent exists everywhere. Recognition doesn't.",
  "We built this for the barber grinding 14-hour days. The athlete training before sunrise. The photographer who's still waiting for their shot. Every niche has a movement — we're here to document it.",
  'Season 1 is just the beginning. Every face on the roster earned it. Every product dropped means something. This isn\'t a brand trying to sell you a lifestyle. This is the lifestyle.',
];

// ─── Animated section wrapper ─────────────────────────────────────────────────

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 700, delay }}
    >
      {children}
    </MotiView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { onScroll } = useScrollAnimation();

  // Use 2-column grid on wide screens (tablets), single column otherwise
  const useGrid = width >= 600;
  const cardWidth = useGrid ? (width - spacing.screenPaddingH * 2 - 12) / 2 : width - spacing.screenPaddingH * 2;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ── SECTION 1: HERO ────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <FadeInSection delay={100}>
            <Text style={styles.pageLabel}>ABOUT</Text>
          </FadeInSection>

          <FadeInSection delay={300}>
            <Text style={styles.heroHeading}>
              EARNED.{'\n'}
              <Text style={styles.heroHeadingGold}>NOT GIVEN.</Text>
            </Text>
          </FadeInSection>

          <FadeInSection delay={500}>
            <Text style={styles.missionText}>
              SPRTD IS THE FOUNDATION CONNECTING LEADERS, BUSINESSES, AND COMMUNITIES ACROSS EVERY WALK OF LIFE. BUILT ON THE BELIEF THAT PRESTIGE IS EARNED. THROUGH COMPETITION, DEDICATION, AND PASSION. NOT PURCHASED. NOT GIVEN. EARNED.
            </Text>
          </FadeInSection>
        </View>

        {/* ── SECTION 2: STORY ───────────────────────────────────────────── */}
        <View style={styles.storySection}>
          <FadeInSection delay={0}>
            <Text style={styles.sectorLabel}>OUR STORY</Text>
          </FadeInSection>

          {STORY_PARAGRAPHS.map((para, i) => (
            <FadeInSection key={i} delay={i * 120}>
              <Text style={styles.storyPara}>{para}</Text>
            </FadeInSection>
          ))}
        </View>

        {/* ── SECTION 3: PILLARS ─────────────────────────────────────────── */}
        <View style={styles.pillarsSection}>
          <FadeInSection delay={0}>
            <Text style={styles.sectorLabel}>SECTORS</Text>
          </FadeInSection>

          <View style={[styles.pillarsGrid, useGrid && styles.pillarsGridWrap]}>
            {PILLARS.map((pillar, i) => (
              <FadeInSection key={pillar.name} delay={i * 100}>
                <View style={[styles.pillarCard, { width: cardWidth }]}>
                  <Text style={styles.pillarTag}>{pillar.tag}</Text>
                  <Text style={styles.pillarName}>{pillar.name}</Text>
                  <Text style={styles.pillarDesc}>{pillar.description}</Text>
                </View>
              </FadeInSection>
            ))}
          </View>
        </View>

        {/* ── SECTION 4: MANIFESTO ───────────────────────────────────────── */}
        <View style={styles.manifestoSection}>
          <FadeInSection delay={0}>
            <Text style={styles.sectorLabel}>FOUNDATION</Text>
          </FadeInSection>

          <FadeInSection delay={150}>
            <Text style={styles.manifestoHeading}>
              LEAD IN{'\n'}YOUR OWN WAY.
            </Text>
          </FadeInSection>

          <FadeInSection delay={300}>
            <Text style={styles.manifestoBody}>
              Prestige is built through participation. Every product, every event, every roster spot — earned. Not given. Not purchased. SPRTD is the infrastructure for what you've already built.
            </Text>
          </FadeInSection>

          <FadeInSection delay={450}>
            <View style={styles.ctaRow}>
              <GhostButton
                label="SHOP NOW"
                onPress={() => router.push('/shop' as never)}
                style={styles.ctaButton}
              />
              <GhostButton
                label="VIEW MOVEMENT"
                onPress={() => router.push('/movement' as never)}
                style={styles.ctaButton}
              />
            </View>
          </FadeInSection>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingH,
  },

  // Hero
  heroSection: {
    minHeight: 480,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 72,
    paddingBottom: 60,
    gap: 24,
  },
  pageLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.8,
    textAlign: 'center',
  },
  heroHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 64,
    textTransform: 'uppercase',
    color: colors.foreground,
    letterSpacing: -1.2,
    lineHeight: 58,
    textAlign: 'center',
  },
  heroHeadingGold: {
    color: colors.gold,
  },
  missionText: {
    ...typography.bodyCopy,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.66,
    textAlign: 'center',
    maxWidth: 360,
  },

  // Story
  storySection: {
    paddingVertical: 48,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 20,
    alignItems: 'center',
  },
  sectorLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  storyPara: {
    ...typography.bodyCopy,
    textAlign: 'center',
    maxWidth: 520,
  },

  // Pillars
  pillarsSection: {
    paddingVertical: 48,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
    gap: 16,
  },
  pillarsGrid: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  pillarsGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pillarCard: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 20,
    gap: 8,
  },
  pillarTag: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
    color: colors.gold,
    opacity: 0.7,
  },
  pillarName: {
    ...typography.heading,
    fontSize: 16,
    letterSpacing: -0.16,
    lineHeight: 18,
  },
  pillarDesc: {
    ...typography.bodyCopy,
    fontSize: 11,
    lineHeight: 18.7,
    marginTop: 4,
  },

  // Manifesto
  manifestoSection: {
    paddingVertical: 72,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
    gap: 20,
  },
  manifestoHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 52,
    textTransform: 'uppercase',
    color: colors.goldLight,
    letterSpacing: -1.0,
    lineHeight: 48,
    textAlign: 'center',
  },
  manifestoBody: {
    ...typography.bodyCopy,
    textAlign: 'center',
    maxWidth: 480,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  ctaButton: {
    flex: 1,
  },

  bottomPad: {
    height: 48,
  },
});
