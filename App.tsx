// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point (v12)
// Syne + Inter fonts · Light SaaS theme
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold, Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import { AppNavigator } from './src/navigation';
import { configureNotifications } from './src/utils/notifications';
import { useStore } from './src/store';
import { colors } from './src/theme';
import { PinLockScreen } from './src/components/PinLockScreen';

LogBox.ignoreLogs(['Setting a timer', 'expo-notifications']);

// Force full-viewport on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    html,body{width:100%!important;height:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:${colors.background}!important}
    #root{width:100vw!important;height:100vh!important;display:flex!important;flex-direction:row!important;overflow:hidden!important}
    ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#F0F2F7}::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px}
  `;
  document.head.appendChild(s);
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
    Syne_700Bold, Syne_800ExtraBold,
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
    <SafeAreaProvider>
      {Platform.OS !== 'web' && (
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      )}
      <AppNavigator />
    </SafeAreaProvider>
  );
}
