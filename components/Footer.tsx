import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme';

type FooterProps = {
  onContactPress: () => void;
};

const SOCIAL_LINKS = [
  {
    id: 'instagram',
    url: 'https://instagram.com/sprtd.co',
    icon: <Ionicons name="logo-instagram" size={18} color={colors.foreground} />,
  },
  {
    id: 'tiktok',
    url: 'https://tiktok.com/@sprtd.co',
    icon: <FontAwesome5 name="tiktok" size={16} color={colors.foreground} />,
  },
  {
    id: 'youtube',
    url: 'https://www.youtube.com/@SPRTD.LIVE3',
    icon: <Ionicons name="logo-youtube" size={20} color={colors.foreground} />,
  },
  {
    id: 'discord',
    url: 'https://discord.gg/8hVgS4N5',
    icon: <FontAwesome5 name="discord" size={18} color={colors.foreground} />,
  },
] as const;

export default function Footer({ onContactPress }: FooterProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 480;

  const handleSocial = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const socialsRow = (
    <View style={styles.socialRow}>
      {SOCIAL_LINKS.map(s => (
        <TouchableOpacity
          key={s.id}
          onPress={() => handleSocial(s.url)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.socialBtn}
        >
          {s.icon}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.footer}>
      {isWide ? (
        // Wide layout: 3 columns
        <View style={styles.row}>
          <View style={styles.colLeft}>
            <TouchableOpacity onPress={onContactPress}>
              <Text style={styles.footerLink}>CONTACT</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.colCenter}>
            {socialsRow}
          </View>
          <View style={styles.colRight}>
            <TouchableOpacity onPress={() => router.push('/policies' as any)}>
              <Text style={styles.footerLink}>POLICIES</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Narrow/mobile: stacked
        <View style={styles.stack}>
          <TouchableOpacity onPress={onContactPress}>
            <Text style={styles.footerLink}>CONTACT</Text>
          </TouchableOpacity>
          {socialsRow}
          <TouchableOpacity onPress={() => router.push('/policies' as any)}>
            <Text style={styles.footerLink}>POLICIES</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.copyright}>
        © 2026 SPRTD. ALL RIGHTS RESERVED.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.dark,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  colCenter: {
    flex: 1,
    alignItems: 'center',
  },
  colRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stack: {
    alignItems: 'center',
    gap: 20,
  },
  footerLink: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 3,       // ~tracking-widest
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  socialBtn: {
    opacity: 1,
  },
  copyright: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.8,     // 0.2 * 9
    color: colors.foreground,
    textTransform: 'uppercase',
  },
});
