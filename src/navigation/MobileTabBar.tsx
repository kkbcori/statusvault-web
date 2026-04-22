// ═══════════════════════════════════════════════════════════════
// MobileTabBar v2 · Midnight Glass (for native Tab.Navigator)
// ═══════════════════════════════════════════════════════════════
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W >= 768 && SCREEN_W < 1024;

const SAFE_BOTTOM = Platform.OS === 'ios' ? 22 : 10;

const PRIMARY_TABS = ['Dashboard', 'Documents', 'Travel', 'Family', 'Settings'];
const TABLET_TABS  = ['Dashboard', 'Documents', 'Travel', 'Family', 'Checklist', 'Timers', 'VisaTools', 'Settings'];

const TAB_META: Record<string, { label: string; active: any; inactive: any }> = {
  Dashboard: { label: 'Home',      active: 'grid',                inactive: 'grid-outline' },
  Documents: { label: 'Docs',      active: 'document-text',       inactive: 'document-text-outline' },
  Travel:    { label: 'Travel',    active: 'airplane',            inactive: 'airplane-outline' },
  Family:    { label: 'Family',    active: 'people',              inactive: 'people-outline' },
  Settings:  { label: 'More',      active: 'settings',            inactive: 'settings-outline' },
  Checklist: { label: 'Lists',     active: 'checkbox',            inactive: 'checkbox-outline' },
  Timers:    { label: 'Timers',    active: 'timer',               inactive: 'timer-outline' },
  VisaTools: { label: 'Links',     active: 'link',                inactive: 'link-outline' },
  Help:      { label: 'Help',      active: 'help-circle',         inactive: 'help-circle-outline' },
  Contact:   { label: 'Contact',   active: 'mail',                inactive: 'mail-outline' },
};

const VISIBLE = IS_TABLET ? TABLET_TABS : PRIMARY_TABS;

interface Props { state: any; descriptors: any; navigation: any; }

export const MobileTabBar: React.FC<Props> = ({ state, navigation }) => {
  const scaleAnims = useRef(
    Object.fromEntries(VISIBLE.map((name) => [name, new Animated.Value(1)]))
  ).current;

  const visibleRoutes = state.routes.filter((r: any) => VISIBLE.includes(r.name));
  const currentRoute  = state.routes[state.index]?.name;

  const onPress = (routeName: string) => {
    const anim = (scaleAnims as any)[routeName];
    if (anim) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.spring(anim, { toValue: 1.0, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    navigation.navigate(routeName);
  };

  return (
    <View style={[s.wrapper, { paddingBottom: SAFE_BOTTOM }]}>
      <View style={s.bar}>
        <View style={s.row}>
          {visibleRoutes.map((route: any) => {
            const meta    = TAB_META[route.name];
            const focused = currentRoute === route.name;
            if (!meta) return null;
            const anim = (scaleAnims as any)[route.name];
            return (
              <Animated.View key={route.key} style={[s.tabWrap, { transform: [{ scale: anim ?? 1 }] }]}>
                <TouchableOpacity style={s.tab} onPress={() => onPress(route.name)} activeOpacity={1}>
                  <View style={[s.iconBox, focused && s.iconBoxActive]}>
                    <Ionicons
                      name={focused ? meta.active : meta.inactive}
                      size={20}
                      color={focused ? colors.primaryLight : 'rgba(240,244,255,0.50)'}
                    />
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
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    flexShrink: 0,
    paddingHorizontal: IS_TABLET ? 32 : 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: 'rgba(8,16,36,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingTop: 6,
    paddingBottom: 6,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.35, shadowRadius: 18 },
      android: { elevation: 14 },
      web:     {
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 10px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
      } as any,
    }),
  } as any,
  row:      { flexDirection: 'row', paddingHorizontal: IS_TABLET ? 12 : 0 },
  tabWrap:  { flex: 1 },
  tab:      { alignItems: 'center', paddingVertical: 2, gap: 2 } as any,
  iconBox:  { width: 44, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' } as any,
  iconBoxActive: {
    backgroundColor: 'rgba(59,139,232,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(111,175,242,0.32)',
  } as any,
  label:       { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.48)', letterSpacing: 0.2 },
  labelActive: { color: colors.primaryLight, fontFamily: 'Inter_700Bold' },
});
