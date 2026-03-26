// ═══════════════════════════════════════════════════════════════
// StatusVault — App Entry Point (v10)
// WebLayout wraps navigator for responsive web centering
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Platform, StyleSheet } from 'react-native';
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
import { WebLayout } from './src/components/WebLayout';

LogBox.ignoreLogs(['Setting a timer']);

export default function App() {
  const pinEnabled  = useStore((s) => s.pinEnabled);
  const verifyPin   = useStore((s) => s.verifyPin);
  const initAuth    = useStore((s) => s.initAuth);
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
    return (
      <WebLayout>
        <View style={{ flex: 1, backgroundColor: colors.primary }} />
      </WebLayout>
    );
  }

  if (pinEnabled && isLocked && Platform.OS !== 'web') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
        <WebLayout>
          <PinLockScreen onUnlock={() => setIsLocked(false)} verifyPin={verifyPin} />
        </WebLayout>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {Platform.OS !== 'web' && (
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      )}
      <WebLayout>
        <AppNavigator />
      </WebLayout>
    </SafeAreaProvider>
  );
}

const webRoot = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%' as any,
    height: '100%' as any,
    overflow: 'hidden' as any,
  },
});
