import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
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

type Mode = 'magic' | 'password' | 'set-password';

export const AuthModal: React.FC<Props> = ({ visible, onClose, onSuccess, message }) => {
  const sendMagicLink      = useStore(s => s.sendMagicLink);
  const signInWithPassword = useStore(s => s.signInWithPassword);
  const setPassword        = useStore(s => s.setPassword);
  const authUser           = useStore(s => s.authUser);

  const [mode,       setMode]       = useState<Mode>('magic');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword2]  = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const reset = () => {
    setEmail(''); setPassword2(''); setConfirmPwd('');
    setLoading(false); setGoogleLoad(false);
    setSent(false); setError(''); setSuccess(''); setShowPwd(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleGoogle = async () => {
    setGoogleLoad(true); setError('');
    try {
      const redirectTo = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost'
            ? window.location.origin + '/statusvault-web'
            : 'https://kkbcori.github.io/statusvault-web')
        : 'https://kkbcori.github.io/statusvault-web';
      const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (err) setError(err.message);
      else onClose();
    } catch (e: any) { setError(e.message ?? 'Google sign-in failed'); }
    finally { setGoogleLoad(false); }
  };

  const handleMagicLink = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      const { error: err } = await sendMagicLink(email.trim());
      if (err) { setError(err); return; }
      setSent(true);
    } finally { setLoading(false); }
  };

  const handlePasswordLogin = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { error: err } = await signInWithPassword(email.trim(), password);
      if (err) { setError(err); return; }
      reset(); onSuccess?.(); onClose();
    } finally { setLoading(false); }
  };

  const handleSetPassword = async () => {
    setError(''); setSuccess('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error: err } = await setPassword(password);
      if (err) { setError(err); return; }
      setSuccess('Password set! You can now sign in with email + password.');
      setPassword2(''); setConfirmPwd('');
    } finally { setLoading(false); }
  };

  // ── Set Password mode (shown from Settings when already logged in) ──
  if (mode === 'set-password' || (visible && authUser && message?.includes('set') && message?.includes('password'))) {
    const content = (
      <View style={s.sheet}>
        <LinearGradient colors={['#0A0E1A', '#1E1B4B']} style={s.header}>
          <View style={s.headerIcon}><Ionicons name="key-outline" size={22} color="#818CF8" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Set a Password</Text>
            <Text style={s.headerSub}>Optional — lets you sign in with email + password</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={s.body}>
          {error ? <View style={s.errorBox}><Ionicons name="alert-circle" size={15} color="#DC2626" /><Text style={s.errorTxt}>{error}</Text></View> : null}
          {success ? <View style={s.successBox}><Ionicons name="checkmark-circle" size={15} color="#059669" /><Text style={s.successTxt}>{success}</Text></View> : null}
          <Text style={s.label}>New Password</Text>
          {IS_WEB && <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e:any)=>setPassword2(e.target.value)} placeholder="8+ characters" style={inputStyle} />}
          <Text style={s.label}>Confirm Password</Text>
          {IS_WEB && <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={(e:any)=>setConfirmPwd(e.target.value)} placeholder="Re-enter password" style={inputStyle} />}
          <TouchableOpacity style={s.submitBtn} onPress={handleSetPassword} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.submitGrad}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitTxt}>Set Password</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={s.linkTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
    return <ModalWrapper visible={visible} onClose={handleClose}>{content}</ModalWrapper>;
  }

  const content = (
    <View style={s.sheet}>
      <LinearGradient colors={['#0A0E1A', '#1E1B4B']} style={s.header}>
        <View style={s.headerIcon}><Ionicons name="shield-checkmark" size={22} color="#818CF8" /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Sign in to StatusVault</Text>
          <Text style={s.headerSub}>{message ?? 'No password needed — we email you a login link'}</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Mode tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, mode==='magic' && s.tabOn]} onPress={()=>{setMode('magic');setError('');setSent(false);}}>
          <Ionicons name="mail-outline" size={14} color={mode==='magic' ? '#4F46E5' : '#64748B'} />
          <Text style={[s.tabTxt, mode==='magic' && s.tabTxtOn]}>Magic Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, mode==='password' && s.tabOn]} onPress={()=>{setMode('password');setError('');setSent(false);}}>
          <Ionicons name="key-outline" size={14} color={mode==='password' ? '#4F46E5' : '#64748B'} />
          <Text style={[s.tabTxt, mode==='password' && s.tabTxtOn]}>Password</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {/* Google */}
        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={googleLoad} activeOpacity={0.85}>
          {googleLoad ? <ActivityIndicator size="small" color="#4285F4" /> : (
            <>
              {IS_WEB ? <span dangerouslySetInnerHTML={{__html:`<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`}} /> : <Text style={s.googleG}>G</Text>}
              <Text style={s.googleTxt}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={s.divRow}><View style={s.divLine}/><Text style={s.divTxt}>or</Text><View style={s.divLine}/></View>

        {error ? <View style={s.errorBox}><Ionicons name="alert-circle" size={15} color="#DC2626"/><Text style={s.errorTxt}>{error}</Text></View> : null}

        {/* Magic Link mode */}
        {mode === 'magic' && !sent && (
          <>
            <Text style={s.label}>Email address</Text>
            {IS_WEB && <input type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} onKeyDown={(e:any)=>{if(e.key==='Enter')handleMagicLink();}} placeholder="you@email.com" autoFocus style={inputStyle} />}
            <TouchableOpacity style={s.submitBtn} onPress={handleMagicLink} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.submitGrad}>
                {loading ? <ActivityIndicator color="#fff" size="small"/> : (
                  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                    <Ionicons name="mail-outline" size={16} color="#fff"/>
                    <Text style={s.submitTxt}>Send Login Link</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={s.hint}>New user? We'll create your account automatically.</Text>
          </>
        )}

        {/* Magic link sent */}
        {mode === 'magic' && sent && (
          <View style={s.sentBox}>
            <View style={s.sentIcon}><Ionicons name="mail-unread-outline" size={36} color="#4F46E5"/></View>
            <Text style={s.sentTitle}>Check your email</Text>
            <Text style={s.sentDesc}>Login link sent to <Text style={s.sentEmail}>{email}</Text></Text>
            <Text style={s.sentSub}>Click the link to sign in — no password needed.</Text>
            <TouchableOpacity onPress={()=>setSent(false)} style={{marginTop:12}}>
              <Text style={s.linkTxt}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Password mode */}
        {mode === 'password' && (
          <>
            <Text style={s.label}>Email address</Text>
            {IS_WEB && <input type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="you@email.com" autoFocus style={inputStyle}/>}
            <Text style={s.label}>Password</Text>
            <View style={{position:'relative' as any}}>
              {IS_WEB && <input type={showPwd?'text':'password'} value={password} onChange={(e:any)=>setPassword2(e.target.value)} onKeyDown={(e:any)=>{if(e.key==='Enter')handlePasswordLogin();}} placeholder="Your password" style={{...inputStyle, paddingRight:'40px'} as any}/>}
              <TouchableOpacity onPress={()=>setShowPwd(v=>!v)} style={s.eyeBtn}>
                <Ionicons name={showPwd?'eye-off-outline':'eye-outline'} size={16} color="#94A3B8"/>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={handlePasswordLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5','#7C3AED']} style={s.submitGrad}>
                {loading ? <ActivityIndicator color="#fff" size="small"/> : <Text style={s.submitTxt}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setMode('magic')} style={{alignItems:'center',marginTop:8}}>
              <Text style={s.linkTxt}>Forgot password? Use magic link instead →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return <ModalWrapper visible={visible} onClose={handleClose}>{content}</ModalWrapper>;
};

const ModalWrapper: React.FC<{visible:boolean;onClose:()=>void;children:React.ReactNode}> = ({visible,onClose,children}) => {
  if (IS_WEB) {
    if (!visible) return null;
    return (
      <View style={s.overlay} pointerEvents="box-none">
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}/>
        <View style={s.centeredBox}>{children}</View>
      </View>
    );
  }
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}/>
        <View style={s.centeredBox}>{children}</View>
      </View>
    </Modal>
  );
};

const inputStyle = {
  width:'100%', padding:'11px 14px', fontSize:'14px', fontFamily:'Inter, sans-serif',
  color:'#0F172A', border:'1.5px solid #E2E8F0', borderRadius:'10px',
  backgroundColor:'#F8FAFF', outline:'none', boxSizing:'border-box',
  marginBottom:'12px', display:'block',
} as any;

const s = StyleSheet.create({
  overlay:    {position:'absolute' as any,inset:0,zIndex:2000,alignItems:'center',justifyContent:'center'} as any,
  backdrop:   {position:'absolute' as any,inset:0,backgroundColor:'rgba(15,23,42,0.65)'} as any,
  centeredBox:{width:'100%',maxWidth:420,zIndex:1} as any,
  sheet:      {backgroundColor:'#FFFFFF',borderRadius:20,overflow:'hidden',...Platform.select({web:{boxShadow:'0 16px 48px rgba(15,23,42,0.20)'} as any})} as any,
  header:     {flexDirection:'row',alignItems:'flex-start',gap:12,padding:20},
  headerIcon: {width:40,height:40,borderRadius:10,backgroundColor:'rgba(79,70,229,0.15)',alignItems:'center',justifyContent:'center'},
  headerTitle:{fontSize:15,fontFamily:'Inter_700Bold',color:'#F8FAFF',marginBottom:2},
  headerSub:  {fontSize:11,fontFamily:'Inter_400Regular',color:'rgba(203,213,225,0.60)',lineHeight:16},
  closeBtn:   {width:28,height:28,borderRadius:7,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center'},
  tabs:       {flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#F1F5F9'},
  tab:        {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:11},
  tabOn:      {borderBottomWidth:2,borderBottomColor:'#4F46E5'},
  tabTxt:     {fontSize:13,fontFamily:'Inter_500Medium',color:'#64748B'},
  tabTxtOn:   {color:'#4F46E5',fontFamily:'Inter_600SemiBold'},
  body:       {padding:20},
  googleBtn:  {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'#FFFFFF',borderWidth:1.5,borderColor:'#E2E8F0',borderRadius:10,paddingVertical:12,marginBottom:14,...Platform.select({web:{boxShadow:'0 1px 4px rgba(15,23,42,0.06)'} as any})} as any,
  googleG:    {fontSize:15,fontFamily:'Inter_800ExtraBold',color:'#4285F4'},
  googleTxt:  {fontSize:14,fontFamily:'Inter_600SemiBold',color:'#0F172A'},
  divRow:     {flexDirection:'row',alignItems:'center',gap:10,marginBottom:14},
  divLine:    {flex:1,height:1,backgroundColor:'#F1F5F9'},
  divTxt:     {fontSize:11,fontFamily:'Inter_400Regular',color:'#94A3B8'},
  errorBox:   {flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#FEF2F2',borderRadius:8,padding:10,marginBottom:12,borderWidth:1,borderColor:'#FECACA'},
  errorTxt:   {flex:1,fontSize:12,fontFamily:'Inter_400Regular',color:'#DC2626'},
  successBox: {flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#ECFDF5',borderRadius:8,padding:10,marginBottom:12,borderWidth:1,borderColor:'#6EE7B7'},
  successTxt: {flex:1,fontSize:12,fontFamily:'Inter_400Regular',color:'#059669'},
  label:      {fontSize:11,fontFamily:'Inter_600SemiBold',color:'#64748B',letterSpacing:0.3,marginBottom:6},
  eyeBtn:     {position:'absolute' as any,right:12,top:10,padding:4} as any,
  submitBtn:  {borderRadius:10,overflow:'hidden',marginBottom:10},
  submitGrad: {paddingVertical:13,alignItems:'center',justifyContent:'center'},
  submitTxt:  {fontSize:14,fontFamily:'Inter_700Bold',color:'#fff'},
  hint:       {fontSize:11,fontFamily:'Inter_400Regular',color:'#94A3B8',textAlign:'center'},
  linkTxt:    {fontSize:12,fontFamily:'Inter_500Medium',color:'#4F46E5',textAlign:'center'},
  sentBox:    {alignItems:'center',paddingVertical:8},
  sentIcon:   {width:64,height:64,borderRadius:16,backgroundColor:'#EEF2FF',alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:1,borderColor:'#C7D2FE'},
  sentTitle:  {fontSize:17,fontFamily:'Inter_700Bold',color:'#0F172A',marginBottom:6},
  sentDesc:   {fontSize:13,fontFamily:'Inter_400Regular',color:'#64748B',textAlign:'center'},
  sentEmail:  {fontFamily:'Inter_700Bold',color:'#0F172A'},
  sentSub:    {fontSize:12,fontFamily:'Inter_400Regular',color:'#94A3B8',textAlign:'center',marginTop:4},
});
