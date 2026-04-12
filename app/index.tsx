import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MotiView } from 'moti';
import { apiGet } from '../lib/api';
import GhostButton from '../components/GhostButton';
import { colors, typography } from '../theme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    apiGet<{ urls: string[] }>('/api/hero-vids').then(({ urls }) => {
      if (urls?.length) setVideoUrls(urls);
    }).catch(() => {});
  }, []);

  const player = useVideoPlayer(videoUrls[currentIdx] ?? null, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.root}>
      {/* Background video */}
      {videoUrls.length > 0 && (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      {/* Fallback background when no video yet */}
      {videoUrls.length === 0 && (
        <View style={styles.videoBg} />
      )}

      {/* Bottom gradient overlay for text legibility */}
      <View style={styles.gradient} pointerEvents="none" />

      {/* Intro overlay — SPRTD logo, fades out after delay */}
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1200, duration: 800, type: 'timing' }}
        style={styles.introOverlay}
        pointerEvents="none"
      >
        <Text style={styles.introLogo}>SPRTD</Text>
      </MotiView>

      {/* Content layer */}
      <View style={styles.contentLayer} pointerEvents="box-none">
        {/* Top label */}
        <View style={styles.topLabel}>
          <Text style={[typography.label, styles.seasonLabel]}>S1 APRIL 2026</Text>
        </View>

        {/* Center copy */}
        <View style={styles.centerCopy}>
          <Text style={[typography.heading, styles.heroHeading]}>
            EARNED.{'\n'}NOT GIVEN.
          </Text>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <GhostButton
            label="DISCOVER PRESEASON"
            onPress={() => router.push('/shop/core' as any)}
          />
          <Text style={styles.seasonSub}>APRIL MAY 2026</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width,
    height,
    backgroundColor: colors.background,
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(17,17,17,0.45)',
  },
  introOverlay: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  introLogo: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 28,
    color: colors.gold,
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLabel: {
    paddingTop: 72,
    alignItems: 'center',
  },
  seasonLabel: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: colors.gold,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  centerCopy: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  heroHeading: {
    fontSize: 36,
    letterSpacing: 5,
    textAlign: 'center',
    lineHeight: 48,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 24,
  },
  bottomCta: {
    alignItems: 'center',
    gap: 20,
    paddingBottom: 60,
  },
  seasonSub: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 4,
    color: colors.foreground,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
});
