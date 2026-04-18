import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const allLinks = [
  { href: '/movement', label: 'MOVEMENT' },
  { href: '/shop',     label: 'SHOP' },
  { href: '/live',     label: 'LIVE' },
  { href: '/about',    label: 'ABOUT' },
  { href: '/solutions', label: 'SOLUTIONS' },
] as const;

const leftLinks  = allLinks.slice(0, 3);
const rightLinks = allLinks.slice(3);

type NavbarProps = {
  onLoginPress: () => void;
  onCartPress: () => void;
  /** Pass the ScrollView/FlatList scroll ref if you want opacity-on-scroll behavior. */
  scrollY?: Animated.Value;
};

function CartIcon({ color }: { color: string }) {
  // Simple shopping bag shape using View borders
  return (
    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
      {/* Bag body */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 13,
        borderWidth: 1.5,
        borderColor: color,
        borderTopLeftRadius: 1,
        borderTopRightRadius: 1,
      }} />
      {/* Handle arc — approximated with top border */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 4,
        right: 4,
        height: 7,
        borderTopWidth: 1.5,
        borderLeftWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: color,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
      }} />
    </View>
  );
}

function HamburgerLine({ style }: { style?: object }) {
  return <View style={[styles.hamburgerLine, style]} />;
}

export default function Navbar({ onLoginPress, onCartPress, scrollY }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll-based opacity: if scrollY is provided, reduce opacity slightly
  const bgOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [0.92, 1],
        extrapolate: 'clamp',
      })
    : undefined;

  const handleNavPress = useCallback(
    (href: string) => {
      setMenuOpen(false);
      router.push(href as any);
    },
    [router],
  );

  const handleAuthPress = useCallback(() => {
    if (user) {
      router.push('/account' as any);
    } else {
      onLoginPress();
    }
  }, [user, router, onLoginPress]);

  return (
    <>
      <Animated.View
        style={[
          styles.nav,
          bgOpacity ? { opacity: bgOpacity } : undefined,
        ]}
      >
        {/* Left nav links */}
        <View style={styles.leftSection}>
          {/* Desktop-style layout: show links on wider screens */}
          <View style={styles.desktopLinks}>
            {leftLinks.map(link => (
              <TouchableOpacity
                key={link.href}
                onPress={() => handleNavPress(link.href)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.navLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Mobile: hamburger */}
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => setMenuOpen(o => !o)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {menuOpen ? (
              // X icon
              <>
                <HamburgerLine style={styles.hamburgerLineOpen1} />
                <HamburgerLine style={styles.hamburgerLineHidden} />
                <HamburgerLine style={styles.hamburgerLineOpen3} />
              </>
            ) : (
              <>
                <HamburgerLine />
                <HamburgerLine />
                <HamburgerLine />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Center: Logo */}
        <TouchableOpacity
          onPress={() => router.push('/' as any)}
          style={styles.logoContainer}
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text style={styles.logoText}>SPRTD</Text>
        </TouchableOpacity>

        {/* Right section */}
        <View style={styles.rightSection}>
          <View style={styles.desktopLinks}>
            {rightLinks.map(link => (
              <TouchableOpacity
                key={link.href}
                onPress={() => handleNavPress(link.href)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.navLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Auth */}
          <TouchableOpacity
            onPress={handleAuthPress}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.navLink}>{user ? 'ACCOUNT' : 'LOGIN'}</Text>
          </TouchableOpacity>

          {/* Cart */}
          <TouchableOpacity
            onPress={onCartPress}
            style={styles.cartButton}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <CartIcon color={colors.foreground} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {itemCount > 9 ? '9+' : itemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Mobile full-screen overlay menu — 3-zone layout matching website */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          {/* Zone 1: Top bar — logo centered, × at right, mirrors navbar height */}
          <View style={styles.overlayTopBar}>
            <TouchableOpacity onPress={() => { setMenuOpen(false); handleNavPress('/'); }}>
              <Text style={styles.overlayLogo}>SPRTD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.overlayClose}
              onPress={() => setMenuOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.overlayCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Zone 2: Nav links — full-width, 64px touch targets */}
          <View style={styles.overlayLinks}>
            {allLinks.map(link => (
              <TouchableOpacity
                key={link.href}
                onPress={() => handleNavPress(link.href)}
                style={styles.overlayLinkBtn}
              >
                <Text style={styles.overlayLink}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Zone 3: Login / Account — ghost button at bottom */}
          <View style={styles.overlayBottom}>
            {!user ? (
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); onLoginPress(); }}
                style={styles.overlayAuthBtn}
              >
                <Text style={styles.overlayAuthText}>LOGIN</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleNavPress('/account')}
                style={styles.overlayAuthBtn}
              >
                <Text style={styles.overlayAuthText}>ACCOUNT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: spacing.navHeight,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  desktopLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    // Hidden on mobile — we rely on hamburger
    display: 'none',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.navHeight,
    // Pointer events none so touches pass through to left/right sections
    pointerEvents: 'box-none',
  },
  logoText: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 4,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  navLink: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10.5,
    letterSpacing: 1.89, // 0.18 * 10.5
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  hamburger: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    gap: 5,
  },
  hamburgerLine: {
    height: 1,
    backgroundColor: colors.foreground,
  },
  hamburgerLineHidden: {
    opacity: 0,
    transform: [{ scaleX: 0 }],
  },
  hamburgerLineOpen1: {
    transform: [{ rotate: '45deg' }, { translateY: 6 }],
  },
  hamburgerLineOpen3: {
    transform: [{ rotate: '-45deg' }, { translateY: -6 }],
  },
  cartButton: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 8,
    color: colors.background,
    lineHeight: 10,
  },
  // Overlay / mobile menu — 3-zone layout
  overlay: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Zone 1: top bar mirrors navbar
  overlayTopBar: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlayLogo: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 4,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  overlayClose: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCloseText: {
    fontSize: 28,
    color: colors.foreground,
    lineHeight: 32,
  },
  // Zone 2: full-width nav links
  overlayLinks: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayLinkBtn: {
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  overlayLink: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 5.4,
    color: colors.foreground,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Zone 3: login/account at bottom
  overlayBottom: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  overlayAuthBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.35)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayAuthText: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 3.3,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
});
