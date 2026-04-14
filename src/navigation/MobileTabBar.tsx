import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W >= 768 && SCREEN_W < 1024;

// Bottom safe area — hardcoded per platform, no context needed
const SAFE_BOTTOM = Platform.OS === 'ios' ? 20 : 8;

const PRIMARY_TABS = ['Dashboard', 'Documents', 'Travel', 'Settings', 'Family'];
const TABLET_TABS  = ['Dashboard', 'Documents', 'Travel', 'Family', 'Checklist', 'Timers', 'VisaTools', 'Settings'];

const TAB_META: Record<string, { label: string; active: any; inactive: any }> = {
  Dashboard: { label: 'Home',      active: 'grid',                inactive: 'grid-outline' },
  Documents: { label: 'Docs',      active: 'document-text',       inactive: 'document-text-outline' },
  Travel:    { label: 'Travel',    active: 'airplane',            inactive: 'airplane-outline' },
  Family:    { label: 'Family',    active: 'people',              inactive: 'people-outline' },
  Settings:  { label: 'Settings',  active: 'settings',            inactive: 'settings-outline' },
  Checklist: { label: 'Lists',     active: 'checkbox',            inactive: 'checkbox-outline' },
  Timers:    { label: 'Timers',    active: 'timer',               inactive: 'timer-outline' },
  VisaTools: { label: 'Links',     active: 'link',                inactive: 'link-outline' },
  Help:      { label: 'Help',      active: 'help-circle',         inactive: 'help-circle-outline' },
  Contact:   { label: 'Contact',   active: 'mail',                inactive: 'mail-outline' },
};

const VISIBLE = IS_TABLET ? TABLET_TABS : PRIMARY_TABS;

interface Props { state: any; descriptors: any; navigation: any; }

export const MobileTabBar: React.FC<Props> = ({ state, navigation }) => {
  const scaleAnims = useRef(VISIBLE.map(() => new Animated.Value(1))).current;

  const visibleRoutes = state.routes.filter((r: any) => VISIBLE.includes(r.name));
  const currentRoute  = state.routes[state.index]?.name;

  const onPress = (routeName: string, routeKey: string, idx: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx],  { toValue: 1.0,  friction: 4, useNativeDriver: true }),
    ]).start();
    navigation.navigate(routeName);
  };

  return (
    <View style={[s.bar, { paddingBottom: SAFE_BOTTOM }]}>
      <View style={s.topLine} />
      <View style={s.row}>
        {visibleRoutes.map((route: any, i: number) => {
          const meta    = TAB_META[route.name];
          const focused = currentRoute === route.name;
          if (!meta) return null;
          return (
            <Animated.View key={route.key} style={[s.tabWrap, { transform: [{ scale: scaleAnims[i] }] }]}>
              <TouchableOpacity style={s.tab} onPress={() => onPress(route.name, route.key, i)} activeOpacity={1}>
                <View style={[s.iconBox, focused && s.iconBoxActive]}>
                  <Ionicons
                    name={focused ? meta.active : meta.inactive}
                    size={22}
                    color={focused ? '#4F46E5' : '#94A3B8'}
                  />
                  {focused && <View style={s.dot} />}
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
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 12 },
      web:     { boxShadow: '0 -4px 20px rgba(15,23,42,0.07)' } as any,
    }),
  } as any,
  topLine: { height: 0 },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: IS_TABLET ? 24 : 0,
  },
  tabWrap: { flex: 1 },
  tab: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 3,
  } as any,
  iconBox: {
    width: 42,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as any,
  iconBoxActive: {
    backgroundColor: 'rgba(79,70,229,0.10)',
  },
  dot: {
    position: 'absolute',
    bottom: 1,
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
