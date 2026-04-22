// ═══════════════════════════════════════════════════════════════
// AuthScreen — Login / Register / Google OAuth
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { supabase } from '../utils/supabase';

type Tab = 'login' | 'register';

export const AuthScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const signIn      = useStore((s) => s.signIn);
  const signUp      = useStore((s) => s.signUp);

  // 'register' mode comes from Get Started on landing page
  const [tab, setTab] = useState<Tab>((route?.params as any)?.mode === 'register' ? 'register' : 'login');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [phone,      setPhone]      = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [message,    setMessage]    = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const validate = () => {
    if (!email.trim() || !email.includes('@')) { setMessage({ text: 'Enter a valid email.', type: 'error' }); return false; }
    if (password.length < 6) { setMessage({ text: 'Password must be at least 6 characters.', type: 'error' }); return false; }
    if (tab === 'register' && password !== confirmPwd) { setMessage({ text: 'Passwords do not match.', type: 'error' }); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setMessage(null);
    try {
      if (tab === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) { setMessage({ text: error, type: 'error' }); return; }
        navigation.goBack();
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) { setMessage({ text: error, type: 'error' }); return; }
        setMessage({ text: 'Account created! Check your email to verify, then sign in.', type: 'success' });
        setTab('login');
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoad(true); setMessage(null);
    try {
      const redirectTo = Platform.OS === 'web'
        ? (typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? window.location.origin
            : 'https://www.statusvault.org')
        : 'statusvault://auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) setMessage({ text: error.message, type: 'error' });
      // On web: browser redirects to Google automatically
    } catch (e: any) {
      setMessage({ text: e.message ?? 'Google sign-in failed', type: 'error' });
    } finally { setGoogleLoad(false); }
  };

  if (IS_WEB) {
    return (
      <View style={webStyles.outer}>
        <View style={webStyles.card}>
          <View style={webStyles.cardHeader}>
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={webStyles.logo}
              resizeMode="contain"
            />
            <Text style={webStyles.title}>Sign in to StatusVault</Text>
            <Text style={webStyles.subtitle}>Sync your immigration data across all devices</Text>
          </View>
          <View style={webStyles.cardBody}>
            {/* Tab switcher */}
            <View style={styles.tabs}>
              {(['login', 'register'] as Tab[]).map((t) => (
                <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => { setTab(t); setMessage(null); }}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'login' ? 'Sign In' : 'Create Account'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={googleLoad} activeOpacity={0.85}>
              {googleLoad ? <ActivityIndicator size="small" color={colors.text1} /> : (
                <><View style={styles.googleIcon}><Text style={styles.googleIconText}>G</Text></View><Text style={styles.googleText}>Continue with Google</Text></>
              )}
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use email</Text>
              <View style={styles.dividerLine} />
            </View>
            {message && (
              <View style={[styles.msgBox, message.type === 'error' ? styles.msgError : styles.msgSuccess]}>
                <Ionicons name={message.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={16} color={message.type === 'error' ? '#FF6B6B' : '#4CD98A'} />
                <Text style={[styles.msgText, { color: message.type === 'error' ? '#FF6B6B' : '#4CD98A' }]}>{message.text}</Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.text3} style={styles.inputIcon} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.text3} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text3} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="6+ characters" placeholderTextColor={colors.text3} secureTextEntry={!showPwd} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.text3} />
              </TouchableOpacity>
            </View>
            {tab === 'register' && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.text3} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { flex: 1 }]} value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Re-enter password" placeholderTextColor={colors.text3} secureTextEntry={!showPwd} autoCapitalize="none" />
                </View>
              </>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.submitGrad}>
                {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.submitText}>{tab === 'login' ? 'Sign In & Sync' : 'Create Account'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.skipText}>Continue without account →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.primaryMid]} style={styles.header}>
          <View style={styles.headerTrim} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerEyebrow}>STATUSVAULT ACCOUNT</Text>
          <Text style={styles.headerTitle}>Sync Across Devices</Text>
          <View style={styles.goldBar} />
          <Text style={styles.headerSub}>
            Your data is encrypted on your device before upload.{'\n'}
            Even we can't read it.
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Tab switcher */}
          <View style={styles.tabs}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => { setTab(t); setMessage(null); }}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={googleLoad}
            activeOpacity={0.85}
          >
            {googleLoad ? (
              <ActivityIndicator size="small" color={colors.text1} />
            ) : (
              <>
                {/* Google G SVG-like text substitute */}
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Message */}
          {message && (
            <View style={[styles.msgBox, message.type === 'error' ? styles.msgError : styles.msgSuccess]}>
              <Ionicons
                name={message.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={16}
                color={message.type === 'error' ? '#FF6B6B' : '#4CD98A'}
              />
              <Text style={[styles.msgText, { color: message.type === 'error' ? '#FF6B6B' : '#4CD98A' }]}>
                {message.text}
              </Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.text3} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email} onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.text3}
              keyboardType="email-address"
              autoCapitalize="none" autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.text3} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password} onChangeText={setPassword}
              placeholder="6+ characters"
              placeholderTextColor={colors.text3}
              secureTextEntry={!showPwd} autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.text3} />
            </TouchableOpacity>
          </View>

          {/* Phone number — register only (for alerts) */}
          {tab === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone (optional)</Text>
              <Text style={styles.inputHint}>For expiry alerts · include country code e.g. +1</Text>
              <TextInput
                style={styles.input}
                value={phone} onChangeText={setPhone}
                placeholder="+1 555 000 0000"
                placeholderTextColor={colors.text3}
                keyboardType="phone-pad"
              />
            </View>
          )}
          {/* Confirm password — register only */}
          {tab === 'register' && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.text3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={confirmPwd} onChangeText={setConfirmPwd}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.text3}
                  secureTextEntry={!showPwd} autoCapitalize="none"
                />
              </View>
            </>
          )}

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.submitGrad}>
              {loading
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={styles.submitText}>
                    {tab === 'login' ? 'Sign In & Sync' : 'Create Account'}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Continue without account  →</Text>
          </TouchableOpacity>

          {/* Privacy note */}
          <View style={styles.privacyCard}>
            {[
              { icon: 'lock-closed' as const,        text: 'AES-256 encrypted before upload' },
              { icon: 'eye-off-outline' as const,    text: 'We cannot read your immigration data' },
              { icon: 'phone-portrait-outline' as const, text: 'Works fully offline without account' },
            ].map(({ icon, text }, i) => (
              <View key={i} style={styles.privacyRow}>
                <Ionicons name={icon} size={14} color={colors.accent} />
                <Text style={styles.privacyText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Google setup note */}
          <View style={styles.setupNote}>
            <Ionicons name="information-circle-outline" size={14} color={colors.text3} />
            <Text style={styles.setupNoteText}>
              Google sign-in requires OAuth setup in Supabase Dashboard → Authentication → Providers → Google.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  content:       { paddingBottom: 40 },
  header:        { paddingTop: 56, paddingBottom: 28, paddingHorizontal: spacing.screen, alignItems: 'center' },
  headerTrim:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent },
  backBtn:       { position: 'absolute', top: 52, left: spacing.screen, padding: 8 },
  headerLogo:    { width: 100, height: 100, borderRadius: 20, marginBottom: 12 } as any,
  headerEyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 2.5, marginBottom: 6 },
  headerTitle:   { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: -0.3, marginBottom: 10 },
  goldBar:       { width: 36, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginBottom: 12, opacity: 0.8 },
  headerSub:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 19 },
  body:          { padding: spacing.screen },
  tabs:          { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.xl, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: radius.lg, alignItems: 'center' },
  tabActive:     { backgroundColor: colors.primary },
  tabText:       { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text3 },
  tabTextActive: { color: '#fff' },

  // Google button
  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 14, marginBottom: 16 },
  googleIcon:    { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  googleIconText:{ fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#4285F4' },
  googleText:    { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text1 },

  // Divider
  dividerRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text3 },

  // Message
  msgBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: radius.md, marginBottom: 16, borderWidth: 1 },
  msgError:      { backgroundColor: '#FEE2E2', borderColor: 'rgba(255,107,107,0.30)' },
  msgSuccess:    { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  msgText:       { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1, lineHeight: 18 },

  // Fields
  fieldLabel:    { ...typography.captionBold, color: colors.text2, marginBottom: 6, letterSpacing: 0.3 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 4 },
  inputIcon:     { marginRight: 10 },
  input:         { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text1 },
  inputGroup:    { marginTop: 16 },
  inputLabel:    { ...typography.captionBold, color: colors.text2, marginBottom: 3, letterSpacing: 0.3 },
  inputHint:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, marginBottom: 6, lineHeight: 15 },

  // Submit
  submitBtn:     { borderRadius: radius.md, overflow: 'hidden', marginTop: 24, marginBottom: 12 },
  submitGrad:    { paddingVertical: 16, alignItems: 'center' },
  submitText:    { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  skipBtn:       { alignItems: 'center', paddingVertical: 12 },
  skipText:      { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text3 },

  // Privacy
  privacyCard:   { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginTop: 20, borderWidth: 1, borderColor: colors.borderLight, gap: 10 },
  privacyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text2 },

  // Setup note
  setupNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: 12, backgroundColor: colors.accentDim, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderGold },
  setupNoteText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text2, flex: 1, lineHeight: 16 },
});

const webStyles = StyleSheet.create({
  outer:      { flex: 1, backgroundColor: '#050B1C', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { width: '100%', maxWidth: 440, backgroundColor: '#0C1A34', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...shadows.lg },
  cardHeader: { backgroundColor: colors.primary, padding: 28, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: colors.accent },
  logo:       { width: 90, height: 90, borderRadius: 16, marginBottom: 10 } as any,
  title:      { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: -0.3 },
  subtitle:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 4, textAlign: 'center' },
  cardBody:   { padding: 24 },
});
