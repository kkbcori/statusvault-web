// ═══════════════════════════════════════════════════════════════
// AuthModal — inline login/signup modal overlay
// Used by all screens to gate add operations behind auth
// ═══════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Platform,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

type Tab = 'login' | 'register';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string; // e.g. "Sign in to add documents"
}

export const AuthModal: React.FC<Props> = ({ visible, onClose, onSuccess, message }) => {
  const signIn  = useStore(s => s.signIn);
  const signUp  = useStore(s => s.signUp);
  const setNotificationEmail = useStore(s => s.setNotificationEmail);
  const setWhatsappPhone     = useStore(s => s.setWhatsappPhone);

  const [tab,        setTab]        = useState<Tab>('login');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [phone,      setPhone]      = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPwd(''); setPhone('');
    setError(''); setSuccess(''); setLoading(false); setShowPwd(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleGoogle = async () => {
    setGoogleLoad(true); setError('');
    try {
      const redirectTo = Platform.OS === 'web'
        ? (typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? window.location.origin
            : 'https://kkbcori.github.io/statusvault-web')
        : 'statusvault://auth/callback';
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

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (tab === 'register' && password !== confirmPwd) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        const { error: err } = await signIn(email.trim(), password);
        if (err) { setError(err); return; }
        reset();
        onSuccess?.(); onClose();
      } else {
        const { error: err } = await signUp(email.trim(), password);
        if (err) { setError(err); return; }
        setNotificationEmail(email.trim());
        if (phone.trim()) setWhatsappPhone(phone.trim());
        setSuccess('check-email');  // special state — show verification screen
        setPassword(''); setConfirmPwd('');
      }
    } finally { setLoading(false); }
  };

  const content = (
    <View style={s.sheet}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
          <Text style={s.headerSub}>
            {message ?? 'Sign in to track your immigration documents'}
          </Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color="#8588A5" />
        </TouchableOpacity>
      </View>

      {/* Google OAuth */}
      <View style={s.googleWrap}>
        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={googleLoad} activeOpacity={0.85}>
          {googleLoad ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              {/* Google G — official colors */}
              {IS_WEB ? (
                <span dangerouslySetInnerHTML={{ __html: `<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>` }} />
              ) : (
                <View style={s.googleIconBox}>
                  <Text style={s.googleIconG}>G</Text>
                </View>
              )}
              <Text style={s.googleTxt}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerTxt}>or use email</Text>
          <View style={s.dividerLine} />
        </View>
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {(['login', 'register'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]}
            onPress={() => { setTab(t); setError(''); setSuccess(''); }}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form */}
      <View style={s.form}>
        {success === 'check-email' ? (
          <View style={s.verifyScreen}>
            <View style={s.verifyIconBox}>
              <Ionicons name="mail-unread-outline" size={36} color="#4F46E5" />
            </View>
            <Text style={s.verifyTitle}>Check your email</Text>
            <Text style={s.verifyBody}>
              We sent a verification link to{' '}
              <Text style={s.verifyEmail}>{email}</Text>
            </Text>
            <Text style={s.verifyInstructions}>
              Click the link in the email to activate your account, then come back here to sign in.
            </Text>
            <View style={s.verifySteps}>
              {['Open your inbox (check spam too)', 'Click the "Confirm your email" link', 'Return here and sign in'].map((step, i) => (
                <View key={i} style={s.verifyStepRow}>
                  <View style={s.verifyStepNum}><Text style={s.verifyStepNumTxt}>{i + 1}</Text></View>
                  <Text style={s.verifyStepTxt}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.verifySignInBtn} onPress={() => { setSuccess(''); setTab('login'); }}>
              <Text style={s.verifySignInTxt}>I've verified — Sign In →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSuccess(''); setTab('register'); }} style={{ marginTop: 10 }}>
              <Text style={s.verifyResendTxt}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        ) : success ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={16} color="#28C76F" />
            <Text style={s.successTxt}>{success}</Text>
          </View>
        ) : null}

        {error && success !== 'check-email' ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EA5455" />
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        ) : null}

        {success !== 'check-email' && <>
        <Text style={s.label}>Email</Text>
        {IS_WEB ? (
          <input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)}
            placeholder="you@email.com" autoFocus
            style={inputStyle} />
        ) : (
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="you@email.com" placeholderTextColor="#ACAEC5"
            keyboardType="email-address" autoCapitalize="none" autoFocus />
        )}

        <Text style={s.label}>Password</Text>
        <View style={s.pwRow}>
          {IS_WEB ? (
            <input type={showPwd ? 'text' : 'password'} value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="6+ characters"
              style={{ ...inputStyle, flex: 1 } as any} />
          ) : (
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={password}
              onChangeText={setPassword} placeholder="6+ characters"
              placeholderTextColor="#ACAEC5" secureTextEntry={!showPwd} autoCapitalize="none" />
          )}
          <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8588A5" />
          </TouchableOpacity>
        </View>

        {tab === 'register' && (
          <>
            <Text style={s.label}>Confirm Password</Text>
            {IS_WEB ? (
              <input type={showPwd ? 'text' : 'password'} value={confirmPwd}
                onChange={(e: any) => setConfirmPwd(e.target.value)}
                placeholder="Re-enter password"
                style={inputStyle} />
            ) : (
              <TextInput style={s.input} value={confirmPwd} onChangeText={setConfirmPwd}
                placeholder="Re-enter password" placeholderTextColor="#ACAEC5"
                secureTextEntry={!showPwd} autoCapitalize="none" />
            )}
            <Text style={s.label}>Phone / WhatsApp <Text style={s.optional}>(optional)</Text></Text>
            {IS_WEB ? (
              <input type="tel" value={phone} onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                style={inputStyle} />
            ) : (
              <TextInput style={s.input} value={phone} onChangeText={setPhone}
                placeholder="+1 555 000 0000" placeholderTextColor="#ACAEC5"
                keyboardType="phone-pad" />
            )}
          </>
        )}

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.submitTxt}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
          }
        </TouchableOpacity>
        </>}
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

const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
  border: '1.5px solid #DBDADE', borderRadius: '8px', background: '#F4F5FA',
  outline: 'none', boxSizing: 'border-box', color: '#0F172A', marginBottom: '12px', display: 'block',
} as any;

const s = StyleSheet.create({
  overlay:    { position: 'absolute' as any, inset: 0, zIndex: 2000, alignItems: 'center', justifyContent: 'center' } as any,
  backdrop:   { position: 'absolute' as any, inset: 0, backgroundColor: 'rgba(47,51,73,0.55)' } as any,
  centeredBox:{ width: '100%', maxWidth: 420, zIndex: 1 } as any,
  sheet:      { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 40px rgba(47,43,61,0.20)' } as any }) } as any,
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  headerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 2 },
  headerSub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 17 },
  closeBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFF', alignItems: 'center', justifyContent: 'center' },
  googleWrap: { padding: 16, paddingBottom: 0 },
  googleBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as any }) } as any,
  googleIconBox: { width: 22, height: 22, borderRadius: 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  googleIconG: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#4285F4' },
  googleTxt:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 4 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: '#F8FAFF' },
  dividerTxt: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  tabs:       { flexDirection: 'row', padding: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  tabBtn:     { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabBtnOn:   { backgroundColor: '#4F46E5' },
  tabTxt:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  tabTxtOn:   { color: '#fff' },
  form:       { padding: 20, gap: 0 } as any,
  label:      { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', letterSpacing: 0.3, marginBottom: 5, marginTop: 4 },
  optional:   { fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  input:      { backgroundColor: '#F8FAFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, padding: 11, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#0F172A', marginBottom: 12 },
  pwRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eyeBtn:     { width: 40, height: 42, backgroundColor: '#F8FAFF', borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  submitBtn:  { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitTxt:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  verifyScreen:     { alignItems: 'center', paddingVertical: 8 },
  verifyIconBox:    { width: 72, height: 72, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  verifyTitle:      { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 8 },
  verifyBody:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  verifyEmail:      { fontFamily: 'Inter_700Bold', color: '#0F172A' },
  verifyInstructions:{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  verifySteps:      { width: '100%', gap: 10, marginBottom: 20 } as any,
  verifyStepRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyStepNum:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  verifyStepNumTxt: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  verifyStepTxt:    { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#4B4C6A', flex: 1 },
  verifySignInBtn:  { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  verifySignInTxt:  { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  verifyResendTxt:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center' },
  errorBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEEEE', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorTxt:   { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#EA5455', lineHeight: 17 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAFFF4', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  successTxt: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#28C76F', lineHeight: 17 },
});
