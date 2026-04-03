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
        // After login — open profile setup if first time (no immigrationProfile saved)
        const prof = useStore.getState().immigrationProfile;
        if (!prof) {
          setTimeout(() => (useStore.getState() as any).openProfileModal?.(), 300);
        }
        onSuccess?.(); onClose();
      } else {
        const { error: err } = await signUp(email.trim(), password);
        if (err) { setError(err); return; }
        setNotificationEmail(email.trim());
        if (phone.trim()) setWhatsappPhone(phone.trim());
        setSuccess('Account created! Check your email to verify, then sign in.');
        setTab('login'); setPassword(''); setConfirmPwd('');
      }
    } finally { setLoading(false); }
  };

  const content = (
    <View style={s.sheet}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#7367F0" />
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
              <Text style={s.googleIcon}>G</Text>
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
        {success ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={16} color="#28C76F" />
            <Text style={s.successTxt}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EA5455" />
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        ) : null}

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
  outline: 'none', boxSizing: 'border-box', color: '#2F3349', marginBottom: '12px', display: 'block',
} as any;

const s = StyleSheet.create({
  overlay:    { position: 'absolute' as any, inset: 0, zIndex: 2000, alignItems: 'center', justifyContent: 'center' } as any,
  backdrop:   { position: 'absolute' as any, inset: 0, backgroundColor: 'rgba(47,51,73,0.55)' } as any,
  centeredBox:{ width: '100%', maxWidth: 420, zIndex: 1 } as any,
  sheet:      { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 40px rgba(47,43,61,0.20)' } as any }) } as any,
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  headerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 2 },
  headerSub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', lineHeight: 17 },
  closeBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center' },
  googleWrap: { padding: 16, paddingBottom: 0 },
  googleBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#DBDADE', borderRadius: 10, paddingVertical: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as any }) } as any,
  googleIcon: { fontSize: 16, fontWeight: '800', color: '#4285F4', fontFamily: 'Inter_700Bold' },
  googleTxt:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 4 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: '#F4F5FA' },
  dividerTxt: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#ACAEC5' },
  tabs:       { flexDirection: 'row', padding: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  tabBtn:     { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabBtnOn:   { backgroundColor: '#7367F0' },
  tabTxt:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#8588A5' },
  tabTxtOn:   { color: '#fff' },
  form:       { padding: 20, gap: 0 } as any,
  label:      { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#8588A5', letterSpacing: 0.3, marginBottom: 5, marginTop: 4 },
  optional:   { fontFamily: 'Inter_400Regular', color: '#ACAEC5' },
  input:      { backgroundColor: '#F4F5FA', borderWidth: 1.5, borderColor: '#DBDADE', borderRadius: 8, padding: 11, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#2F3349', marginBottom: 12 },
  pwRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eyeBtn:     { width: 40, height: 42, backgroundColor: '#F4F5FA', borderRadius: 8, borderWidth: 1.5, borderColor: '#DBDADE', alignItems: 'center', justifyContent: 'center' },
  submitBtn:  { backgroundColor: '#7367F0', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitTxt:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  errorBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEEEE', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorTxt:   { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#EA5455', lineHeight: 17 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAFFF4', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  successTxt: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#28C76F', lineHeight: 17 },
});
