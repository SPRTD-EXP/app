import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/products';
import { colors, typography, spacing } from '../../theme';

type Tab = 'OVERVIEW' | 'ORDERS' | 'PROFILE';

type Order = {
  id: string;
  total_cents: number;
  status: string;
  created_at: string;
};

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [username, setUsername] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  if (!user) return <Redirect href="/" />;

  const rawDisplay = user.user_metadata?.display_name ?? user.email ?? '';
  const initials = rawDisplay.length >= 2
    ? rawDisplay.slice(0, 2).toUpperCase()
    : rawDisplay.toUpperCase() || '??';
  const memberSince = new Date(user.created_at ?? Date.now())
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();

  // Load orders + count on mount
  useEffect(() => {
    if (!user) return;
    setUsername(user.user_metadata?.display_name ?? '');

    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .then(({ count }) => setOrderCount(count ?? 0));
  }, [user]);

  // Load full order rows when ORDERS tab is opened
  useEffect(() => {
    if (tab !== 'ORDERS') return;
    setOrdersLoading(true);
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
        setOrdersLoading(false);
      });
  }, [tab, user.id]);

  async function handleSave() {
    if (!username.trim()) return;
    setSaveStatus('saving');
    const { error } = await supabase.auth.updateUser({ data: { display_name: username.trim() } });
    setSaveStatus(error ? 'error' : 'saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  // ── TAB BAR ──────────────────────────────────────────────────────────────
  const tabs: Tab[] = ['OVERVIEW', 'ORDERS', 'PROFILE'];

  const TabBar = () => (
    <View style={styles.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t}
          onPress={() => setTab(t)}
          style={styles.tabItem}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
            {t}
          </Text>
          {tab === t && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <ScrollView contentContainerStyle={styles.overviewContainer}>
      {/* Avatar + name */}
      <View style={styles.overviewSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={[typography.label, { fontSize: 10, letterSpacing: 4, marginTop: 12 }]}>
          MEMBER
        </Text>
        <Text style={styles.emailText}>{user.email}</Text>
      </View>

      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.overviewSection}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={[typography.label, { fontSize: 8, marginTop: 4 }]}>ORDERS PLACED</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{itemCount}</Text>
            <Text style={[typography.label, { fontSize: 8, marginTop: 4 }]}>ITEMS IN CART</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Member since + CTAs */}
      <View style={styles.overviewSection}>
        <Text style={[typography.label, { fontSize: 8, marginBottom: 6 }]}>MEMBER SINCE</Text>
        <Text style={[typography.heading, { fontSize: 13, letterSpacing: 3, marginBottom: 28 }]}>
          {memberSince}
        </Text>
        <View style={styles.ctaStack}>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push('/shop')}
            activeOpacity={0.8}
          >
            <Text style={styles.ghostBtnLabel}>VIEW SHOP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push('/movement' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.ghostBtnLabel}>VIEW MOVEMENT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // ── ORDERS ────────────────────────────────────────────────────────────────
  const OrdersTab = () => {
    if (ordersLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} />
        </View>
      );
    }
    if (orders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[typography.heading, { fontSize: 28, letterSpacing: 4 }]}>
            NOTHING YET
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.orderList}
        ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
        ListHeaderComponent={() => (
          <Text style={[typography.label, { fontSize: 9, letterSpacing: 3.6, marginBottom: 20 }]}>
            ORDER HISTORY
          </Text>
        )}
        renderItem={({ item: order }) => (
          <View style={styles.orderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderDate}>
                {new Date(order.created_at)
                  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  .toUpperCase()}
              </Text>
              <Text style={styles.orderStatus}>{order.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderTotal}>{formatPrice(order.total_cents)}</Text>
          </View>
        )}
      />
    );
  };

  // ── PROFILE ───────────────────────────────────────────────────────────────
  const ProfileTab = () => (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      {/* Email */}
      <View style={styles.profileSection}>
        <Text style={[typography.label, { fontSize: 8, marginBottom: 8, textAlign: 'center' }]}>
          EMAIL
        </Text>
        <Text style={styles.profileValue}>{user.email}</Text>
      </View>

      <View style={styles.divider} />

      {/* Username */}
      <View style={styles.profileSection}>
        <Text style={[typography.label, { fontSize: 8, marginBottom: 12, textAlign: 'center' }]}>
          USERNAME
        </Text>
        <View style={styles.usernameRow}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="SET USERNAME"
            placeholderTextColor="rgba(245,240,232,0.3)"
            onSubmitEditing={handleSave}
            returnKeyType="done"
            style={styles.usernameInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={saveStatus === 'saving'}
            style={[styles.saveBtn, saveStatus === 'saving' && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnLabel}>
              {saveStatus === 'saving'
                ? '...'
                : saveStatus === 'saved'
                ? 'SAVED'
                : saveStatus === 'error'
                ? 'ERROR'
                : 'SAVE'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Member since */}
      <View style={styles.profileSection}>
        <Text style={[typography.label, { fontSize: 8, marginBottom: 8, textAlign: 'center' }]}>
          MEMBER SINCE
        </Text>
        <Text style={styles.profileValue}>{memberSince}</Text>
      </View>

      <View style={styles.divider} />

      {/* Sign out */}
      <View style={[styles.profileSection, { paddingBottom: 40 }]}>
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutLabel}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header label */}
      <View style={styles.header}>
        <Text style={[typography.label, { fontSize: 8, letterSpacing: 3.6 }]}>ACCOUNT</Text>
      </View>

      <TabBar />

      <View style={styles.content}>
        {tab === 'OVERVIEW' && <OverviewTab />}
        {tab === 'ORDERS' && <OrdersTab />}
        {tab === 'PROFILE' && <ProfileTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabItem: {
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2.25,
    textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.35)',
  },
  tabLabelActive: {
    color: colors.gold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold,
  },
  // Content area
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.screenPaddingH,
  },
  // Overview
  overviewContainer: {
    paddingBottom: 40,
  },
  overviewSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: spacing.screenPaddingH,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 22,
    color: colors.gold,
    letterSpacing: 2,
  },
  emailText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    color: colors.foreground,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 32,
    color: colors.gold,
  },
  statSep: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  ctaStack: {
    gap: 12,
    width: '100%',
    maxWidth: 200,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.35)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  // Orders
  orderList: {
    padding: spacing.screenPaddingH,
    paddingTop: 28,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  orderDate: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 1.65,
    color: colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  orderStatus: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  orderTotal: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
    color: colors.gold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPaddingH,
  },
  // Profile
  profileContainer: {
    paddingTop: 28,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: spacing.screenPaddingH,
  },
  profileValue: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 13,
    letterSpacing: 1,
    color: colors.foreground,
  },
  usernameRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  usernameInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.foreground,
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.35)',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  saveBtnLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  signOutLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.error,
  },
});
