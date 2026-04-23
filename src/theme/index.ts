// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v10 · Dual Theme
// Dark (Midnight Glass) + Light (Daylight Glass) with live switching
// via a Proxy that reads themeMode from the Zustand store.
// ═══════════════════════════════════════════════════════════════
import { Platform } from 'react-native';
import { useStore } from '../store';

// ─── DARK PALETTE — Midnight Glass (unchanged) ─────────────────
const DARK = {
  primary:      '#3B8BE8',
  primaryLight: '#6FAFF2',
  primaryMid:   '#2D6ABF',
  primaryDark:  '#123A72',
  primaryBg:    'rgba(59,139,232,0.12)',

  accent:       '#3B8BE8',
  accentDim:    'rgba(59,139,232,0.14)',
  accentLight:  'rgba(59,139,232,0.20)',

  gold:         '#F5C053',
  goldDim:      'rgba(245,192,83,0.14)',
  goldDark:     '#E8970A',

  success:      '#4CD98A',
  successLight: 'rgba(76,217,138,0.12)',
  successDark:  '#2FA866',
  warning:      '#F5C053',
  warningLight: 'rgba(245,192,83,0.14)',
  warningDark:  '#CC9628',
  danger:       '#FF6B6B',
  dangerLight:  'rgba(255,107,107,0.14)',
  dangerDark:   '#D84848',
  info:         '#5B9AF5',
  infoLight:    'rgba(91,154,245,0.14)',

  background:     '#0A1530',
  backgroundDeep: '#050B1C',
  card:           'rgba(255,255,255,0.055)',
  cardHover:      'rgba(255,255,255,0.085)',
  cardSolid:      '#0C1A34',

  sidebar:           'rgba(5,11,28,0.92)',
  sidebarDeep:       '#030812',
  sidebarHover:      'rgba(255,255,255,0.05)',
  sidebarActive:     'rgba(59,139,232,0.18)',
  sidebarBorder:     'rgba(255,255,255,0.07)',
  sidebarText:       'rgba(240,244,255,0.55)',
  sidebarTextHover:  'rgba(240,244,255,0.92)',
  sidebarActiveText: '#6FAFF2',
  sidebarIcon:       'rgba(240,244,255,0.50)',
  sidebarIconActive: '#6FAFF2',

  text1:       '#F0F4FF',
  text2:       'rgba(240,244,255,0.80)',
  text3:       'rgba(240,244,255,0.55)',
  text4:       'rgba(240,244,255,0.35)',
  textInverse: '#0A1530',

  border:       'rgba(255,255,255,0.10)',
  borderLight:  'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.18)',
  borderGold:   'rgba(245,192,83,0.28)',

  overlay:  'rgba(3,8,18,0.80)',
  shimmer:  'rgba(255,255,255,0.08)',
} as const;

// ─── LIGHT PALETTE — Daylight Glass ────────────────────────────
const LIGHT = {
  primary:      '#2D6ABF',
  primaryLight: '#3B8BE8',
  primaryMid:   '#1E4E94',
  primaryDark:  '#123A72',
  primaryBg:    'rgba(59,139,232,0.10)',

  accent:       '#3B8BE8',
  accentDim:    'rgba(59,139,232,0.10)',
  accentLight:  'rgba(59,139,232,0.16)',

  gold:         '#CC9628',
  goldDim:      'rgba(204,150,40,0.12)',
  goldDark:     '#8B6316',

  success:      '#2FA866',
  successLight: 'rgba(47,168,102,0.10)',
  successDark:  '#1C7A47',
  warning:      '#CC9628',
  warningLight: 'rgba(204,150,40,0.10)',
  warningDark:  '#8B6316',
  danger:       '#D84848',
  dangerLight:  'rgba(216,72,72,0.10)',
  dangerDark:   '#A03030',
  info:         '#2D6ABF',
  infoLight:    'rgba(45,106,191,0.10)',

  background:     '#F4F7FC',
  backgroundDeep: '#E8EEF7',
  card:           'rgba(255,255,255,0.85)',
  cardHover:      'rgba(255,255,255,0.95)',
  cardSolid:      '#FFFFFF',

  sidebar:           'rgba(255,255,255,0.85)',
  sidebarDeep:       '#FFFFFF',
  sidebarHover:      'rgba(59,139,232,0.06)',
  sidebarActive:     'rgba(59,139,232,0.12)',
  sidebarBorder:     'rgba(10,21,48,0.08)',
  sidebarText:       'rgba(10,21,48,0.60)',
  sidebarTextHover:  'rgba(10,21,48,0.92)',
  sidebarActiveText: '#2D6ABF',
  sidebarIcon:       'rgba(10,21,48,0.55)',
  sidebarIconActive: '#2D6ABF',

  text1:       '#0A1530',
  text2:       'rgba(10,21,48,0.80)',
  text3:       'rgba(10,21,48,0.58)',
  text4:       'rgba(10,21,48,0.38)',
  textInverse: '#FFFFFF',

  border:       'rgba(10,21,48,0.10)',
  borderLight:  'rgba(10,21,48,0.06)',
  borderStrong: 'rgba(10,21,48,0.20)',
  borderGold:   'rgba(204,150,40,0.32)',

  overlay:  'rgba(10,21,48,0.40)',
  shimmer:  'rgba(10,21,48,0.06)',
} as const;

type Palette = typeof DARK;

// ─── Live Proxy that resolves to the active palette ─────────────
const pickPalette = (): Palette => {
  try {
    return useStore.getState().themeMode === 'light' ? (LIGHT as unknown as Palette) : DARK;
  } catch {
    return DARK;
  }
};

export const colors: Palette = new Proxy({} as Palette, {
  get(_t, key: string) { return (pickPalette() as any)[key]; },
  ownKeys() { return Reflect.ownKeys(DARK); },
  getOwnPropertyDescriptor(_t, key) {
    return { enumerable: true, configurable: true, value: (pickPalette() as any)[key as string] };
  },
}) as Palette;

// Hook form — for components that need to re-render on theme change.
export const useThemeColors = (): Palette => {
  const mode = useStore((s) => s.themeMode);
  return mode === 'light' ? (LIGHT as unknown as Palette) : DARK;
};

export const darkPalette  = DARK;
export const lightPalette = LIGHT;

// ─── Spacing / Radius / Typography (unchanged) ─────────────────
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 20,
} as const;

export const radius = {
  sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, full: 999,
} as const;

export const typography = {
  display:      { fontSize: 30, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, lineHeight: 36 },
  h1:           { fontSize: 22, fontFamily: 'Inter_700Bold',      letterSpacing: -0.4, lineHeight: 28 },
  h2:           { fontSize: 17, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2, lineHeight: 24 },
  h3:           { fontSize: 15, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  body:         { fontSize: 14, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: 'Inter_600SemiBold',  lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: 'Inter_600SemiBold',  letterSpacing: 0.6, lineHeight: 14 },
  label:        { fontSize: 11, fontFamily: 'Inter_500Medium',    letterSpacing: 0.3, lineHeight: 16 },
  number:       { fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, lineHeight: 34 },
  numberLarge:  { fontSize: 40, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1.2, lineHeight: 48 },
  mono:         { fontSize: 12, fontFamily: 'Inter_500Medium',    lineHeight: 18 },
} as const;

const glassWeb = (blur: number = 20) => ({
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
} as any);

export const shadows = {
  xs: Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.25)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 2 }, android: { elevation: 1 } }),
  sm: Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.30)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 2 } }),
  md: Platform.select({ web: { boxShadow: '0 8px 28px rgba(0,0,0,0.35)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 16 }, android: { elevation: 4 } }),
  lg: Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.45)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 32 }, android: { elevation: 8 } }),
  xl: Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.45, shadowRadius: 48 }, android: { elevation: 12 } }),
  gold: Platform.select({ web: { boxShadow: '0 4px 24px rgba(59,139,232,0.40), 0 0 0 1px rgba(59,139,232,0.20)' } as any, ios: { shadowColor: '#3B8BE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 18 }, android: { elevation: 6 } }),
  glow: Platform.select({ web: { boxShadow: '0 0 0 3px rgba(59,139,232,0.20), 0 6px 20px rgba(59,139,232,0.30)' } as any, ios: { shadowColor: '#3B8BE8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 14 }, android: { elevation: 4 } }),
  premium: Platform.select({ web: { boxShadow: '0 4px 24px rgba(245,192,83,0.35), 0 0 0 1px rgba(245,192,83,0.25)' } as any, ios: { shadowColor: '#F5C053', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 16 }, android: { elevation: 6 } }),
  glass: Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.20, shadowRadius: 8 }, android: { elevation: 2 } }),
} as const;

export const glass = {
  blur12: Platform.select({ web: glassWeb(12), default: {} as any }),
  blur20: Platform.select({ web: glassWeb(20), default: {} as any }),
  blur30: Platform.select({ web: glassWeb(30), default: {} as any }),
} as const;

export const gradients = {
  primary:     ['#3B8BE8', '#2D6ABF'] as const,
  primaryH:    ['#6FAFF2', '#3B8BE8'] as const,
  dark:        ['#0A1530', '#050B1C'] as const,
  midnight:    ['#0A1530', '#050B1C', '#030812'] as const,
  success:     ['#4CD98A', '#2FA866'] as const,
  danger:      ['#FF6B6B', '#D84848'] as const,
  warning:     ['#F5C053', '#E8970A'] as const,
  premium:     ['#F5C053', '#E8970A', '#C97915'] as const,
  card:        ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
  header:      ['#0A1530', '#0F1F44'] as const,
  brandTrio:   ['#3B8BE8', '#4CD98A', '#F5C053'] as const,
  ambient1:    ['rgba(59,139,232,0.22)', 'transparent'] as const,
  ambient2:    ['rgba(76,217,138,0.15)', 'transparent'] as const,
} as const;
