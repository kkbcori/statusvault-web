// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point (v14)
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

// Suppress harmless warnings everywhere
LogBox.ignoreLogs([
  'Setting a timer',
  'expo-notifications',
  'Cannot record touch end',
  'Listening to push token',
]);

// Web: force full viewport + suppress console noise
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Viewport CSS
  const s = document.createElement('style');
  s.textContent = `
    *{box-sizing:border-box}
    html,body{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:${colors.background}}
    #root{width:100vw;height:100vh;display:flex;flex-direction:row;overflow:hidden}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:#F0F2F7}
    ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
    ::-webkit-scrollbar-thumb:hover{background:#94A3B8}
    *{scrollbar-width:thin;scrollbar-color:#CBD5E1 #F0F2F7}
  `;
  document.head.appendChild(s);

  // Suppress known harmless console warnings on web
  const _warn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    const msg = args[0]?.toString() ?? '';
    if (
      msg.includes('expo-notifications') ||
      msg.includes('push token') ||
      msg.includes('Cannot record touch')
    ) return;
    _warn(...args);
  };
}

// ─── Error Boundary ──────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.background, padding: 32 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold',
            color: colors.text1, marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular',
            color: colors.text3, textAlign: 'center', lineHeight: 20 }}>
            {this.state.error}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text4, marginTop: 16 }}>
            Try refreshing the page
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ────────────────────────────────────────────────
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
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
        <PinLockScreen onUnlock={() => setIsLocked(false)} verifyPin={verifyPin} />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {Platform.OS !== 'web' && (
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
        )}
        <DialogProvider>
          <AppNavigator />
        </DialogProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
