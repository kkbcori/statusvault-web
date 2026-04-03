// ═══════════════════════════════════════════════════════════════
// Navigation v6 — Light SaaS layout
// White sidebar + white topbar · teal accent · Syne headings
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore } from '../store';
import { RootStackParamList, MainTabParamList } from '../types';

import { OnboardingScreen, DashboardScreen, DocumentsScreen, SettingsScreen } from '../screens';
import { TravelScreen }  from '../screens/TravelScreen';
import { AuthScreen }    from '../screens/AuthScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HelpScreen }       from '../screens/HelpScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { FamilyScreen }     from '../screens/FamilyScreen';
import { ScannerScreen }     from '../screens/ScannerScreen';
import { ChecklistScreen }  from '../screens/ChecklistScreen';
import { CounterScreen }    from '../screens/CounterScreen';
import { VisaToolsScreen }  from '../screens/VisaToolsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();
const IS_WEB = Platform.OS === 'web';

const TAB_ITEMS: Array<{
  name: keyof MainTabParamList;
  label: string;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}> = [
  { name: 'Dashboard', label: 'Home',      active: 'grid',          inactive: 'grid-outline' },
  { name: 'Documents', label: 'Documents', active: 'document-text', inactive: 'document-text-outline' },
  { name: 'Travel',    label: 'Travel',    active: 'airplane',      inactive: 'airplane-outline' },
  { name: 'Settings',  label: 'Settings',  active: 'settings',      inactive: 'settings-outline' },
  { name: 'Family',     label: 'Family',    active: 'people',        inactive: 'people-outline' },
  { name: 'Checklist',  label: 'Checklist', active: 'checkbox',      inactive: 'checkbox-outline' },
  { name: 'Timers',     label: 'Timers',    active: 'timer',         inactive: 'timer-outline' },
  { name: 'VisaTools',  label: 'Visa Tools', active: 'briefcase',    inactive: 'briefcase-outline' },
  { name: 'Processing', label: 'USCIS',     active: 'time',          inactive: 'time-outline' },
  { name: 'Scanner',    label: 'Scan',      active: 'scan',          inactive: 'scan-outline' },
  { name: 'Help',       label: 'Help',      active: 'help-circle',   inactive: 'help-circle-outline' },
];

const NAV_GROUPS = [
  { label: 'MAIN', items: ['Dashboard', 'Documents', 'Travel', 'Family'] },
  { label: 'TOOLS',   items: ['Checklist', 'Timers', 'VisaTools', 'Processing', 'Scanner'] },
  { label: 'ACCOUNT', items: ['Settings', 'Help'] },
];

// ─── Web Sidebar ─────────────────────────────────────────────
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 240;

const WebSidebar: React.FC = () => {
  const navigation = useNavigation<any>();
  const authUser   = useStore((s) => s.authUser);
  const isSyncing  = useStore((s) => s.isSyncing);
  const isPremium  = useStore((s) => s.isPremium);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startW   = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: any) => {
    if (typeof document === 'undefined') return;
    dragging.current = true;
    startX.current   = e.clientX;
    startW.current   = sidebarWidth;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const newW  = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  return (
    <View style={[sidebarStyles.container, { width: sidebarWidth }]}>
      {/* Logo */}
      <View style={sidebarStyles.logoRow}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={sidebarStyles.logoImg}
          resizeMode="contain"
        />
      </View>

      {/* Nav groups */}
      <ScrollView style={sidebarStyles.nav} showsVerticalScrollIndicator={false}>
        {NAV_GROUPS.map((group) => (
          <View key={group.label}>
            <Text style={sidebarStyles.groupLabel}>{group.label}</Text>
            {group.items.map((name) => {
              const item  = TAB_ITEMS.find((t) => t.name === name)!;
              const active = currentRoute === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[sidebarStyles.navItem, active && sidebarStyles.navItemActive]}
                  onPress={() => navigation.navigate('Main', { screen: name })}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={active ? item.active : item.inactive}
                    size={16}
                    color={active ? '#7367F0' : 'rgba(225,222,245,0.55)'}
                    style={sidebarStyles.navIcon}
                  />
                  <Text style={[sidebarStyles.navLabel, active && sidebarStyles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }} />

      {/* Account / profile card — bottom */}
      <TouchableOpacity
        style={sidebarStyles.profileCard}
        onPress={() => authUser ? setShowProfile(true) : navigation.navigate('Auth')}
        activeOpacity={0.8}
      >
        <View style={sidebarStyles.profileAvatar}>
          <Text style={sidebarStyles.profileInitial}>
            {authUser ? authUser.email[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sidebarStyles.profileName} numberOfLines={1}>
            {authUser ? authUser.email : 'Guest User'}
          </Text>
          <Text style={sidebarStyles.profilePlan}>
            {isPremium ? '⭐ Premium' : 'Free Plan'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.text3} />
      </TouchableOpacity>

      {/* Compact upgrade row — free users only, same height as profile card */}
      {!isPremium && (
        <TouchableOpacity
          style={sidebarStyles.upgradeRow}
          onPress={() => navigation.navigate('Documents', { openPaywall: true })}
          activeOpacity={0.85}
        >
          <View style={sidebarStyles.upgradeRowIcon}>
            <Ionicons name="star-outline" size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sidebarStyles.upgradeRowTitle}>Upgrade to Premium</Text>
            <Text style={sidebarStyles.upgradeRowSub}>Unlimited docs · $3.99/yr</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* AES badge — only shown when syncing (encrypted) */}
      {authUser && (
        <View style={sidebarStyles.bottom}>
          <View style={sidebarStyles.syncRow}>
            <View style={[sidebarStyles.syncDot, {
              backgroundColor: isSyncing ? colors.warning : colors.success
            }]} />
            <Text style={sidebarStyles.syncText}>
              {isSyncing ? 'Syncing…' : 'Synced · AES-256 encrypted'}
            </Text>
          </View>
        </View>
      )}

      {/* Drag handle — web only resize */}
      <View
        style={sidebarStyles.resizeHandle}
        onStartShouldSetResponder={() => false}
        {...(typeof window !== 'undefined' ? { onMouseDown } as any : {})}
      >
        <View style={sidebarStyles.resizeBar} />
      </View>
    {/* Profile slide-in panel */}
    {showProfile && (
      <ProfileScreen visible={showProfile} onClose={() => setShowProfile(false)} />
    )}
    </View>
  );
};

// ─── Web Topbar ───────────────────────────────────────────────
const WebTopBar: React.FC = () => {
  const navigation   = useNavigation<any>();
  const authUser     = useStore((s) => s.authUser);
  const isSyncing    = useStore((s) => s.isSyncing);

  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  const item = TAB_ITEMS.find((t) => t.name === currentRoute);

  return (
    <View style={topBarStyles.container}>
      <View style={topBarStyles.left}>
        <Text style={topBarStyles.title}>{item?.label ?? 'Dashboard'}</Text>
      </View>
      <View style={topBarStyles.right}>
        {authUser && (
          <View style={[topBarStyles.pulsePill, isSyncing && topBarStyles.pulsePillSyncing]}>
            <View style={[topBarStyles.pulseDot, {
              backgroundColor: isSyncing ? '#F59E0B' : '#10B981'
            }]} />
            <Text style={[topBarStyles.pulseText, isSyncing && topBarStyles.pulseTextSyncing]}>
              {isSyncing ? 'Syncing' : 'Synced'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={topBarStyles.avatarBtn}
          onPress={() => authUser ? setShowProfile(true) : navigation.navigate('Auth')}
          activeOpacity={0.8}
        >
          <Ionicons name={authUser ? 'person' : 'log-in-outline'} size={16} color={colors.text2} />
        </TouchableOpacity>
      </View>
    {/* Profile slide-in panel */}
    {showProfile && (
      <ProfileScreen visible={showProfile} onClose={() => setShowProfile(false)} />
    )}
    </View>
  );
};

// ─── Main Tabs ───────────────────────────────────────────────
const MainTabs: React.FC = () => (
  <View style={[layoutStyles.root, IS_WEB && { ...layoutStyles.rootWeb, backgroundColor: colors.sidebar }]}>
    {IS_WEB && <WebSidebar />}
    <View style={[layoutStyles.content, IS_WEB && layoutStyles.contentWeb]}>
      {IS_WEB && <WebTopBar />}
      <View style={{ flex: 1, overflow: IS_WEB ? 'hidden' as any : undefined }}>
        <Tab.Navigator
          initialRouteName="Dashboard"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: IS_WEB ? { display: 'none' } : {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 64,
              paddingTop: 6,
              paddingBottom: Platform.OS === 'ios' ? 26 : 8,
              elevation: 0,
            },
            tabBarIcon: ({ focused }) => {
              const t = TAB_ITEMS.find((x) => x.name === route.name)!;
              return (
                <View style={focused ? mobileStyles.activeWrap : undefined}>
                  <Ionicons
                    name={focused ? t.active : t.inactive}
                    size={22}
                    color={focused ? colors.accent : colors.text3}
                  />
                </View>
              );
            },
            tabBarActiveTintColor:   colors.accent,
            tabBarInactiveTintColor: colors.text3,
            tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: -2 },
          })}
        >
          {TAB_ITEMS.map((item) => (
            <Tab.Screen
              key={item.name}
              name={item.name}
              component={
                item.name === 'Dashboard'  ? DashboardScreen  :
                item.name === 'Documents'  ? DocumentsScreen  :
                item.name === 'Travel'     ? TravelScreen     :
                item.name === 'Family'     ? FamilyScreen     :
                item.name === 'Checklist'  ? ChecklistScreen  :
                item.name === 'VisaTools'  ? VisaToolsScreen  :
                item.name === 'Timers'     ? CounterScreen    :
                item.name === 'Processing' ? ProcessingScreen :
                item.name === 'Scanner'    ? ScannerScreen    :
                item.name === 'Help'       ? HelpScreen       : SettingsScreen
              }
              options={{ tabBarLabel: item.label }}
            />
          ))}
        </Tab.Navigator>
      </View>
    </View>
  </View>
);

export const AppNavigator: React.FC = () => {
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!hasOnboarded
          ? <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          : <Stack.Screen name="Main"       component={MainTabs} />
        }
        <Stack.Screen name="Auth"    component={AuthScreen}    options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ── Styles ───────────────────────────────────────────────────
const layoutStyles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.background },
  rootBg:     { backgroundColor: colors.sidebar },
  rootWeb:    { flexDirection: 'row', width: '100%' as any, height: '100%' as any },
  content:    { flex: 1 },
  contentWeb: { flexDirection: 'column', backgroundColor: '#F4F5FA', flex: 1, minWidth: 0, overflow: 'hidden' as any },
});

const sidebarStyles = StyleSheet.create({
  container:     { backgroundColor: '#2F3349', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)', flexDirection: 'column', position: 'relative' as any },
  resizeHandle:  { position: 'absolute' as any, top: 0, right: -4, bottom: 0, width: 8, cursor: 'col-resize' as any, alignItems: 'center', justifyContent: 'center', zIndex: 10 } as any,
  resizeBar:     { width: 1, height: 32, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.08)' } as any,
  logoRow:       { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  logoImg:       { width: 148, height: 42 } as any,
  nav:           { flex: 1, paddingHorizontal: 12, paddingTop: 10, overflowY: 'auto' as any },
  groupLabel:    { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(225,222,245,0.30)', letterSpacing: 1.2, paddingLeft: 8, paddingTop: 20, paddingBottom: 6, textTransform: 'uppercase' as any },
  navItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(115,103,240,0.16)' },
  navIcon:       { marginRight: 10 },
  navLabel:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(225,222,245,0.55)', lineHeight: 20 },
  navLabelActive:{ color: '#7367F0', fontFamily: 'Inter_600SemiBold' },
  upgradeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10, marginBottom: 8, backgroundColor: 'rgba(115,103,240,0.14)', borderWidth: 1, borderColor: 'rgba(115,103,240,0.22)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  upgradeRowIcon:{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(115,103,240,0.22)', alignItems: 'center', justifyContent: 'center' },
  upgradeRowTitle:{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#9E95F5' },
  upgradeRowSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(225,222,245,0.40)', marginTop: 1 },
  profileCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  profileAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#7367F0', alignItems: 'center', justifyContent: 'center' },
  profileInitial:{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  profileName:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(225,222,245,0.87)' },
  profilePlan:   { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(225,222,245,0.45)', marginTop: 1 },
  bottom:        { paddingHorizontal: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  syncRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, paddingLeft: 2 },
  syncDot:       { width: 5, height: 5, borderRadius: 3 },
  syncText:      { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(225,222,245,0.30)' },
});

const topBarStyles = StyleSheet.create({
  container: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#DBDADE', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as any,
  left:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumb:{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5' },
  sep:       { fontSize: 12, color: '#ACAEC5', marginHorizontal: 4 },
  title:     { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulsePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAFFF4', borderWidth: 1, borderColor: '#A3F0C4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pulsePillSyncing: { backgroundColor: '#FFF4E6', borderColor: '#FFD59E' },
  pulseDot:  { width: 6, height: 6, borderRadius: 3 },
  pulseText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#1E9954' },
  pulseTextSyncing: { color: '#CC7A28' },
  avatarBtn: { width: 34, height: 34, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

const mobileStyles = StyleSheet.create({
  activeWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
});
