import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

import MovementSkiaCanvas from '../../components/movement/MovementSkiaCanvas';
import DiamondGrid, { DIAMOND_OFFSETS } from '../../components/movement/DiamondGrid';
import LoginModal from '../../components/LoginModal';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { supabase } from '../../lib/supabase';
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

type Location = {
  id: string;
  name: string;
  city: string;
  type: string;
  niche: string;
};

// ── Grid constants (must match DiamondGrid.tsx) ───────────────────────────────
const CELL   = 120;
const HALF   = 60;
const V_STEP = 60;

// ── Hit-test: grid-space (gx, gy) → nearest niche slug ───────────────────────
function findNicheAtGridPoint(
  gx: number,
  gy: number,
  niches: { label: string; slug: string }[],
): string | null {
  for (let i = 0; i < Math.min(niches.length, DIAMOND_OFFSETS.length); i++) {
    const { dr, dc } = DIAMOND_OFFSETS[i];
    const xOff = (((dr % 2) + 2) % 2) * HALF;
    // Cell centre in group-space
    const cx = dc * CELL + xOff;
    const cy = dr * V_STEP;
    // Manhattan distance in cell-local coords for diamond hit-test
    const dx = Math.abs(gx - cx);
    const dy = Math.abs(gy - cy);
    if (dx + dy <= HALF) {
      return niches[i].slug;
    }
  }
  return null;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MovementScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuth();

  // Data
  const [niches, setNiches] = useState<{ label: string; slug: string }[]>([]);
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // UI state
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Pan / pinch shared values — passed directly to canvas and grid
  const panX       = useSharedValue(0);
  const panY       = useSharedValue(0);
  const scale      = useSharedValue(1);
  const savedPanX  = useSharedValue(0);
  const savedPanY  = useSharedValue(0);
  const savedScale = useSharedValue(1);

  // ── Load roster once ────────────────────────────────────────────────────────
  useEffect(() => {
    apiGet<{ roster: RosterMember[] }>('/api/roster')
      .then(({ roster }) => {
        const seen = new Set<string>();
        const list: { label: string; slug: string }[] = [];
        (roster ?? []).forEach(m => {
          const slug = m.niche.toLowerCase();
          if (!seen.has(slug)) {
            seen.add(slug);
            list.push({ label: m.niche.toUpperCase(), slug });
          }
        });
        setNiches(list);
      })
      .catch(err => console.warn('[Movement] roster fetch failed', err));
  }, []);

  // ── Subscribe state ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !selectedNiche || !modalVisible) {
      setIsSubscribed(false);
      return;
    }
    supabase
      .from('niche_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('niche', selectedNiche)
      .maybeSingle()
      .then(({ data }) => setIsSubscribed(!!data));
  }, [user, selectedNiche, modalVisible]);

  // ── Handle niche tap ────────────────────────────────────────────────────────
  const handleSelectNiche = useCallback((slug: string) => {
    setSelectedNiche(slug);
    setModalVisible(true);
    setLoadingModal(true);

    Promise.all([
      apiGet<{ roster: RosterMember[] }>('/api/roster', { niche: slug }),
      apiGet<{ locations: Location[] }>('/api/locations', { niche: slug }),
    ])
      .then(([{ roster }, { locations: locs }]) => {
        setMembers(roster ?? []);
        setLocations(locs ?? []);
        setLoadingModal(false);
      })
      .catch(err => {
        console.warn('[Movement] modal data fetch failed', err);
        setLoadingModal(false);
      });
  }, []);

  // ── Gesture: inverse transform touch → grid space, find niche ───────────────
  const handleTap = useCallback((ex: number, ey: number) => {
    // Screen → group space → grid space
    const gx = (ex - screenW / 2 - panX.value) / scale.value;
    const gy = (ey - screenH / 2 - panY.value) / scale.value;
    const slug = findNicheAtGridPoint(gx, gy, niches);
    if (slug) handleSelectNiche(slug);
  }, [screenW, screenH, panX, panY, scale, niches, handleSelectNiche]);

  // ── Gesture handlers ────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      'worklet';
      panX.value = savedPanX.value + e.translationX;
      panY.value = savedPanY.value + e.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedPanX.value = panX.value;
      savedPanY.value = panY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      'worklet';
      scale.value = Math.min(2.5, Math.max(0.4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(e => {
      'worklet';
      runOnJS(handleTap)(e.x, e.y);
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  // ── Subscribe toggle ────────────────────────────────────────────────────────
  async function handleSubscribe() {
    if (!user) {
      setModalVisible(false);
      setLoginVisible(true);
      return;
    }
    if (isSubscribed) {
      await supabase
        .from('niche_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('niche', selectedNiche!);
      setIsSubscribed(false);
    } else {
      await supabase
        .from('niche_subscriptions')
        .upsert({ user_id: user.id, niche: selectedNiche! });
      setIsSubscribed(true);
    }
  }

  const activeLabel = niches.find(n => n.slug === selectedNiche)?.label ?? '';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Wave + Grid ── */}
      <GestureDetector gesture={composed}>
        <View style={StyleSheet.absoluteFill}>
          <MovementSkiaCanvas panX={panX} panY={panY} scale={scale} />
          <DiamondGrid
            panX={panX}
            panY={panY}
            scale={scale}
            selectedNiche={selectedNiche}
            niches={niches}
          />
        </View>
      </GestureDetector>

      {/* ── Niche modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea} edges={['bottom']}>
            <View style={styles.modalSheet}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeLabel}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.closeBtn}>×</Text>
                </TouchableOpacity>
              </View>

              {loadingModal ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.gold} />
                </View>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {/* ── Members column ── */}
                  <View style={styles.modalSection}>
                    <Text style={[typography.label, styles.sectionTitle]}>MEMBERS</Text>
                    {members.length === 0 ? (
                      <Text style={[typography.label, { color: colors.gold }]}>
                        NO MEMBERS YET
                      </Text>
                    ) : (
                      <FlatList
                        data={members}
                        keyExtractor={m => m.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item: m }) => (
                          <TouchableOpacity
                            style={styles.memberRow}
                            disabled={!m.active}
                            onPress={() => {
                              if (m.active) {
                                setModalVisible(false);
                                router.push(`/movement/${m.slug}` as never);
                              }
                            }}
                            activeOpacity={0.75}
                          >
                            {/* Avatar */}
                            <View style={styles.avatarWrap}>
                              {m.image_url ? (
                                <Image
                                  source={{ uri: m.image_url }}
                                  style={styles.avatar}
                                  contentFit="cover"
                                />
                              ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]} />
                              )}
                            </View>
                            {/* Info */}
                            <View style={styles.memberInfo}>
                              <Text style={[typography.heading, styles.memberName]}>
                                {m.name}
                              </Text>
                              <Text style={typography.label}>{m.niche.toUpperCase()}</Text>
                              {!!m.bio && (
                                <Text
                                  style={[typography.bodyCopy, styles.memberBio]}
                                  numberOfLines={2}
                                >
                                  {m.bio}
                                </Text>
                              )}
                              {m.active && (
                                <Text style={[typography.label, styles.viewProfile]}>
                                  VIEW PROFILE →
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    )}
                  </View>

                  {/* ── Divider ── */}
                  <View style={styles.columnDivider} />

                  {/* ── Locations column ── */}
                  <View style={styles.modalSection}>
                    <Text style={[typography.label, styles.sectionTitle]}>LOCATIONS</Text>
                    {locations.length === 0 ? (
                      <Text style={[typography.label, { color: colors.gold }]}>
                        COMING SOON.
                      </Text>
                    ) : (
                      locations.map((loc, i) => (
                        <View
                          key={loc.id}
                          style={[
                            styles.locationRow,
                            i < locations.length - 1 && styles.locationRowBorder,
                          ]}
                        >
                          <Text style={typography.bodyCopy}>{loc.name}</Text>
                          <Text style={typography.label}>{loc.city}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* ── Subscribe button ── */}
                  <TouchableOpacity
                    onPress={handleSubscribe}
                    style={styles.subscribeBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.subscribeBtnText}>
                      {isSubscribed ? 'NOTIFIED' : 'STAY NOTIFIED'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Login modal ── */}
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Modal overlay — dark scrim behind sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    backgroundColor: 'transparent',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gold,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold,
  },
  modalTitle: {
    ...typography.label,
    fontSize: 9,
    letterSpacing: 2.88,
  },
  closeBtn: {
    fontSize: 22,
    color: colors.foreground,
    lineHeight: 26,
  },
  loadingBox: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingBottom: 32,
  },

  // Sections
  modalSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  columnDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gold,
    marginHorizontal: 24,
    marginVertical: 8,
  },

  // Member row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    flexShrink: 0,
  },
  avatar: {
    width: 52,
    height: 52,
  },
  avatarPlaceholder: {
    backgroundColor: colors.dark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 14,
    letterSpacing: -0.14,
    lineHeight: 16,
  },
  memberBio: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
  },
  viewProfile: {
    marginTop: 4,
    color: colors.gold,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // Location row
  locationRow: {
    paddingVertical: 12,
    gap: 4,
  },
  locationRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },

  // Subscribe button
  subscribeBtn: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeBtnText: {
    ...typography.discoverBtn,
    letterSpacing: 2.2,
  },
});
