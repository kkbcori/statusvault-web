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
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html { height: 100%; }
    body {
      height: 100%; margin: 0; padding: 0; overflow: hidden;
      background: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    #root { width: 100vw; height: 100vh; display: flex; flex-direction: row; overflow: hidden; }
    /* Allow RNW ScrollViews to scroll */
    div[style*="overflow-y: scroll"], div[style*="overflow: scroll"], div[style*="overflow: auto"] {
      -webkit-overflow-scrolling: touch !important;
    }
    /* Thin elegant scrollbars */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.5); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.7); }
    * { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.5) transparent; }
    /* Remove outline on focus for mouse users */
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
  const pinEnabled = useStore((s) => s.pinEnabled);
  const verifyPin  = useStore((s) => s.verifyPin);
  const initAuth   = useStore((s) => s.initAuth);
  const [isLocked,  setIsLocked]  = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') configureNotifications();
    useStore.getState().autoIncrementCounters();
    initAuth().finally(() => setAuthReady(true));
  }, []);

  if ((!fontsLoaded && !fontError) || !authReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
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
