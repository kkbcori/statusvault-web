// ═══════════════════════════════════════════════════════════════
// StandaloneTabBar v2 · Midnight Glass
// Floating dark-glass pill tab bar · renders OUTSIDE Tab.Navigator
// ═══════════════════════════════════════════════════════════════
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { colors } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W >= 768 && SCREEN_W < 1024;

const SAFE_BOTTOM = Platform.OS === 'ios' ? 22 : 10;

const TABS = [
  { name: 'Dashboard', label: 'Home',     active: 'grid'           as any, inactive: 'grid-outline'            as any },
  { name: 'Documents', label: 'Docs',     active: 'document-text'  as any, inactive: 'document-text-outline'   as any },
  { name: 'Travel',    label: 'Travel',   active: 'airplane'       as any, inactive: 'airplane-outline'        as any },
  { name: 'Family',    label: 'Family',   active: 'people'         as any, inactive: 'people-outline'          as any },
  { name: 'Settings',  label: 'More',     active: 'settings'       as any, inactive: 'settings-outline'        as any },
];

const TABLET_TABS = [
  ...TABS,
  { name: 'Checklist', label: 'Lists',  active: 'checkbox' as any, inactive: 'checkbox-outline' as any },
  { name: 'Timers',    label: 'Timers', active: 'timer'    as any, inactive: 'timer-outline'    as any },
  { name: 'VisaTools', label: 'Links',  active: 'link'     as any, inactive: 'link-outline'     as any },
];

const VISIBLE = IS_TABLET ? TABLET_TABS : TABS;

export const StandaloneTabBar: React.FC = () => {
  const navigation = useNavigation<any>();
  const scaleAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(VISIBLE.map((tab) => [tab.name, new Animated.Value(1)]))
  ).current;

  const currentRoute = useNavigationState((state) => {
    const main = state?.routes?.find((r: any) => r.name === 'Main');
    const tabState = (main?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  const onPress = (name: string) => {
    const anim = scaleAnims[name];
    if (anim) Animated.sequence([
      Animated.timing(anim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1.0, friction: 4, useNativeDriver: true }),
    ]).start();
    navigation.navigate('Main', { screen: name });
  };

  return (
    <View style={[s.wrapper, { paddingBottom: SAFE_BOTTOM }]}>
      {/* Glass pill */}
      <View style={s.bar}>
        <View style={s.row}>
          {VISIBLE.map((tab) => {
            const focused = currentRoute === tab.name;
            return (
              <Animated.View
                key={tab.name}
                style={[s.tabWrap, { transform: [{ scale: scaleAnims[tab.name] ?? new Animated.Value(1) }] }]}
              >
                <TouchableOpacity style={s.tab} onPress={() => onPress(tab.name)} activeOpacity={1}>
                  <View style={[s.iconBox, focused && s.iconBoxActive]}>
                    <Ionicons
                      name={focused ? tab.active : tab.inactive}
                      size={20}
                      color={focused ? colors.primaryLight : 'rgba(240,244,255,0.50)'}
                    />
                  </View>
                  <Text style={[s.label, focused && s.labelActive]} numberOfLines={1}>
                    {tab.label}
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
    ...Platform.select({
      // On web: pin to bottom of viewport so it never clips
      web: { position: 'sticky' as any, bottom: 0, zIndex: 999 } as any,
      default: {},
    }),
  } as any,
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
    ...Platform.select({ web: { boxShadow: '0 0 16px rgba(59,139,232,0.35)' } as any, default: {} }),
  } as any,
  label:       { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.48)', letterSpacing: 0.2 },
  labelActive: { color: colors.primaryLight, fontFamily: 'Inter_700Bold' },
});
