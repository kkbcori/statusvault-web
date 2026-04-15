// StandaloneTabBar — renders OUTSIDE Tab.Navigator so Chrome can't clip it
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W >= 768 && SCREEN_W < 1024;

const SAFE_BOTTOM = Platform.OS === 'ios' ? 20 : 8;

const TABS = [
  { name: 'Dashboard', label: 'Home',     active: 'grid'           as any, inactive: 'grid-outline'            as any },
  { name: 'Documents', label: 'Docs',     active: 'document-text'  as any, inactive: 'document-text-outline'   as any },
  { name: 'Travel',    label: 'Travel',   active: 'airplane'       as any, inactive: 'airplane-outline'        as any },
  { name: 'Settings',  label: 'Settings', active: 'settings'       as any, inactive: 'settings-outline'        as any },
  { name: 'Family',    label: 'Family',   active: 'people'         as any, inactive: 'people-outline'          as any },
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
  const scaleAnims = useRef(VISIBLE.map(() => new Animated.Value(1))).current;

  const currentRoute = useNavigationState((state) => {
    const main = state?.routes?.find((r: any) => r.name === 'Main');
    const tabState = (main?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  const onPress = (name: string, idx: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx], { toValue: 1.0, friction: 4, useNativeDriver: true }),
    ]).start();
    navigation.navigate('Main', { screen: name });
  };

  return (
    <View style={[s.bar, { paddingBottom: SAFE_BOTTOM }]}>
      <View style={s.row}>
        {VISIBLE.map((tab, i) => {
          const focused = currentRoute === tab.name;
          return (
            <Animated.View key={tab.name} style={[s.tabWrap, { transform: [{ scale: scaleAnims[i] }] }]}>
              <TouchableOpacity style={s.tab} onPress={() => onPress(tab.name, i)} activeOpacity={1}>
                <View style={[s.iconBox, focused && s.iconBoxActive]}>
                  <Ionicons
                    name={focused ? tab.active : tab.inactive}
                    size={22}
                    color={focused ? '#4F46E5' : '#94A3B8'}
                  />
                  {focused && <View style={s.dot} />}
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
  );
};

const s = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.9)',
    paddingTop: 8,
    flexShrink: 0,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 12 },
      web:     { boxShadow: '0 -2px 16px rgba(15,23,42,0.07)' } as any,
    }),
  } as any,
  row:          { flexDirection: 'row', paddingHorizontal: IS_TABLET ? 24 : 0 },
  tabWrap:      { flex: 1 },
  tab:          { alignItems: 'center', paddingBottom: 4, gap: 2 } as any,
  iconBox:      { width: 42, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' } as any,
  iconBoxActive:{ backgroundColor: 'rgba(79,70,229,0.10)' },
  dot:          { position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5' } as any,
  label:        { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94A3B8', letterSpacing: 0.1 },
  labelActive:  { color: '#4F46E5', fontFamily: 'Inter_600SemiBold' },
});
