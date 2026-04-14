// ═══════════════════════════════════════════════════════════════
// Navigation v6 — Light SaaS layout
// White sidebar + white topbar · teal accent · Syne headings
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Modal } from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore } from '../store';
import { RootStackParamList, MainTabParamList } from '../types';

import { DashboardScreen, DocumentsScreen, SettingsScreen } from '../screens';
import { TravelScreen }  from '../screens/TravelScreen';
import { AuthScreen }    from '../screens/AuthScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthModal } from '../components/AuthModal';
import { SearchModal } from '../components/SearchModal';
import { NotificationBell } from '../components/NotificationBell';
import { WelcomeModal } from '../components/WelcomeModal';
import { PaywallModal } from '../components/PaywallModal';
import { HelpScreen }       from '../screens/HelpScreen';
import { MobileTabBar }     from './MobileTabBar';
import { ContactScreen }    from '../screens/ContactScreen';
import { FamilyScreen }     from '../screens/FamilyScreen';
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
  { name: 'Travel',    label: 'Residency & Travel',  active: 'airplane', inactive: 'airplane-outline' },
  { name: 'Settings',  label: 'Settings',  active: 'settings',      inactive: 'settings-outline' },
  { name: 'Family',     label: 'Family',    active: 'people',        inactive: 'people-outline' },
  { name: 'Checklist',  label: 'Checklist', active: 'checkbox',      inactive: 'checkbox-outline' },
  { name: 'Timers',     label: 'Timers',    active: 'timer',         inactive: 'timer-outline' },
  { name: 'VisaTools',  label: 'Links',      active: 'link',         inactive: 'link-outline' },
  { name: 'Help',       label: 'Help',      active: 'help-circle',   inactive: 'help-circle-outline' },
  { name: 'Contact',    label: 'Contact',   active: 'mail',          inactive: 'mail-outline' },
];

const NAV_GROUPS = [
  { label: 'MAIN', items: ['Dashboard', 'Documents', 'Travel', 'Family'] },
  { label: 'TOOLS',   items: ['Checklist', 'Timers', 'VisaTools'] },
  { label: 'ACCOUNT', items: ['Settings', 'Help', 'Contact'] },
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
  const [showProfile, setShowProfile] = React.useState(false);
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
      <View style={sidebarStyles.nav}>
        {NAV_GROUPS.map((group) => (
          <View key={group.label}>
            <Text style={sidebarStyles.groupLabel}>{group.label}</Text>
            {group.items.map((name) => {
              const item  = TAB_ITEMS.find((t) => t.name === name);
              if (!item) return null;
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
                    color={active ? '#4F46E5' : 'rgba(225,222,245,0.55)'}
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
      </View>


      {/* Account / profile card — bottom */}
      {authUser ? (
        <TouchableOpacity
          style={sidebarStyles.profileCard}
          onPress={() => (useStore.getState() as any).openProfileModal?.()}
          activeOpacity={0.8}
        >
          <View style={sidebarStyles.profileAvatar}>
            <Text style={sidebarStyles.profileInitial}>
              {authUser.email[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sidebarStyles.profileName} numberOfLines={1}>
              {authUser.email}
            </Text>
            <Text style={sidebarStyles.profilePlan}>
              {isPremium ? '⭐ Premium' : 'Free Plan'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.text3} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={sidebarStyles.signInCard}
          onPress={() => useStore.getState().openAuthModal('Sign in to your StatusVault account')}
          activeOpacity={0.85}
        >
          <Ionicons name="log-in-outline" size={18} color="#818CF8" />
          <Text style={sidebarStyles.signInText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      )}

      {/* Compact upgrade row — free users only, same height as profile card */}
      {!isPremium && (
        <TouchableOpacity
          style={sidebarStyles.upgradeRow}
          onPress={() => {
            const s = useStore.getState();
            if (!s.authUser || s.isGuestMode) {
              s.openAuthModal('Create a free account to access premium features');
            } else {
              s.openPaywall();
            }
          }}
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
            }]} />
            <Text style={sidebarStyles.syncText}>
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
    </View>
  );
};

// ─── Web Topbar ───────────────────────────────────────────────
const WebTopBar: React.FC = () => {
  const navigation   = useNavigation<any>();
  const authUser     = useStore((s) => s.authUser);
  const isSyncing    = useStore((s) => s.isSyncing);
  const syncError    = useStore((s) => s.syncError);
  const isPremium    = useStore((s) => s.isPremium);
  const [showProfile, setShowProfile] = React.useState(false);

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

        <TouchableOpacity
          style={topBarStyles.avatarBtn}
          onPress={() => (useStore.getState() as any).openSearch?.()}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={16} color={colors.text2} />
        </TouchableOpacity>
        <NotificationBell />
        {authUser && isPremium && (
          <View style={[
            topBarStyles.privateBadge,
            isSyncing && { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
            syncError && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
          ]}>
            <Ionicons
              name={isSyncing ? "sync-outline" : syncError ? "cloud-offline-outline" : "cloud-done-outline"}
              size={10}
              color={isSyncing ? "#D97706" : syncError ? "#DC2626" : "#059669"}
            />
            <Text style={[topBarStyles.privateBadgeTxt,
              isSyncing && { color: '#D97706' },
              syncError && { color: '#DC2626' },
            ]}>
              {isSyncing ? 'Syncing...' : syncError ? 'Sync Failed' : 'Backed Up'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={topBarStyles.avatarBtn}
          onPress={() => authUser ? (useStore.getState() as any).openProfileModal?.() : useStore.getState().openAuthModal('Sign in to access your profile and sync documents')}
          activeOpacity={0.8}
        >
          <Ionicons name={authUser ? 'person' : 'log-in-outline'} size={16} color={colors.text2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Tabs ───────────────────────────────────────────────
const MainTabs: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  // Show sidebar only on wide screens (tablet/desktop web)
  const showSidebar = IS_WEB && screenWidth >= 768;
  const showMobileTabBar = !showSidebar;  // mobile phones + narrow browser windows

  const showAuthModal    = useStore((s) => s.showAuthModal);
  const showWelcomeModal = useStore((s) => s.showWelcomeModal);
  const hasOnboarded     = useStore((s) => s.hasOnboarded);
  const setGuestMode     = useStore((s) => s.setGuestMode);
  const setOnboarded     = useStore((s) => s.setOnboarded);
  const openAuthModal    = useStore((s) => s.openAuthModal);

  const authUser         = useStore((s) => s.authUser);

  // Detect magic link / OAuth redirect in URL — suppress all modals while processing
  const hasMagicLinkInUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    return hash.includes('access_token') || hash.includes('token_hash');
  }, []);

  const hasHydrated = useStore((s) => s._hasHydrated);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (hasMagicLinkInUrl) return;

    // Check Supabase session synchronously from localStorage — no async race
    const hasSupabaseSession = (() => {
      try {
        const key = 'sb-gekhrdqkaadqeeebzvlu-auth-token';
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return !!(parsed?.access_token || parsed?.session?.access_token);
      } catch { return false; }
    })();

    // User is logged in — suppress welcome modal permanently
    if (hasSupabaseSession) {
      useStore.setState({ hasOnboarded: true, showWelcomeModal: false });
      return;
    }

    // Already onboarded (chose guest or created account before)
    if (useStore.getState().hasOnboarded) return;

    // Brand new user — show welcome modal
    useStore.setState({ showWelcomeModal: true });
  }, [hasHydrated]);
  const authModalMessage = useStore((s) => s.authModalMessage);
  const closeAuthModal   = useStore((s) => s.closeAuthModal);
  const showPaywallModal = useStore((s) => s.showPaywallModal);
  const closePaywall     = useStore((s) => s.closePaywall);
  const setPremium       = useStore((s) => s.setPremium);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const immigrationProfile = useStore((s) => s.immigrationProfile);
  const profileSetupShown  = useStore((s) => s.profileSetupShown);

  // Register openProfileModal and openSearch in the store
  React.useEffect(() => {
    useStore.setState({
      openProfileModal: () => setShowProfileModal(true),
      openSearch: () => setShowSearch(true),
    } as any);

    // Consume the pendingProfileSetup flag — this handles the case where
    // initAuth processed a magic link token before MainTabs was mounted
    const s = useStore.getState();
    if (s.pendingProfileSetup) {
      useStore.setState({ pendingProfileSetup: false });
      setTimeout(() => setShowProfileModal(true), 500);
    }
  }, []);
  return (
  <>
  <View style={[layoutStyles.root, showSidebar && { ...layoutStyles.rootWeb, backgroundColor: colors.sidebar }]}>
    {showSidebar && <WebSidebar />}
    <View style={[layoutStyles.content, showSidebar ? layoutStyles.contentWeb : IS_WEB ? layoutStyles.contentMobileWeb : undefined]}>
      {showSidebar && <WebTopBar />}
      <View style={{ flex: 1, overflow: IS_WEB ? 'hidden' as any : undefined }}>
        <Tab.Navigator
          initialRouteName="Dashboard"
          tabBar={(props) => showMobileTabBar ? <MobileTabBar {...props} /> : null}
          screenOptions={({ route }) => ({
            headerShown: false,
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
                item.name === 'Help'       ? HelpScreen
               : item.name === 'Contact'    ? ContactScreen
               : SettingsScreen
              }
              options={{ tabBarLabel: item.label }}
            />
          ))}
        </Tab.Navigator>
      </View>
    </View>
  </View>
  {/* Magic link processing overlay — Modal so it renders above WelcomeModal */}
  <Modal visible={hasMagicLinkInUrl && !authUser} transparent animationType="none">
    <View style={{ flex: 1, backgroundColor: '#0A0E1A', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: 16 } as any}>
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(79,70,229,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)' }}>
          <Ionicons name="shield-checkmark" size={30} color="#818CF8" />
        </View>
        <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#F8FAFF' }}>Signing you in...</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.55)' }}>Verifying your login link</Text>
      </View>
    </View>
  </Modal>

  {/* First-visit welcome modal */}
  <WelcomeModal
    visible={showWelcomeModal}
    onGuest={() => {
      setGuestMode(true);
      setOnboarded();
      useStore.setState({ showWelcomeModal: false });
    }}
    onCreateAccount={() => {
      setGuestMode(false);   // ensure guest mode is off
      setOnboarded();
      useStore.setState({ showWelcomeModal: false });
      setTimeout(() => openAuthModal('Create a free account to unlock more features'), 200);
    }}
  />
  {/* Global auth modal */}
  <AuthModal
    visible={showAuthModal}
    onClose={closeAuthModal}
    message={authModalMessage}
  />
  {/* Global profile modal */}
  <ProfileScreen visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
  {/* Global search */}
  <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />
  {/* Global paywall modal */}
  <PaywallModal
    visible={showPaywallModal}
    onClose={closePaywall}
    onUnlock={() => { setPremium(true); closePaywall(); }}
  />
  </>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <SafeAreaProvider>
    <NavigationContainer
      documentTitle={{
        formatter: () => 'StatusVault — Your Personal Immigration Document Expiry Tracker',
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Auth"  component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

// ── Styles ───────────────────────────────────────────────────
const layoutStyles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.background },
  rootBg:     { backgroundColor: colors.sidebar },
  rootWeb:    { flexDirection: 'row', width: '100%' as any, height: '100%' as any },
  content:    { flex: 1 },
  contentWeb: { flexDirection: 'column', backgroundColor: '#F4F5FA', flex: 1, minWidth: 0, overflow: 'hidden' as any },
  contentMobileWeb: { flexDirection: 'column', backgroundColor: '#F4F5FA', flex: 1 },
});

const sidebarStyles = StyleSheet.create({
  container:     { backgroundColor: '#0A0E1A', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)', flexDirection: 'column', position: 'relative' as any },
  resizeHandle:  { position: 'absolute' as any, top: 0, right: -4, bottom: 0, width: 8, cursor: 'col-resize' as any, alignItems: 'center', justifyContent: 'center', zIndex: 10 } as any,
  resizeBar:     { width: 1, height: 32, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)' } as any,
  logoRow:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  logoImg:       { width: 148, height: 42 } as any,
  nav:           { flex: 1, paddingHorizontal: 10, paddingTop: 12, overflow: 'hidden' as any },
  groupLabel:    { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: 'rgba(148,163,184,0.40)', letterSpacing: 1.5, paddingLeft: 10, paddingTop: 20, paddingBottom: 6, textTransform: 'uppercase' as any },
  navItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, marginBottom: 1 },
  navItemActive: { backgroundColor: 'rgba(79,70,229,0.18)', borderLeftWidth: 2, borderLeftColor: '#818CF8' } as any,
  navIcon:       { marginRight: 10 },
  navLabel:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.55)', lineHeight: 20 },
  navLabelActive:{ color: '#A5B4FC', fontFamily: 'Inter_600SemiBold' },
  upgradeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 8, marginBottom: 8, backgroundColor: 'rgba(79,70,229,0.12)', borderWidth: 1, borderColor: 'rgba(79,70,229,0.25)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  upgradeRowIcon:{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(79,70,229,0.20)', alignItems: 'center', justifyContent: 'center' },
  upgradeRowTitle:{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#A5B4FC' },
  upgradeRowSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(165,180,252,0.50)', marginTop: 1 },
  profileCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 8, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  signInCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 8, marginBottom: 10, backgroundColor: 'rgba(79,70,229,0.15)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.30)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  signInText:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#A5B4FC', flex: 1 },
  profileAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  profileInitial:{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  profileName:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(248,250,252,0.90)' },
  profilePlan:   { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.40)', marginTop: 1 },
  bottom:        { paddingHorizontal: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  syncRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, paddingLeft: 4 },
  syncDot:       { width: 5, height: 5, borderRadius: 3 },
  syncText:      { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(148,163,184,0.35)' },
});

const topBarStyles = StyleSheet.create({
  container: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as any,
  left:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumb:{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  sep:       { fontSize: 12, color: '#CBD5E1', marginHorizontal: 4 },
  title:     { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulsePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pulsePillSyncing: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  pulseDot:  { width: 6, height: 6, borderRadius: 3 },
  pulseText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#059669' },
  pulseTextSyncing: { color: '#D97706' },
  avatarBtn:      { width: 34, height: 34, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  privateBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#6EE7B7' },
  privateBadgeTxt:{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#059669' },
});

const mobileStyles = StyleSheet.create({
  activeWrap: { width: 40, height: 32, borderRadius: 12, backgroundColor: 'rgba(79,70,229,0.10)', alignItems: 'center', justifyContent: 'center' },
});
