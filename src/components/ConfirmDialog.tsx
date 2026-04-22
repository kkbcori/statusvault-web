// ═══════════════════════════════════════════════════════════════
// ConfirmDialog — In-app modal for confirmations & alerts
// Replaces window.confirm() and Alert.alert() on web
// On native: uses Alert.alert (system native dialog)
// On web: renders a centered modal WITHIN the app
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../theme';

// ─── Types ───────────────────────────────────────────────────
type DialogType = 'confirm' | 'alert' | 'danger';

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextType {
  confirm: (opts: DialogOptions) => void;
  alert: (title: string, message: string) => void;
}

// ─── Context ─────────────────────────────────────────────────
const DialogContext = createContext<DialogContextType>({
  confirm: () => {},
  alert:   () => {},
});

export const useDialog = () => useContext(DialogContext);

// ─── Provider ────────────────────────────────────────────────
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible]   = useState(false);
  const [options, setOptions]   = useState<DialogOptions | null>(null);

  const show = useCallback((opts: DialogOptions) => {
    if (Platform.OS !== 'web') {
      // Native: use system Alert
      if (opts.type === 'alert' || !opts.onConfirm) {
        Alert.alert(opts.title, opts.message);
      } else {
        Alert.alert(opts.title, opts.message, [
          { text: opts.cancelLabel ?? 'Cancel', style: 'cancel', onPress: opts.onCancel },
          { text: opts.confirmLabel ?? 'Confirm', style: opts.type === 'danger' ? 'destructive' : 'default', onPress: opts.onConfirm },
        ]);
      }
      return;
    }
    // Web: show in-app dialog
    setOptions(opts);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOptions(null), 200);
  }, []);

  const handleConfirm = () => {
    // Capture callback BEFORE hiding — hide() clears options via setTimeout
    const callback = options?.onConfirm;
    hide();
    if (callback) {
      const result = callback();
      if (result instanceof Promise) result.catch(() => {});
    }
  };

  const handleCancel = () => {
    hide();
    options?.onCancel?.();
  };

  const ctx: DialogContextType = {
    confirm: show,
    alert:   (title, message) => show({ title, message, type: 'alert' }),
  };

  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    options?.type === 'danger'  ? 'warning-outline'      :
    options?.type === 'alert'   ? 'information-circle-outline' :
    'help-circle-outline';

  const iconColor =
    options?.type === 'danger' ? colors.danger :
    options?.type === 'alert'  ? colors.accent  : colors.text2;

  return (
    <DialogContext.Provider value={ctx}>
      {children}

      {/* Web-only in-app dialog */}
      {Platform.OS === 'web' && (
        <Modal visible={visible} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.dialog}>
              <View style={styles.iconRow}>
                <View style={[styles.iconBox, { backgroundColor: iconColor + '14' }]}>
                  <Ionicons name={iconName} size={22} color={iconColor} />
                </View>
              </View>
              <Text style={styles.title}>{options?.title}</Text>
              {options?.message ? (
                <Text style={styles.message}>{options.message}</Text>
              ) : null}
              <View style={[styles.btnRow, options?.type === 'alert' && { justifyContent: 'center' }]}>
                {options?.type !== 'alert' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                    <Text style={styles.cancelText}>{options?.cancelLabel ?? 'Cancel'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    options?.type === 'danger' && styles.confirmBtnDanger,
                    options?.type === 'alert'  && styles.confirmBtnAlert,
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.confirmText,
                    options?.type === 'danger' && styles.confirmTextDanger,
                  ]}>
                    {options?.confirmLabel ?? (options?.type === 'alert' ? 'OK' : 'Confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </DialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay:          { flex: 1, backgroundColor: 'rgba(3,8,18,0.80)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog:           { backgroundColor: '#0C1A34', borderRadius: radius.xl, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...shadows.lg },
  iconRow:          { alignItems: 'center', marginBottom: 14 },
  iconBox:          { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:            { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text1, textAlign: 'center', marginBottom: 8 },
  message:          { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text2, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btnRow:           { flexDirection: 'row', gap: 10 },
  cancelBtn:        { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText:       { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text2 },
  confirmBtn:       { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmBtnDanger: { backgroundColor: colors.danger },
  confirmBtnAlert:  { maxWidth: 120 },
  confirmText:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  confirmTextDanger:{ color: '#fff' },
});
