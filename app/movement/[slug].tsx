import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';
import { colors, typography } from '../../theme';

// ── Types ──────────────────────────────────────────────────────────────────────
type RosterMember = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  bio: string;
  image_url: string | null;
  active: boolean;
  instagram_url: string | null;
  tiktok_url: string | null;
};

// ── Social icons (inline SVG-equivalent paths as description strings) ─────────
// Rendered as Text glyphs for zero-dependency icon display
function InstagramIcon() {
  return (
    <Text style={styles.socialIcon}>IG</Text>
  );
}
function TikTokIcon() {
  return (
    <Text style={styles.socialIcon}>TT</Text>
  );
}

// ── Profile page ──────────────────────────────────────────────────────────────
export default function MemberProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [member, setMember] = useState<RosterMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiGet<{ member: RosterMember }>(`/api/roster/${slug}`)
      .then(({ member: m }) => {
        setMember(m ?? null);
        if (!m) setNotFound(true);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centred}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found / Profile locked ───────────────────────────────────────────────
  if (notFound || !member || !member.active) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.lockedContainer}>
          {/* Logo mark */}
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>▲</Text>
          </View>

          <Text style={[typography.label, styles.lockedLabel]}>PROFILE LOCKED</Text>

          {member && (
            <Text style={[typography.heading, styles.lockedName]}>
              {member.name}
            </Text>
          )}
          {member && (
            <Text style={[typography.label, styles.lockedNiche]}>
              {member.niche.toUpperCase()}
            </Text>
          )}

          <Text style={[typography.bodyCopy, styles.lockedNote]}>
            {"THIS PROFILE ISN'T AVAILABLE YET."}
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← BACK TO MOVEMENT</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active profile ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Niche tag */}
        <Text style={[typography.label, styles.nicheTag]}>
          {member.niche.toUpperCase()}
        </Text>

        {/* Member name */}
        <Text style={[typography.heading, styles.memberName]}>
          {member.name}
        </Text>

        {/* Profile photo */}
        {member.image_url ? (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: member.image_url }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </View>
        ) : (
          <View style={[styles.imageWrap, styles.imagePlaceholder]} />
        )}

        {/* Bio */}
        {!!member.bio && (
          <Text style={[typography.bodyCopy, styles.bio]}>{member.bio}</Text>
        )}

        {/* Social links */}
        {(member.instagram_url || member.tiktok_url) && (
          <View style={styles.socialRow}>
            {member.instagram_url && (
              <TouchableOpacity
                onPress={() => Linking.openURL(member.instagram_url!)}
                style={styles.socialBtn}
                activeOpacity={0.75}
              >
                <InstagramIcon />
              </TouchableOpacity>
            )}
            {member.tiktok_url && (
              <TouchableOpacity
                onPress={() => Linking.openURL(member.tiktok_url!)}
                style={styles.socialBtn}
                activeOpacity={0.75}
              >
                <TikTokIcon />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>← BACK TO MOVEMENT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Locked state ────────────────────────────────────────────────────────────
  lockedContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 12,
  },
  logoMark: {
    marginBottom: 28,
    opacity: 0.45,
  },
  logoMarkText: {
    fontSize: 28,
    color: colors.gold,
  },
  lockedLabel: {
    marginBottom: 8,
  },
  lockedName: {
    fontSize: 40,
    letterSpacing: -0.4,
    lineHeight: 38,
    textAlign: 'center',
  },
  lockedNiche: {
    marginBottom: 8,
  },
  lockedNote: {
    textTransform: 'uppercase',
    letterSpacing: 0.78,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 8,
  },

  // ── Active profile ───────────────────────────────────────────────────────────
  profileContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 16,
  },
  nicheTag: {
    marginBottom: 4,
  },
  memberName: {
    fontSize: 42,
    letterSpacing: -0.42,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  imageWrap: {
    width: 200,
    height: 200,
    marginVertical: 8,
    overflow: 'hidden',
  },
  profileImage: {
    width: 200,
    height: 200,
  },
  imagePlaceholder: {
    backgroundColor: colors.dark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  bio: {
    textAlign: 'center',
    maxWidth: 320,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  socialBtn: {
    padding: 8,
  },
  socialIcon: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.foreground,
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    textTransform: 'uppercase',
  },

  // Back button
  backBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  backBtnText: {
    ...typography.discoverBtn,
    letterSpacing: 2.2,
  },
});
