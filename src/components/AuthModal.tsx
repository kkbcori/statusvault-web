// ═══════════════════════════════════════════════════════════════
// AuthModal — Magic Link + Google OAuth
// No passwords, no email verification, no 400 errors
// User enters email → gets login link → clicks → signed in
// ═══════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';
import { supabase } from '../utils/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export const AuthModal: React.FC<Props> = ({ visible, onClose, onSuccess, message }) => {
  const sendMagicLink = useStore(s => s.sendMagicLink);

  const [email,       setEmail]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [sent,        setSent]        = useState(false);
  const [error,       setError]       = useState('');

  const reset = () => {
    setEmail(''); setLoading(false); setGoogleLoad(false);
    setSent(false); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleMagicLink = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      const { error: err } = await sendMagicLink(email.trim());
      if (err) { setError(err); return; }
      setSent(true);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoad(true); setError('');
    try {
      const redirectTo = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost'
            ? window.location.origin + '/statusvault-web'
            : 'https://kkbcori.github.io/statusvault-web')
        : 'https://kkbcori.github.io/statusvault-web';
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (err) { setError(err.message); return; }
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in failed');
    } finally { setGoogleLoad(false); }
  };

  const content = (
    <View style={s.sheet}>
      {/* Header */}
      <LinearGradient colors={['#0A0E1A', '#1E1B4B']} style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#818CF8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Sign in to StatusVault</Text>
          <Text style={s.headerSub}>{message ?? 'No password needed — we email you a login link'}</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={s.body}>
        {sent ? (
          /* ── Sent state ── */
          <View style={s.sentBox}>
            <View style={s.sentIcon}>
              <Ionicons name="mail-unread-outline" size={40} color="#4F46E5" />
            </View>
            <Text style={s.sentTitle}>Check your email</Text>
            <Text style={s.sentDesc}>
              We sent a login link to{'\n'}
              <Text style={s.sentEmail}>{email}</Text>
            </Text>
            <Text style={s.sentInstructions}>
              Click the link in the email to sign in instantly. No password needed.
            </Text>
            <View style={s.sentSteps}>
              {['Open your inbox (check spam too)', 'Click the "Sign in to StatusVault" link', 'You\'re in — no password required'].map((step, i) => (
                <View key={i} style={s.stepRow}>
                  <View style={s.stepNum}><Text style={s.stepNumTxt}>{i + 1}</Text></View>
                  <Text style={s.stepTxt}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.resendBtn} onPress={() => setSent(false)}>
              <Text style={s.resendTxt}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Input state ── */
          <>
            {/* Google */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={googleLoad} activeOpacity={0.85}>
              {googleLoad ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  {IS_WEB ? (
                    <span dangerouslySetInnerHTML={{ __html: `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>` }} />
                  ) : (
                    <Text style={s.googleG}>G</Text>
                  )}
                  <Text style={s.googleTxt}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or sign in with email</Text>
              <View style={s.divLine} />
            </View>

            {/* Error */}
            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#DC2626" />
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={s.label}>Email address</Text>
            {IS_WEB ? (
              <input
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                onKeyDown={(e: any) => { if (e.key === 'Enter') handleMagicLink(); }}
                placeholder="you@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', fontSize: '14px',
                  fontFamily: 'Inter, sans-serif', color: '#0F172A',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  backgroundColor: '#F8FAFF', outline: 'none', boxSizing: 'border-box',
                  marginBottom: '14px', display: 'block',
                } as any}
              />
            ) : null}

            {/* CTA */}
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleMagicLink}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.submitGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="mail-outline" size={16} color="#fff" />
                      <Text style={s.submitTxt}>Send Login Link</Text>
                    </View>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.hint}>
              New user? We'll create your account automatically.
            </Text>
          </>
        )}
      </View>
    </View>
  );

  if (IS_WEB) {
    if (!visible) return null;
    return (
      <View style={s.overlay} pointerEvents="box-none">
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={s.centeredBox}>{content}</View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={s.centeredBox}>{content}</View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:      { position: 'absolute' as any, inset: 0, zIndex: 2000, alignItems: 'center', justifyContent: 'center' } as any,
  backdrop:     { position: 'absolute' as any, inset: 0, backgroundColor: 'rgba(15,23,42,0.65)' } as any,
  centeredBox:  { width: '100%', maxWidth: 420, zIndex: 1 } as any,
  sheet:        { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(15,23,42,0.20)' } as any }) } as any,
  header:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20 },
  headerIcon:   { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(79,70,229,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F8FAFF', marginBottom: 2 },
  headerSub:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.60)', lineHeight: 16 },
  closeBtn:     { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  body:         { padding: 20 },
  googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 12, marginBottom: 16, ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(15,23,42,0.06)' } as any }) } as any,
  googleG:      { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#4285F4' },
  googleTxt:    { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  divRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine:      { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
  divTxt:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorTxt:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#DC2626' },
  label:        { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', letterSpacing: 0.3, marginBottom: 6 },
  submitBtn:    { borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  submitGrad:   { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  submitTxt:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  hint:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  // Sent state
  sentBox:      { alignItems: 'center', paddingVertical: 8 },
  sentIcon:     { width: 72, height: 72, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#C7D2FE' },
  sentTitle:    { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 8 },
  sentDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  sentEmail:    { fontFamily: 'Inter_700Bold', color: '#0F172A' },
  sentInstructions: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  sentSteps:    { width: '100%', gap: 10, marginBottom: 20 } as any,
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum:      { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  stepNumTxt:   { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  stepTxt:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#334155', flex: 1 },
  resendBtn:    { paddingVertical: 8 },
  resendTxt:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#4F46E5', textAlign: 'center' },
});
