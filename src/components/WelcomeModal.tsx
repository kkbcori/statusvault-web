// ═══════════════════════════════════════════════════════════════
// WelcomeModal — First-visit mode chooser
// Guest Mode (limited) vs Create Account (more features)
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onGuest: () => void;
  onCreateAccount: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ visible, onGuest, onCreateAccount }) => (
  <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
    <View style={s.overlay}>
      <View style={s.card}>

        {/* Header */}
        <LinearGradient colors={['#2F3349', '#3D4466']} style={s.header}>
          <View style={s.logoBox}>
            <Ionicons name="shield-checkmark" size={32} color="#7367F0" />
          </View>
          <Text style={s.title}>Welcome to StatusVault</Text>
          <Text style={s.subtitle}>100% private · data stays on your device</Text>
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.chooseLabel}>How would you like to start?</Text>

          {/* Guest Mode */}
          <TouchableOpacity style={s.optionGuest} onPress={onGuest} activeOpacity={0.85}>
            <View style={s.optionIconBox}>
              <Ionicons name="phone-portrait-outline" size={22} color="#8588A5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>Continue as Guest</Text>
              <Text style={s.optionDesc}>No account needed · data on this device only</Text>
              <View style={s.limitRow}>
                {[
                  '1 document',
                  '1 checklist',
                  '1 immi timer',
                  'No family members',
                ].map((l) => (
                  <View key={l} style={s.limitChip}>
                    <Text style={s.limitChipTxt}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>

          {/* Create Account */}
          <TouchableOpacity style={s.optionAccount} onPress={onCreateAccount} activeOpacity={0.85}>
            <LinearGradient colors={['#7367F0', '#9E95F5']} style={s.optionAccountGrad}>
              <View style={s.optionIconBoxPurple}>
                <Ionicons name="person-add-outline" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitleWhite}>Create Free Account</Text>
                <Text style={s.optionDescWhite}>Sync & backup · more features</Text>
                <View style={s.limitRow}>
                  {[
                    '2 documents',
                    '1 checklist',
                    '1 immi timer',
                    '1 family member + 1 doc',
                  ].map((l) => (
                    <View key={l} style={s.limitChipWhite}>
                      <Text style={s.limitChipTxtWhite}>{l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Premium teaser */}
          <View style={s.premiumRow}>
            <Ionicons name="star" size={13} color="#FF9F43" />
            <Text style={s.premiumTxt}>
              <Text style={{ fontFamily: 'Inter_700Bold' }}>Premium:</Text>
              {' '}Unlimited everything · PDF export · $3.99/yr
            </Text>
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

const s = StyleSheet.create({
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:              { width: '100%', maxWidth: 440, borderRadius: 20, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 40px rgba(0,0,0,0.3)' } as any }) } as any,
  header:            { padding: 24, alignItems: 'center' },
  logoBox:           { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(115,103,240,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  title:             { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: -0.5 },
  subtitle:          { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  body:              { backgroundColor: '#FFFFFF', padding: 20, gap: 12 } as any,
  chooseLabel:       { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#8588A5', textAlign: 'center', marginBottom: 4 },
  optionGuest:       { borderRadius: 12, borderWidth: 1.5, borderColor: '#DBDADE', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  optionIconBox:     { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center' },
  optionTitle:       { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 2 },
  optionDesc:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', marginBottom: 8 },
  optionAccount:     { borderRadius: 12, overflow: 'hidden' },
  optionAccountGrad: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  optionIconBoxPurple:{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  optionTitleWhite:  { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 2 },
  optionDescWhite:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  limitRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 4 } as any,
  limitChip:         { backgroundColor: '#F4F5FA', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#DBDADE' },
  limitChipTxt:      { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#8588A5' },
  limitChipWhite:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  limitChipTxtWhite: { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.9)' },
  premiumRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF4E6', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FFD59E' },
  premiumTxt:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#92400E', flex: 1 },
});
