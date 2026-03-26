// ═══════════════════════════════════════════════════════════════
// Navigation v5 — Responsive web layout
// Web:    left sidebar (240px) + full-width content area
// Mobile: standard bottom tabs (unchanged)
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { useStore } from '../store';
import { RootStackParamList, MainTabParamList } from '../types';

import { OnboardingScreen, DashboardScreen, DocumentsScreen, SettingsScreen } from '../screens';
import { TravelScreen }  from '../screens/TravelScreen';
import { AuthScreen }    from '../screens/AuthScreen';
import { HelpScreen }    from '../screens/HelpScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

const IS_WEB = Platform.OS === 'web';

const TAB_ITEMS: Array<{
  name: keyof MainTabParamList;
  label: string;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}> = [
  { name: 'Dashboard', label: 'Home',      active: 'earth',         inactive: 'earth-outline' },
  { name: 'Documents', label: 'Documents', active: 'document-text', inactive: 'document-text-outline' },
  { name: 'Travel',    label: 'Travel',    active: 'airplane',      inactive: 'airplane-outline' },
  { name: 'Settings',  label: 'Settings',  active: 'settings',      inactive: 'settings-outline' },
  { name: 'Help',      label: 'Help',      active: 'help-circle',   inactive: 'help-circle-outline' },
];

// ─── Web Sidebar ─────────────────────────────────────────────
const WebSidebar: React.FC = () => {
  const navigation = useNavigation<any>();
  const authUser   = useStore((s) => s.authUser);
  const isSyncing  = useStore((s) => s.isSyncing);

  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  return (
    <View style={sidebarStyles.container}>
      <View style={sidebarStyles.trim} />

      {/* Logo */}
      <View style={sidebarStyles.logoRow}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={sidebarStyles.logoImg}
          resizeMode="contain"
        />
      </View>

      <View style={sidebarStyles.divider} />

      {/* Nav items */}
      <View style={sidebarStyles.nav}>
        {TAB_ITEMS.map((item) => {
          const active = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[sidebarStyles.navItem, active && sidebarStyles.navItemActive]}
              onPress={() => navigation.navigate('Main', { screen: item.name })}
              activeOpacity={0.75}
            >
              <View style={[sidebarStyles.navIconBox, active && sidebarStyles.navIconBoxActive]}>
                <Ionicons
                  name={active ? item.active : item.inactive}
                  size={17}
                  color={active ? colors.accent : 'rgba(255,255,255,0.45)'}
                />
              </View>
              <Text style={[sidebarStyles.navLabel, active && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={sidebarStyles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <View style={sidebarStyles.divider} />

      {/* Account */}
      <TouchableOpacity
        style={sidebarStyles.accountBtn}
        onPress={() => navigation.navigate(authUser ? 'Profile' : 'Auth')}
        activeOpacity={0.8}
      >
        <View style={sidebarStyles.accountAvatar}>
          <Ionicons name={authUser ? 'person' : 'log-in-outline'} size={15} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          {authUser ? (
            <>
              <Text style={sidebarStyles.accountEmail} numberOfLines={1}>{authUser.email}</Text>
              <View style={sidebarStyles.syncRow}>
                <View style={[sidebarStyles.syncDot, { backgroundColor: isSyncing ? colors.warning : colors.success }]} />
                <Text style={sidebarStyles.syncLabel}>{isSyncing ? 'Syncing…' : 'Synced'}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={sidebarStyles.signInText}>Sign In</Text>
              <Text style={sidebarStyles.signInSub}>Sync across devices</Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={14} color={authUser ? colors.text3 : colors.accent} />
      </TouchableOpacity>

      <View style={sidebarStyles.privacyBadge}>
        <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.2)" />
        <Text style={sidebarStyles.privacyText}>AES-256 encrypted · 100% private</Text>
      </View>
    </View>
  );
};

// ─── Web Top Bar (shown above content on web) ────────────────
const WebTopBar: React.FC = () => {
  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });
  const item = TAB_ITEMS.find((t) => t.name === currentRoute);
  return (
    <View style={topBarStyles.container}>
      <View style={topBarStyles.trim} />
      <Image
        source={require('../../assets/logo.jpg')}
        style={topBarStyles.logo}
        resizeMode="contain"
      />
      <Text style={topBarStyles.title}>{item?.label ?? 'StatusVault'}</Text>
      <View style={topBarStyles.right}>
        <View style={topBarStyles.badge}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.accent} />
          <Text style={topBarStyles.badgeText}>Secure · Encrypted</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Tabs ───────────────────────────────────────────────
const MainTabs: React.FC = () => {
  const { width } = IS_WEB ? useWindowDimensions() : { width: 0 };

  return (
    <View style={[
      layoutStyles.root,
      IS_WEB && { backgroundColor: colors.background },
    ]}>
      {/* Sidebar — web only */}
      {IS_WEB && <WebSidebar />}

      {/* Content area */}
      <View style={[
        layoutStyles.content,
        IS_WEB && layoutStyles.contentWeb,
      ]}>
        {IS_WEB && <WebTopBar />}

        {/* Scrollable page content */}
        <View style={[
          layoutStyles.pageArea,
          IS_WEB && layoutStyles.pageAreaWeb,
        ]}>
          <Tab.Navigator
            initialRouteName="Dashboard"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: IS_WEB
                ? { display: 'none' }
                : {
                    backgroundColor: colors.primary,
                    borderTopColor: 'rgba(201,163,81,0.12)',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    elevation: 0,
                  },
              tabBarIcon: ({ focused }) => {
                const item = TAB_ITEMS.find((t) => t.name === route.name)!;
                return (
                  <View style={focused ? mobileStyles.activeIconWrap : undefined}>
                    <Ionicons name={focused ? item.active : item.inactive} size={22} color={focused ? colors.accent : colors.text3} />
                  </View>
                );
              },
              tabBarActiveTintColor:   colors.accent,
              tabBarInactiveTintColor: colors.text3,
              tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: -2 },
            })}
          >
            {TAB_ITEMS.map((item) => (
              <Tab.Screen
                key={item.name}
                name={item.name}
                component={
                  item.name === 'Dashboard' ? DashboardScreen :
                  item.name === 'Documents' ? DocumentsScreen :
                  item.name === 'Travel'    ? TravelScreen    :
                  item.name === 'Help'      ? HelpScreen      : SettingsScreen
                }
                options={{ tabBarLabel: item.label }}
              />
            ))}
          </Tab.Navigator>
        </View>
      </View>
    </View>
  );
};

// ─── Root Navigator ──────────────────────────────────────────
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

// ─── Styles ──────────────────────────────────────────────────
const layoutStyles = StyleSheet.create({
  root:        { flex: 1, flexDirection: 'row' },
  content:     { flex: 1 },
  contentWeb:  { flexDirection: 'column', backgroundColor: colors.background },
  pageArea:    { flex: 1 },
  pageAreaWeb: { flex: 1 },
});

const sidebarStyles = StyleSheet.create({
  container:     { width: 240, backgroundColor: colors.primary, paddingBottom: 16, borderRightWidth: 1, borderRightColor: 'rgba(201,163,81,0.1)' },
  trim:          { height: 3, backgroundColor: colors.accent, opacity: 0.8 },
  logoRow:       { padding: 16, paddingTop: 20, alignItems: 'center' },
  logoImg:       { width: 160, height: 56, borderRadius: 12 } as any,
  divider:       { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, marginVertical: 10 },
  nav:           { paddingHorizontal: 10, gap: 3 },
  navItem:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: radius.lg, position: 'relative' },
  navItemActive: { backgroundColor: 'rgba(201,163,81,0.08)' },
  navIconBox:    { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  navIconBoxActive:{ backgroundColor: 'rgba(201,163,81,0.12)', borderWidth: 1, borderColor: 'rgba(201,163,81,0.2)' },
  navLabel:      { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.45)', flex: 1 },
  navLabelActive:{ color: '#fff', fontFamily: 'Inter_600SemiBold' },
  activePill:    { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.accent, position: 'absolute', right: 10 },
  accountBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(201,163,81,0.12)', marginBottom: 12 },
  accountAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(201,163,81,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,163,81,0.2)' },
  accountEmail:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  syncRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  syncDot:       { width: 6, height: 6, borderRadius: 3 },
  syncLabel:     { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)' },
  signInText:    { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent },
  signInSub:     { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  privacyBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16 },
  privacyText:   { fontSize: 9, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.2)' },
});

const topBarStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(201,163,81,0.1)', position: 'relative' },
  logo:      { width: 36, height: 36, borderRadius: 8, marginRight: 10 } as any,
  trim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, opacity: 0.6 },
  title:     { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: -0.3, flex: 1 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(201,163,81,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(201,163,81,0.2)' },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.accent },
});

const mobileStyles = StyleSheet.create({
  activeIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,163,81,0.12)', alignItems: 'center', justifyContent: 'center' },
});
