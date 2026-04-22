// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point v16 · Midnight Glass
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, Platform, Image } from 'react-native';
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
      background: #050B1C;
      color: #F0F4FF;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    #root { width: 100vw; height: 100vh; display: flex; flex-direction: row; overflow: hidden; background: #050B1C; }
    /* Smooth scrolling */
    div[style*="overflow-y: scroll"], div[style*="overflow: scroll"], div[style*="overflow: auto"] {
      -webkit-overflow-scrolling: touch !important;
    }
    /* Dark scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(111,175,242,0.22); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(111,175,242,0.38); }
    * { scrollbar-width: thin; scrollbar-color: rgba(111,175,242,0.22) transparent; }
    /* Focus rings — blue glow */
    :focus-visible { outline: 2px solid rgba(59,139,232,0.60); outline-offset: 2px; border-radius: 4px; }
    :focus:not(:focus-visible) { outline: none; }
    /* Selection */
    ::selection { background: rgba(59,139,232,0.35); color: #F0F4FF; }
    /* Inputs — make them dark-friendly */
    input, textarea, select {
      color-scheme: dark;
      caret-color: #6FAFF2;
    }
    /* Smooth transitions on interactive elements */
    button, a, [role="button"] { transition: opacity 0.15s ease, transform 0.15s ease; }
    /* Autofill — keep dark */
    input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px rgba(12,26,52,0.95) inset !important;
      -webkit-text-fill-color: #F0F4FF !important;
      caret-color: #6FAFF2 !important;
    }
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundDeep, padding: 32 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text1, marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 13, color: colors.text3, textAlign: 'center' }}>{this.state.error}</Text>
          <Text style={{ fontSize: 12, color: colors.text4, marginTop: 16 }}>Try refreshing the page</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Loading splash — on-brand ───────────────────────────────
const LoadingSplash: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: '#050B1C', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 84, height: 84, borderRadius: 24,
      backgroundColor: 'rgba(59,139,232,0.10)',
      borderWidth: 1, borderColor: 'rgba(59,139,232,0.25)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
    }}>
      <Image
        source={require('./assets/logo-transparent.png')}
        style={{ width: 52, height: 52 }}
        resizeMode="contain"
      />
    </View>
    <Text style={{ fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.5 }}>
      Status<Text style={{ color: '#6FAFF2' }}>Vault</Text>
    </Text>
    <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.40)', marginTop: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
      Loading your documents
    </Text>
  </View>
);

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

    // Native PIN re-lock: re-lock the app when it comes back to foreground.
    // On web, the tab visibility change is handled by PinLockScreen itself.
    let appStateSub: any = null;
    if (Platform.OS !== 'web') {
      const { AppState } = require('react-native');
      let lastState = AppState.currentState;
      appStateSub = AppState.addEventListener('change', (nextState: string) => {
        // Re-lock when coming back from background/inactive → active
        if (lastState !== 'active' && nextState === 'active') {
          if (useStore.getState().pinEnabled) {
            setIsLocked(true);
          }
        }
        lastState = nextState;
      });
    }

    return () => {
      clearTimeout(authTimeout);
      clearTimeout(hydrateTimeout);
      appStateSub?.remove?.();
    };
  }, []);

  // Show loading only briefly — max 3s, never indefinite
  if ((!fontsLoaded && !fontError) || !authReady || !_hasHydrated) {
    return <LoadingSplash />;
  }

  if (pinEnabled && isLocked) {
    return (
      <SafeAreaProvider>
        {Platform.OS !== 'web' && <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDeep} />}
        <PinLockScreen onUnlock={() => setIsLocked(false)} verifyPin={verifyPin} />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {Platform.OS !== 'web' && (
          <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDeep} />
        )}
        <DialogProvider>
          <AppNavigator />
        </DialogProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
