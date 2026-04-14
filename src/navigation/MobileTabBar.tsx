// ═══════════════════════════════════════════════════════════════
// MobileTabBar — Custom premium bottom tab bar
// Shows 5 primary tabs. Secondary tabs accessible via "More" 
// which navigates to Settings (they appear in sidebar on web).
// Pure aesthetic component — no logic changes.
// ═══════════════════════════════════════════════════════════════
import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W >= 768;

// Primary tabs always visible
const PRIMARY = ['Dashboard', 'Documents', 'Travel', 'Family', 'Settings'];

// All tab metadata
const TAB_META: Record<string, { label: string; active: any; inactive: any }> = {
  Dashboard: { label: 'Home',      active: 'grid',            inactive: 'grid-outline' },
  Documents: { label: 'Docs',      active: 'document-text',   inactive: 'document-text-outline' },
  Travel:    { label: 'Travel',    active: 'airplane',        inactive: 'airplane-outline' },
  Family:    { label: 'Family',    active: 'people',          inactive: 'people-outline' },
  Checklist: { label: 'Lists',     active: 'checkbox',        inactive: 'checkbox-outline' },
  Timers:    { label: 'Timers',    active: 'timer',           inactive: 'timer-outline' },
  VisaTools: { label: 'Links',     active: 'link',            inactive: 'link-outline' },
  Help:      { label: 'Help',      active: 'help-circle',     inactive: 'help-circle-outline' },
  Contact:   { label: 'Contact',   active: 'mail',            inactive: 'mail-outline' },
  Settings:  { label: 'Settings',  active: 'settings',        inactive: 'settings-outline' },
};

// On tablet, show more tabs
const VISIBLE_TABS = IS_TABLET
  ? ['Dashboard', 'Documents', 'Travel', 'Family', 'Checklist', 'Timers', 'VisaTools', 'Settings']
  : PRIMARY;

interface Props {
  state: any;
  descriptors: any;
  navigation: any;
}

export const MobileTabBar: React.FC<Props> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const scaleAnims = useRef(
    VISIBLE_TABS.map(() => new Animated.Value(1))
  ).current;

  const onPress = (routeName: string, routeKey: string, index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnims[index],  { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const currentRoute = state.routes[state.index]?.name;
  const visibleRoutes = state.routes.filter((r: any) => VISIBLE_TABS.includes(r.name));

  const TAB_W = IS_TABLET
    ? Math.min(90, SCREEN_W / VISIBLE_TABS.length)
    : SCREEN_W / VISIBLE_TABS.length;

  return (
    <View style={[
      s.container,
      { paddingBottom: Math.max(insets.bottom, 8) },
      IS_TABLET && s.containerTablet,
    ]}>
      {/* Glass blur background */}
      <View style={s.backdrop} />

      {/* Top separator */}
      <View style={s.topBorder} />

      <View style={[s.row, IS_TABLET && s.rowTablet]}>
        {visibleRoutes.map((route: any, i: number) => {
          const meta    = TAB_META[route.name];
          const focused = currentRoute === route.name;
          if (!meta) return null;

          return (
            <Animated.View
              key={route.key}
              style={[s.tabWrap, { transform: [{ scale: scaleAnims[i] }] }, IS_TABLET && { width: TAB_W }]}
            >
              <TouchableOpacity
                style={s.tab}
                onPress={() => onPress(route.name, route.key, i)}
                activeOpacity={0.8}
                accessibilityLabel={meta.label}
                accessibilityRole="button"
              >
                <View style={[s.iconWrap, focused && s.iconWrapActive]}>
                  <Ionicons
                    name={focused ? meta.active : meta.inactive}
                    size={IS_TABLET ? 24 : 22}
                    color={focused ? '#4F46E5' : '#94A3B8'}
                  />
                  {focused && <View style={s.activeDot} />}
                </View>
                <Text style={[s.label, focused && s.labelActive]} numberOfLines={1}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 0,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  } as any,
  containerTablet: {
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,255,0.96)',
  },
  topBorder: {
    height: 1,
    backgroundColor: 'rgba(226,232,240,0.8)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  rowTablet: {
    justifyContent: 'center',
  },
  tabWrap: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 3,
  } as any,
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as any,
  iconWrapActive: {
    backgroundColor: 'rgba(79,70,229,0.10)',
  },
  activeDot: {
    position: 'absolute',
    bottom: -1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  } as any,
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
  },
});
