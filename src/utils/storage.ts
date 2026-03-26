// ═══════════════════════════════════════════════════════════════
// StatusVault — Platform-Aware Storage
// AsyncStorage on Android/iOS · localStorage on Web
// Used by both Zustand persist and Supabase auth session
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// localStorage adapter that matches AsyncStorage interface
const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    return Promise.resolve();
  },
};

export const platformStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;
