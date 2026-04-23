// ═══════════════════════════════════════════════════════════════
// Navigation v7 — Midnight Glass
// Dark glass sidebar · atmospheric topbar · bg-app.png scene
// Works on Web (desktop sidebar / mobile bottom tabs) and Native
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from 'react';
import {
  Platform, View, Text, TouchableOpacity, StyleSheet, Image,
  ImageBackground, Modal,
} from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState, useIsFocused } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useStore } from '../store';
import { RootStackParamList, MainTabParamList } from '../types';

import { DashboardScreen, DocumentsScreen, SettingsScreen } from '../screens';
import { TravelScreen }     from '../screens/TravelScreen';
import { AuthScreen }       from '../screens/AuthScreen';
import { ProfileScreen }    from '../screens/ProfileScreen';
import { AuthModal }        from '../components/AuthModal';
import { SearchModal }      from '../components/SearchModal';
import { NotificationBell } from '../components/NotificationBell';
import { WelcomeModal }     from '../components/WelcomeModal';
import { PaywallModal }     from '../components/PaywallModal';
import { CloudBackupPrompt } from '../components/CloudBackupPrompt';
import { HelpScreen }       from '../screens/HelpScreen';
import { StandaloneTabBar } from './StandaloneTabBar';
import { ContactScreen }    from '../screens/ContactScreen';
import { FamilyScreen }     from '../screens/FamilyScreen';
import { ChecklistScreen }  from '../screens/ChecklistScreen';
import { CounterScreen }    from '../screens/CounterScreen';
import { VisaToolsScreen }  from '../screens/VisaToolsScreen';

// Supabase session key (used to detect pre-existing login for welcome modal suppression)
const SUPABASE_SESSION_KEY = 'sb-auth-token';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();
const IS_WEB = Platform.OS === 'web';

const TAB_ITEMS: Array<{
  name: keyof MainTabParamList;
  label: string;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}> = [
  { name: 'Dashboard', label: 'Home',                active: 'grid',          inactive: 'grid-outline' },
  { name: 'Documents', label: 'Documents',           active: 'document-text', inactive: 'document-text-outline' },
  { name: 'Travel',    label: 'Residency & Travel',  active: 'airplane',      inactive: 'airplane-outline' },
  { name: 'Family',    label: 'Family',              active: 'people',        inactive: 'people-outline' },
  { name: 'Checklist', label: 'Checklist',           active: 'checkbox',      inactive: 'checkbox-outline' },
  { name: 'Timers',    label: 'Timers',              active: 'timer',         inactive: 'timer-outline' },
  { name: 'VisaTools', label: 'Links',               active: 'link',          inactive: 'link-outline' },
  { name: 'Help',      label: 'Help',                active: 'help-circle',   inactive: 'help-circle-outline' },
  { name: 'Contact',   label: 'Contact',             active: 'mail',          inactive: 'mail-outline' },
  { name: 'Settings',  label: 'Settings',            active: 'settings',      inactive: 'settings-outline' },
];

const NAV_GROUPS = [
  { label: 'MAIN',    items: ['Dashboard', 'Documents', 'Travel', 'Family'] },
  { label: 'TOOLS',   items: ['Checklist', 'Timers', 'VisaTools'] },
  { label: 'ACCOUNT', items: ['Help', 'Contact', 'Settings'] },
];

// ─── OnlyWhenFocused HOC ─────────────────────────────────────
// React Navigation v7's bottom-tab navigator on web does not always apply
// display:none to inactive scenes when their background is transparent,
// which causes all tab screens to render stacked on top of each other.
// This HOC is a belt-and-braces fix: unfocused screens explicitly return null.
function onlyWhenFocused<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    const focused = useIsFocused();
    if (!focused) return null;
    return <Component {...props} />;
  };
  Wrapped.displayName = `OnlyWhenFocused(${Component.displayName ?? Component.name ?? 'Screen'})`;
  return Wrapped;
}

// Pre-wrap every Tab.Screen component once at module scope so identity is stable
// across renders (otherwise React Navigation would remount on every parent render).
const FocusedDashboard = onlyWhenFocused(DashboardScreen);
const FocusedDocuments = onlyWhenFocused(DocumentsScreen);
const FocusedTravel    = onlyWhenFocused(TravelScreen);
const FocusedFamily    = onlyWhenFocused(FamilyScreen);
const FocusedChecklist = onlyWhenFocused(ChecklistScreen);
const FocusedVisaTools = onlyWhenFocused(VisaToolsScreen);
const FocusedTimers    = onlyWhenFocused(CounterScreen);
const FocusedHelp      = onlyWhenFocused(HelpScreen);
const FocusedContact   = onlyWhenFocused(ContactScreen);
const FocusedSettings  = onlyWhenFocused(SettingsScreen);

// ─── Web Sidebar ─────────────────────────────────────────────
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 244;

const WebSidebar: React.FC = () => {
  const navigation = useNavigation<any>();
  const authUser   = useStore((s) => s.authUser);
  const isPremium  = useStore((s) => s.isPremium);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const dragging  = useRef(false);
  const startX    = useRef(0);
  const startW    = useRef(DEFAULT_WIDTH);
  const cleanupFn = useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      cleanupFn.current?.();
      if (typeof document !== 'undefined') {
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  const onMouseDown = useCallback((e: any) => {
    if (typeof document === 'undefined') return;
    dragging.current = true;
    startX.current   = e.clientX;
    startW.current   = sidebarWidth;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const newW  = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      if (typeof document === 'undefined') return;
      dragging.current = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
      cleanupFn.current = null;
    };
    cleanupFn.current = () => {
      if (typeof document === 'undefined') return;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',  onUp);
  }, [sidebarWidth]);

  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  return (
    <View style={[sidebarStyles.container, { width: sidebarWidth }]}>
      {/* Ambient glow at top — blue halo behind the logo */}
      <View pointerEvents="none" style={sidebarStyles.sidebarGlow as any} />

      {/* Logo row */}
      <View style={sidebarStyles.logoRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={sidebarStyles.logoBadge}>
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={sidebarStyles.logoWordStatus}>Status</Text>
              <Text style={sidebarStyles.logoWordVault}>Vault</Text>
            </View>
            <Text style={sidebarStyles.logoTagline}>Immigration Tracker</Text>
          </View>
        </View>
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
                  {active && <View style={sidebarStyles.activeIndicator} />}
                  <View style={[sidebarStyles.iconWrap, active && sidebarStyles.iconWrapActive]}>
                    <Ionicons
                      name={active ? item.active : item.inactive}
                      size={15}
                      color={active ? colors.primaryLight : 'rgba(240,244,255,0.50)'}
                    />
                  </View>
                  <Text style={[sidebarStyles.navLabel, active && sidebarStyles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Account / profile card */}
      {authUser ? (
        <TouchableOpacity
          style={sidebarStyles.profileCard}
          onPress={() => useStore.getState().openProfileModal()}
          activeOpacity={0.85}
        >
          <View style={sidebarStyles.profileAvatar}>
            <Text style={sidebarStyles.profileInitial}>
              {authUser.email[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={sidebarStyles.profileName} numberOfLines={1}>
              {authUser.email}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {isPremium ? (
                <>
                  <Ionicons name="star" size={9} color={colors.gold} />
                  <Text style={[sidebarStyles.profilePlan, { color: colors.gold }]}>Premium</Text>
                </>
              ) : (
                <Text style={sidebarStyles.profilePlan}>Free plan</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color="rgba(240,244,255,0.40)" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={sidebarStyles.signInCard}
          onPress={() => useStore.getState().openAuthModal('Sign in to your StatusVault account')}
          activeOpacity={0.85}
        >
          <View style={sidebarStyles.signInIcon}>
            <Ionicons name="log-in-outline" size={16} color={colors.primaryLight} />
          </View>
          <Text style={sidebarStyles.signInText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      )}

      {/* Upgrade CTA — free users only */}
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
            <Ionicons name="flash" size={13} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sidebarStyles.upgradeRowTitle}>Upgrade to Premium</Text>
            <Text style={sidebarStyles.upgradeRowSub}>Unlimited · from $0.49/mo</Text>
          </View>
          <Ionicons name="arrow-forward" size={13} color={colors.gold} />
        </TouchableOpacity>
      )}

      {/* Drag handle — web-only resize */}
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
  const authUser  = useStore((s) => s.authUser);
  const isSyncing = useStore((s) => s.isSyncing);
  const syncError = useStore((s) => s.syncError);
  const isPremium = useStore((s) => s.isPremium);

  const currentRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState  = (mainRoute?.state as any);
    return tabState?.routes?.[tabState?.index ?? 0]?.name ?? 'Dashboard';
  });

  const item = TAB_ITEMS.find((t) => t.name === currentRoute);

  return (
    <View style={topBarStyles.container}>
      <View style={topBarStyles.left}>
        <View style={topBarStyles.titleDot} />
        <Text style={topBarStyles.title}>{item?.label ?? 'Dashboard'}</Text>
      </View>
      <View style={topBarStyles.right}>
        <TouchableOpacity
          style={topBarStyles.iconBtn}
          onPress={() => useStore.getState().openSearch()}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={15} color={colors.text2} />
        </TouchableOpacity>
        <NotificationBell />
        {authUser && isPremium && (
          <View style={[
            topBarStyles.syncPill,
            isSyncing && topBarStyles.syncPillSyncing,
            syncError && topBarStyles.syncPillError,
          ]}>
            <Ionicons
              name={isSyncing ? 'sync-outline' : syncError ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={11}
              color={isSyncing ? colors.warning : syncError ? colors.danger : colors.success}
            />
            <Text style={[topBarStyles.syncText,
              isSyncing && { color: colors.warning },
              syncError && { color: colors.danger },
            ]}>
              {isSyncing ? 'Syncing' : syncError ? 'Failed' : 'Synced'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={topBarStyles.avatarBtn}
          onPress={() =>
            authUser
              ? useStore.getState().openProfileModal()
              : useStore.getState().openAuthModal('Sign in to access your profile and sync documents')
          }
          activeOpacity={0.85}
        >
          <Ionicons name={authUser ? 'person' : 'log-in-outline'} size={15} color={colors.primaryLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Tabs ───────────────────────────────────────────────
const MainTabs: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const showSidebar = IS_WEB && screenWidth >= 1024;
  const showMobileTabBar = !showSidebar;

  const showAuthModal    = useStore((s) => s.showAuthModal);
  const showWelcomeModal = useStore((s) => s.showWelcomeModal);
  const setGuestMode     = useStore((s) => s.setGuestMode);
  const setOnboarded     = useStore((s) => s.setOnboarded);
  const openAuthModal    = useStore((s) => s.openAuthModal);
  const authUser         = useStore((s) => s.authUser);

  const hasMagicLinkInUrl = React.useMemo(() => {
    if (Platform.OS !== 'web') return false;
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    return hash.includes('access_token') || hash.includes('token_hash');
  }, []);

  const hasHydrated = useStore((s) => s._hasHydrated);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (hasMagicLinkInUrl) return;

    const hasSupabaseSession = (() => {
      if (Platform.OS !== 'web') {
        return !!useStore.getState().authUser;
      }
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SUPABASE_SESSION_KEY) : null;
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return !!(parsed?.access_token || parsed?.session?.access_token);
      } catch { return false; }
    })();

    if (hasSupabaseSession) {
      useStore.setState({ hasOnboarded: true, showWelcomeModal: false });
      return;
    }

    if (useStore.getState().hasOnboarded) return;

    useStore.setState({ showWelcomeModal: true });
  }, [hasHydrated]);

  const authModalMessage = useStore((s) => s.authModalMessage);
  const closeAuthModal   = useStore((s) => s.closeAuthModal);
  const showPaywallModal = useStore((s) => s.showPaywallModal);
  const closePaywall     = useStore((s) => s.closePaywall);
  const setPremium       = useStore((s) => s.setPremium);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  React.useEffect(() => {
    useStore.setState({
      openProfileModal: () => setShowProfileModal(true),
      openSearch: () => setShowSearch(true),
    } as any);

    const s = useStore.getState();
    if (s.pendingProfileSetup) {
      useStore.setState({ pendingProfileSetup: false });
      setTimeout(() => setShowProfileModal(true), 500);
    }
  }, []);

  return (
    <>
      <View style={layoutStyles.root}>
        {/* GLOBAL BG IMAGE LAYER — sits behind everything */}
        <ImageBackground
          source={require('../../assets/bg-app.png')}
          style={StyleSheet.absoluteFillObject as any}
          imageStyle={{ opacity: 0.30, resizeMode: 'cover' }}
          pointerEvents="none"
        >
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,11,28,0.55)' }] as any} />
        </ImageBackground>

        {/* Ambient blue glow — top-right */}
        {Platform.OS === 'web' && (
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              background: 'radial-gradient(ellipse 1000px 600px at 90% -8%, rgba(59,139,232,0.22) 0%, transparent 55%)',
            } as any}
          />
        )}
        {/* Ambient green glow — bottom-left */}
        {Platform.OS === 'web' && (
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              background: 'radial-gradient(ellipse 700px 500px at 5% 105%, rgba(76,217,138,0.14) 0%, transparent 55%)',
            } as any}
          />
        )}

        {/* Foreground layout */}
        <View style={[layoutStyles.innerRow, showSidebar && layoutStyles.innerRowDesktop]}>
          {showSidebar && <WebSidebar />}
          <View style={[layoutStyles.content, showSidebar ? layoutStyles.contentDesktop : IS_WEB ? layoutStyles.contentMobileWeb : undefined]}>
            {showSidebar && <WebTopBar />}
            {!showSidebar && IS_WEB && <WebTopBar />}
            <View style={{ flex: 1, flexDirection: 'column' as any, overflow: showSidebar ? 'hidden' as any : undefined } as any}>
              <View style={{ flex: 1, minHeight: 0 }}>
                <Tab.Navigator
                  initialRouteName="Dashboard"
                  tabBar={() => null}
                  screenOptions={() => ({ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } as any })}
                >
                  {TAB_ITEMS.map((item) => (
                    <Tab.Screen
                      key={item.name}
                      name={item.name}
                      component={
                        item.name === 'Dashboard'  ? FocusedDashboard  :
                        item.name === 'Documents'  ? FocusedDocuments  :
                        item.name === 'Travel'     ? FocusedTravel     :
                        item.name === 'Family'     ? FocusedFamily     :
                        item.name === 'Checklist'  ? FocusedChecklist  :
                        item.name === 'VisaTools'  ? FocusedVisaTools  :
                        item.name === 'Timers'     ? FocusedTimers     :
                        item.name === 'Help'       ? FocusedHelp
                        : item.name === 'Contact'  ? FocusedContact
                        : FocusedSettings
                      }
                      options={{ tabBarLabel: item.label }}
                    />
                  ))}
                </Tab.Navigator>
              </View>
              {showMobileTabBar && <StandaloneTabBar />}
            </View>
          </View>
        </View>
      </View>

      {/* Magic link processing overlay */}
      <Modal visible={hasMagicLinkInUrl && !authUser} transparent animationType="none">
        <View style={{ flex: 1, backgroundColor: '#050B1C', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', gap: 16 } as any}>
            <View style={{
              width: 68, height: 68, borderRadius: 20,
              backgroundColor: 'rgba(59,139,232,0.15)',
              borderWidth: 1, borderColor: 'rgba(59,139,232,0.35)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primaryLight} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#F0F4FF' }}>Signing you in…</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)' }}>Verifying your login link</Text>
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
          setGuestMode(false);
          setOnboarded();
          useStore.setState({ showWelcomeModal: false });
          setTimeout(() => openAuthModal('Create a free account to unlock more features'), 200);
        }}
      />
      <AuthModal visible={showAuthModal} onClose={closeAuthModal} message={authModalMessage} />
      <ProfileScreen visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />
      <PaywallModal
        visible={showPaywallModal}
        onClose={closePaywall}
        onUnlock={() => { setPremium(true); closePaywall(); }}
      />
      <CloudBackupPrompt />
    </>
  );
};

export const AppNavigator: React.FC = () => {
  const linking = {
    prefixes: ['https://www.statusvault.org', 'https://statusvault.org', 'statusvault://'],
    config: {
      screens: {
        Main: '',
        Auth: 'auth',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        linking={linking}
        documentTitle={{
          formatter: () => 'StatusVault — Your Personal Immigration Document Expiry Tracker',
        }}
        theme={{
          dark: true,
          colors: {
            primary: colors.primary,
            background: colors.backgroundDeep,
            card: colors.backgroundDeep,
            text: colors.text1,
            border: colors.border,
            notification: colors.gold,
          } as any,
        } as any}
      >
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.backgroundDeep } }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// ── Styles ───────────────────────────────────────────────────
const layoutStyles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.backgroundDeep, position: 'relative' as any, overflow: 'hidden' as any } as any,
  innerRow:          { flex: 1, flexDirection: 'column' as any, zIndex: 1 } as any,
  innerRowDesktop:   { flexDirection: 'row' as any, width: '100%' as any, height: '100%' as any } as any,
  content:           { flex: 1, flexDirection: 'column' as any, minHeight: 0 as any } as any,
  contentDesktop:    { backgroundColor: 'transparent', flex: 1, minWidth: 0, overflow: 'hidden' as any } as any,
  contentMobileWeb:  { backgroundColor: 'transparent', flex: 1, overflow: 'visible' as any } as any,
});

const sidebarStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5,11,28,0.75)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'column',
    position: 'relative' as any,
    ...Platform.select({ web: { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any, default: {} }),
  } as any,
  sidebarGlow: Platform.select({
    web: {
      position: 'absolute' as any, top: 0, left: 0, right: 0, height: 180,
      background: 'radial-gradient(ellipse 300px 180px at 50% -20%, rgba(59,139,232,0.28) 0%, transparent 70%)',
    } as any,
    default: { height: 0 },
  }) as any,
  resizeHandle: { position: 'absolute' as any, top: 0, right: -4, bottom: 0, width: 8, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...(Platform.OS === 'web' ? { cursor: 'col-resize' } as any : {}) } as any,
  resizeBar: { width: 1, height: 32, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  logoRow: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  logoBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(59,139,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWordStatus: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, color: '#F0F4FF', letterSpacing: -0.5, lineHeight: 18 },
  logoWordVault:  { fontFamily: 'Inter_800ExtraBold', fontSize: 16, color: '#6FAFF2', letterSpacing: -0.5, lineHeight: 18 },
  logoTagline:    { fontFamily: 'Inter_500Medium',   fontSize: 9, color: 'rgba(240,244,255,0.40)', letterSpacing: 1.2, marginTop: 2, textTransform: 'uppercase' as any } as any,
  nav: { flex: 1, paddingHorizontal: 10, paddingTop: 10, overflow: 'hidden' as any } as any,
  groupLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.32)', letterSpacing: 1.6, paddingLeft: 14, paddingTop: 18, paddingBottom: 8, textTransform: 'uppercase' as any } as any,
  navItem: { position: 'relative' as any, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(59,139,232,0.14)' },
  activeIndicator: { position: 'absolute' as any, left: -10, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: colors.primaryLight } as any,
  iconWrap: {
    width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(59,139,232,0.18)',
    borderColor: 'rgba(111,175,242,0.30)',
  },
  navLabel:       { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.62)', lineHeight: 18 },
  navLabelActive: { color: '#E0EBFF', fontFamily: 'Inter_700Bold' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 10, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9,
  },
  signInCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 10, marginBottom: 8,
    backgroundColor: 'rgba(59,139,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  signInIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(59,139,232,0.18)', alignItems: 'center', justifyContent: 'center' },
  signInText: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight, flex: 1 },
  profileAvatar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(59,139,232,0.22)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitial: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#E0EBFF' },
  profileName:    { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.90)' },
  profilePlan:    { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.45)' },
  upgradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 10, marginBottom: 12,
    backgroundColor: 'rgba(245,192,83,0.10)',
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.28)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  upgradeRowIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(245,192,83,0.18)',
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeRowTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.gold },
  upgradeRowSub:   { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(245,192,83,0.65)', marginTop: 1 },
});

const topBarStyles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: 'rgba(5,11,28,0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Platform.select({ web: { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as any, default: {} }),
  } as any,
  left:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryLight, shadowColor: colors.primaryLight, ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 10px rgba(111,175,242,0.6)' } as any) : {}) } as any,
  title:      { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF', letterSpacing: -0.3 },
  right:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(59,139,232,0.14)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  syncPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(76,217,138,0.12)',
    borderWidth: 1, borderColor: 'rgba(76,217,138,0.28)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  syncPillSyncing: { backgroundColor: 'rgba(245,192,83,0.14)', borderColor: 'rgba(245,192,83,0.32)' },
  syncPillError:   { backgroundColor: 'rgba(255,107,107,0.14)', borderColor: 'rgba(255,107,107,0.35)' },
  syncText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.success },
});
