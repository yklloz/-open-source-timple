import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { getGoogleLoginUrl, getKakaoLoginUrl, login, setToken } from '@/src/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const openOAuthUrl = async (url: string) => {
    setErrorMessage('');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = url;
      return;
    }

    await Linking.openURL(url);
  };

  const handleLogin = async () => {
    const emailValue = email.trim().toLowerCase();
    if (!emailValue || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const data = await login(emailValue, password);
      await setToken(data.access_token);
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      setErrorMessage(e.message || '로그인에 실패했어요.');
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
        <Text style={styles.logoSub}>수어로 이어지는 일상</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrorMessage('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#999"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrorMessage('');
          }}
          secureTextEntry
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>{loading ? '로그인 중...' : '로그인'}</Text>
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
        <TouchableOpacity style={styles.socialBtn} onPress={() => openOAuthUrl(getGoogleLoginUrl())}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>구글로 계속하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, styles.kakaoBtn]}
          onPress={() => openOAuthUrl(getKakaoLoginUrl())}
        >
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
  container: {
    backgroundColor: '#fff',
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoEmoji: { fontSize: 56 },
  logoTitle: { color: '#111', fontSize: 32, fontWeight: '900' },
  logoSub: { color: '#777', fontSize: 14 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#111',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  loginBtn: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    marginTop: 4,
    padding: 18,
  },
  btnDisabled: { backgroundColor: '#ccc' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  divider: { backgroundColor: '#e0e0e0', flex: 1, height: 1 },
  dividerTextWrap: { paddingHorizontal: 4 },
  dividerText: { color: '#999', fontSize: 13 },
  socialBtns: { gap: 10 },
  socialBtn: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  kakaoBtn: { backgroundColor: '#FEE500', borderColor: '#FEE500' },
  socialIcon: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '900',
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    width: 24,
  },
  socialText: { color: '#111', fontSize: 15, fontWeight: '600' },
  signupRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  signupText: { color: '#777', fontSize: 14 },
  signupLink: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
