import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
         StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { login, setToken, kakaoLogin } from '@/src/api';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.access_token);
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoWrap}>
        <Text style={styles.logoEmoji}>🤟</Text>
        <Text style={styles.logoTitle}>손이음</Text>
        <Text style={styles.logoSub}>수어로 이어지는 세상</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.loginBtn, (!email || !password || loading) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={!email || !password || loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <View style={styles.dividerTextWrap}>
          <Text style={styles.dividerText}>또는</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialBtns}>
        <TouchableOpacity style={styles.socialBtn} onPress={handleLogin}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Google로 계속하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.kakaoBtn]} onPress={kakaoLogin}>
          <Text style={styles.socialIcon}>K</Text>
          <Text style={styles.socialText}>카카오로 계속하기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>아직 계정이 없으신가요?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.signupLink}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff',
                     paddingHorizontal: 28, justifyContent: 'center', gap: 24 },
  logoWrap:        { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoEmoji:       { fontSize: 56 },
  logoTitle:       { fontSize: 32, fontWeight: '900', color: '#111' },
  logoSub:         { fontSize: 14, color: '#999' },
  form:            { gap: 12 },
  input:           { backgroundColor: '#f5f5f5', borderRadius: 14,
                     paddingHorizontal: 16, paddingVertical: 16,
                     fontSize: 15, color: '#111',
                     borderWidth: 1, borderColor: '#e0e0e0' },
  loginBtn:        { backgroundColor: '#111', borderRadius: 14,
                     padding: 18, alignItems: 'center', marginTop: 4 },
  btnDisabled:     { backgroundColor: '#ccc' },
  loginBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider:         { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerTextWrap: { paddingHorizontal: 4 },
  dividerText:     { color: '#999', fontSize: 13 },
  socialBtns:      { gap: 10 },
  socialBtn:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                     backgroundColor: '#f5f5f5', borderRadius: 14,
                     padding: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  kakaoBtn:        { backgroundColor: '#FEE500', borderColor: '#FEE500' },
  socialIcon:      { width: 24, height: 24, borderRadius: 12,
                     backgroundColor: '#e0e0e0', textAlign: 'center',
                     lineHeight: 24, fontWeight: '900', fontSize: 13 },
  socialText:      { fontSize: 15, fontWeight: '600', color: '#111' },
  signupRow:       { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  signupText:      { fontSize: 14, color: '#999' },
  signupLink:      { fontSize: 14, fontWeight: '700', color: '#111',
                     textDecorationLine: 'underline' },
});