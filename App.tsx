// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point v17 · Dual Theme
// Watches themeMode from store; updates web CSS + re-keys navigator
// on theme flip so every module-scope StyleSheet.create re-runs.
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
    html { height: 100%; transition: background-color 0.25s ease; }
    body {
      height: 100%; margin: 0; padding: 0; overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      transition: background-color 0.25s ease, color 0.25s ease;
    }
    #root { width: 100vw; height: 100vh; display: flex; flex-direction: row; overflow: hidden; transition: background-color 0.25s ease; }

    /* Dark (default) */
    html[data-theme="dark"] body, html:not([data-theme]) body { background: #050B1C; color: #F0F4FF; }
    html[data-theme="dark"] #root, html:not([data-theme]) #root { background: #050B1C; }
    html[data-theme="dark"] input, html[data-theme="dark"] textarea, html[data-theme="dark"] select,
    html:not([data-theme]) input, html:not([data-theme]) textarea, html:not([data-theme]) select {
      color-scheme: dark; caret-color: #6FAFF2;
    }
    html[data-theme="dark"] ::-webkit-scrollbar-thumb, html:not([data-theme]) ::-webkit-scrollbar-thumb { background: rgba(111,175,242,0.22); }
    html[data-theme="dark"] ::-webkit-scrollbar-thumb:hover, html:not([data-theme]) ::-webkit-scrollbar-thumb:hover { background: rgba(111,175,242,0.38); }
    html[data-theme="dark"] *, html:not([data-theme]) * { scrollbar-color: rgba(111,175,242,0.22) transparent; }
    html[data-theme="dark"] input:-webkit-autofill, html[data-theme="dark"] input:-webkit-autofill:hover,
    html[data-theme="dark"] input:-webkit-autofill:focus, html[data-theme="dark"] input:-webkit-autofill:active,
    html:not([data-theme]) input:-webkit-autofill, html:not([data-theme]) input:-webkit-autofill:hover,
    html:not([data-theme]) input:-webkit-autofill:focus, html:not([data-theme]) input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px rgba(12,26,52,0.95) inset !important;
      -webkit-text-fill-color: #F0F4FF !important;
      caret-color: #6FAFF2 !important;
    }

    /* Light */
    html[data-theme="light"] body { background: #F4F7FC; color: #0A1530; }
    html[data-theme="light"] #root { background: #F4F7FC; }
    html[data-theme="light"] input, html[data-theme="light"] textarea, html[data-theme="light"] select {
      color-scheme: light; caret-color: #2D6ABF;
    }
    html[data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(10,21,48,0.18); }
    html[data-theme="light"] ::-webkit-scrollbar-thumb:hover { background: rgba(10,21,48,0.32); }
    html[data-theme="light"] * { scrollbar-color: rgba(10,21,48,0.18) transparent; }
    html[data-theme="light"] input:-webkit-autofill, html[data-theme="light"] input:-webkit-autofill:hover,
    html[data-theme="light"] input:-webkit-autofill:focus, html[data-theme="light"] input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
      -webkit-text-fill-color: #0A1530 !important;
      caret-color: #2D6ABF !important;
    }

    /* Shared */
    div[style*="overflow-y: scroll"], div[style*="overflow: scroll"], div[style*="overflow: auto"] { -webkit-overflow-scrolling: touch !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    * { scrollbar-width: thin; }
    :focus-visible { outline: 2px solid rgba(59,139,232,0.60); outline-offset: 2px; border-radius: 4px; }
    :focus:not(:focus-visible) { outline: none; }
    ::selection { background: rgba(59,139,232,0.35); color: inherit; }
    button, a, [role="button"] { transition: opacity 0.15s ease, transform 0.15s ease; }
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

const LoadingSplash: React.FC = () => {
  const themeMode = useStore((s) => s.themeMode ?? 'dark');
  const bg = themeMode === 'light' ? '#F4F7FC' : '#050B1C';
  const titleColor = themeMode === 'light' ? '#0A1530' : '#F0F4FF';
  const subColor   = themeMode === 'light' ? 'rgba(10,21,48,0.45)' : 'rgba(240,244,255,0.40)';
  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 84, height: 84, borderRadius: 24,
        backgroundColor: 'rgba(59,139,232,0.10)',
        borderWidth: 1, borderColor: 'rgba(59,139,232,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <Image source={require('./assets/logo-transparent.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
      </View>
      <Text style={{ fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: titleColor, letterSpacing: -0.5 }}>
        Status<Text style={{ color: '#6FAFF2' }}>Vault</Text>
      </Text>
      <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: subColor, marginTop: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        Loading your documents
      </Text>
    </View>
  );
};

export default function App() {
  const pinEnabled    = useStore((s) => s.pinEnabled);
  const verifyPin     = useStore((s) => s.verifyPin);
  const initAuth      = useStore((s) => s.initAuth);
  const _hasHydrated  = useStore((s) => s._hasHydrated);
  const themeMode     = useStore((s) => s.themeMode ?? 'dark');
  const [isLocked,  setIsLocked]  = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
  });

  // Keep <html data-theme> in sync with store so web CSS flips correctly
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    if (Platform.OS !== 'web') configureNotifications();
    useStore.getState().autoIncrementCounters();
    const authTimeout = setTimeout(() => setAuthReady(true), 3000);
    initAuth().finally(() => { clearTimeout(authTimeout); setAuthReady(true); });
    const hydrateTimeout = setTimeout(() => {
      if (!useStore.getState()._hasHydrated) {
        useStore.setState({ _hasHydrated: true });
      }
    }, 1000);

    let appStateSub: any = null;
    if (Platform.OS !== 'web') {
      const { AppState } = require('react-native');
      let lastState = AppState.currentState;
      appStateSub = AppState.addEventListener('change', (nextState: string) => {
        if (lastState !== 'active' && nextState === 'active') {
          if (useStore.getState().pinEnabled) setIsLocked(true);
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

  if ((!fontsLoaded && !fontError) || !authReady || !_hasHydrated) {
    return <LoadingSplash />;
  }

  if (pinEnabled && isLocked) {
    return (
      <SafeAreaProvider>
        {Platform.OS !== 'web' && <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.backgroundDeep} />}
        <PinLockScreen onUnlock={() => setIsLocked(false)} verifyPin={verifyPin} />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {Platform.OS !== 'web' && (
          <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.backgroundDeep} />
        )}
        <DialogProvider>
          {/* key={themeMode} remounts the whole tree on theme flip so every
              module-scope StyleSheet.create re-runs with the new palette */}
          <AppNavigator key={themeMode} />
        </DialogProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
