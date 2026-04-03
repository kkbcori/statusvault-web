// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point v15
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
} from '@expo-google-fonts/inter';
import { AppNavigator } from './src/navigation';
import { configureNotifications } from './src/utils/notifications';
import { useStore } from './src/store';
import { colors } from './src/theme';
import { PinLockScreen } from './src/components/PinLockScreen';
import { DialogProvider } from './src/components/ConfirmDialog';

LogBox.ignoreLogs(['Setting a timer', 'expo-notifications', 'Cannot record touch', 'Listening to push token']);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  document.title = 'StatusVault — Visa Tracker Dashboard';
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html { height: 100%; }
    body {
      height: 100%; margin: 0; padding: 0; overflow: hidden;
      background: #2F3349;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    #root { width: 100vw; height: 100vh; display: flex; flex-direction: row; overflow: hidden; }
    /* Allow RNW ScrollViews to scroll */
    div[style*="overflow-y: scroll"], div[style*="overflow: scroll"], div[style*="overflow: auto"] {
      -webkit-overflow-scrolling: touch !important;
    }
    /* ── Scrollbars — always visible on right side ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #EBEBEB; border-radius: 3px; }
    ::-webkit-scrollbar-thumb { background: #ACAEC5; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #8588A5; }
    * { scrollbar-width: thin; scrollbar-color: #ACAEC5 #EBEBEB; }
    :focus:not(:focus-visible) { outline: none; }
  `;
  document.head.appendChild(s);
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 32 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text1, marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 13, color: colors.text3, textAlign: 'center' }}>{this.state.error}</Text>
          <Text style={{ fontSize: 12, color: colors.text4, marginTop: 16 }}>Try refreshing the page</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const pinEnabled    = useStore((s) => s.pinEnabled);
  const verifyPin     = useStore((s) => s.verifyPin);
  const initAuth      = useStore((s) => s.initAuth);
  const _hasHydrated  = useStore((s) => s._hasHydrated);
  const [isLocked,  setIsLocked]  = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') configureNotifications();
    useStore.getState().autoIncrementCounters();
    // Hard timeout — never let the app stay on loading screen
    const authTimeout = setTimeout(() => setAuthReady(true), 3000);
    initAuth().finally(() => { clearTimeout(authTimeout); setAuthReady(true); });
    // Force hydration flag after 1s if onRehydrateStorage never fires (empty storage)
    const hydrateTimeout = setTimeout(() => {
      if (!useStore.getState()._hasHydrated) {
        useStore.setState({ _hasHydrated: true });
      }
    }, 1000);
    return () => { clearTimeout(authTimeout); clearTimeout(hydrateTimeout); };
  }, []);

  // Show loading only briefly — max 3s, never indefinite
  if ((!fontsLoaded && !fontError) || !authReady || !_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2F3349', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>StatusVault</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Loading...</Text>
      </View>
    );
  }

  if (pinEnabled && isLocked && Platform.OS !== 'web') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <PinLockScreen onUnlock={() => setIsLocked(false)} verifyPin={verifyPin} />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {Platform.OS !== 'web' && (
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        )}
        <DialogProvider>
          <AppNavigator />
        </DialogProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
