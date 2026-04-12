export const colors = {
  background: '#111111',
  foreground: '#f5f0e8',
  gold: '#fff3af',
  goldLight: '#fffeca',
  border: '#fff3af',   // CSS var(--border) = #fff3af (gold) per globals.css
  divider: '#2a2a2a',  // used for dark separator lines in RN
  goldBorder: '#fff3af',
  dark: '#080808',
  error: '#ff6b6b',
  success: '#b8f5a0',
} as const;

// Typography presets — converted from CSS class values in globals.css
// letterSpacing in RN = emValue * fontSize (NOT em units)
export const typography = {
  // .label — 8px, 0.3em tracking, uppercase, gold, weight 300
  label: {
    fontSize: 8,
    letterSpacing: 2.4, // 0.3 * 8
    textTransform: 'uppercase' as const,
    color: colors.gold,
    fontWeight: '300' as const,
    fontFamily: 'HelveticaNeue-Light',
  },
  // .body-copy — 13px, 1.7 line-height, 0.04em tracking, foreground, weight 300
  bodyCopy: {
    fontSize: 13,
    lineHeight: 22.1, // 1.7 * 13
    letterSpacing: 0.52, // 0.04 * 13
    color: colors.foreground,
    fontWeight: '300' as const,
    fontFamily: 'HelveticaNeue-Light',
  },
  // .heading — 700, uppercase, gold-light
  heading: {
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    color: colors.goldLight,
    fontFamily: 'HelveticaNeue-Bold',
  },
  // .discover-btn text style — 10px, 300, uppercase, cream
  discoverBtn: {
    fontWeight: '300' as const,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
    color: colors.foreground,
    fontFamily: 'HelveticaNeue-Light',
  },
} as const;

export const spacing = {
  navHeight: 56,
  screenPaddingH: 24,
  screenPaddingV: 20,
} as const;
