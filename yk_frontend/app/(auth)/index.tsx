import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { login, setToken } from '@/src/api';
import { loginWithKakao } from '@/src/api/kakao';
import { saveSettings } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', kakao: '#FEE500' };

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      await setToken(data.access_token);
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      const message = e.message || 'Please check your email and password.';
      setErrorMessage(message);
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const data = await loginWithKakao();
      await setToken(data.access_token);
      await saveSettings({
        profileName: data.name,
        loginLabel: data.email ? `${data.email} logged in with Kakao` : 'Logged in with Kakao',
      });
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      const message = e.message || 'Please try again.';
      setErrorMessage(message);
      Alert.alert('Kakao login failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialUnavailable = () => {
    Alert.alert('Not available yet', 'Please use email login for now.');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.circle} />
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
        <Text style={styles.title}>손통해요</Text>
        <Text style={styles.subtitle}>Learn sign language and communicate in real time.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#A7B0BE" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#A7B0BE" value={password} onChangeText={setPassword} secureTextEntry />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleLogin} activeOpacity={0.9} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>or</Text><View style={styles.divider} /></View>

        <TouchableOpacity style={styles.socialBtn} onPress={handleSocialUnavailable} activeOpacity={0.85} disabled={loading}>
          <View style={styles.socialMark}><Text style={styles.socialMarkText}>G</Text></View>
          <Text style={styles.socialText}>Continue with Gmail</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.kakaoBtn]} onPress={handleKakaoLogin} activeOpacity={0.85} disabled={loading}>
          <View style={[styles.socialMark, styles.kakaoMark]}><Text style={styles.kakaoMarkText}>K</Text></View>
          <Text style={styles.kakaoText}>Continue with Kakao</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.signup}>No account yet? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28, justifyContent: 'center', gap: 22, overflow: 'hidden' },
  circle: { position: 'absolute', width: 250, height: 250, borderRadius: 125, top: -80, right: -100, backgroundColor: '#E3F1FF' },
  header: { alignItems: 'center', gap: 9 },
  logo: { width: 66, height: 66, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: .22, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  logoText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  title: { color: COLORS.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: COLORS.sub, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: COLORS.card, borderRadius: 28, padding: 22, gap: 12, shadowColor: '#B9D6F2', shadowOpacity: .28, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 9 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  input: { height: 54, borderRadius: 15, backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 16, color: COLORS.text, fontWeight: '700' },
  primaryBtn: { height: 56, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.55 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  errorText: { color: '#D83A52', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.line },
  dividerText: { color: COLORS.sub, fontSize: 12, fontWeight: '800' },
  socialBtn: { height: 54, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  socialMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F5F9', alignItems: 'center', justifyContent: 'center' },
  socialMarkText: { color: COLORS.primary, fontWeight: '900' },
  socialText: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  kakaoBtn: { backgroundColor: COLORS.kakao, borderColor: COLORS.kakao },
  kakaoMark: { backgroundColor: 'rgba(0,0,0,.12)' },
  kakaoMarkText: { color: '#20242A', fontWeight: '900' },
  kakaoText: { color: '#20242A', fontWeight: '900', fontSize: 15 },
  signup: { textAlign: 'center', color: COLORS.sub, fontWeight: '800' },
});
