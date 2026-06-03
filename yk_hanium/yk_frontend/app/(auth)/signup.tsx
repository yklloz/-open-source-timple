import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { getGoogleLoginUrl, getKakaoLoginUrl, setToken, signup } from '@/src/api';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailValue = email.trim().toLowerCase();
  const isValid = Boolean(
    name.trim() &&
    emailValue &&
    password.length >= 8 &&
    password === confirm &&
    agreed
  );

  const openOAuthUrl = async (url: string) => {
    setErrorMessage('');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = url;
      return;
    }

    await Linking.openURL(url);
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setErrorMessage('이름을 입력해주세요.');
      return;
    }
    if (!emailValue) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 해요.');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않아요.');
      return;
    }
    if (!agreed) {
      setErrorMessage('이용약관 및 개인정보처리방침에 동의해주세요.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const data = await signup(name, emailValue, password);
      await setToken(data.access_token);
      router.replace({
        pathname: '/(auth)/signup-complete',
        params: { name: data.name, email: data.email },
      });
    } catch (e: any) {
      setErrorMessage(e.message || '회원가입에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← 뒤로</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.sub}>손이음과 함께 수어를 배워요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setErrorMessage('');
              }}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
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
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="8자 이상 입력하세요"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrorMessage('');
              }}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={[styles.input, confirm && password !== confirm && styles.inputError]}
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor="#999"
              value={confirm}
              onChangeText={(value) => {
                setConfirm(value);
                setErrorMessage('');
              }}
              secureTextEntry
            />
            {confirm && password !== confirm ? (
              <Text style={styles.errorText}>비밀번호가 일치하지 않아요.</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => {
              setAgreed((value) => !value);
              setErrorMessage('');
            }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxDone]}>
              {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.agreeText}>
              <Text style={styles.agreeLink}>이용약관</Text>
              <Text> 및 </Text>
              <Text style={styles.agreeLink}>개인정보처리방침</Text>
              <Text>에 동의해요</Text>
            </Text>
          </TouchableOpacity>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.formErrorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.signupBtn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupBtnText}>{loading ? '가입 중...' : '가입하기'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <View style={styles.dividerTextWrap}>
              <Text style={styles.dividerText}>또는</Text>
            </View>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.socialBtn} onPress={() => openOAuthUrl(getGoogleLoginUrl())}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>구글로 가입하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, styles.kakaoBtn]}
            onPress={() => openOAuthUrl(getKakaoLoginUrl())}
          >
            <Text style={styles.socialIcon}>K</Text>
            <Text style={styles.socialText}>카카오로 가입하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1, paddingHorizontal: 28 },
  header: { paddingBottom: 8, paddingTop: 60 },
  backBtn: { color: '#999', fontSize: 15, fontWeight: '600' },
  titleWrap: { gap: 6, marginBottom: 28 },
  title: { color: '#111', fontSize: 28, fontWeight: '900' },
  sub: { color: '#777', fontSize: 14 },
  form: { gap: 16 },
  inputWrap: { gap: 6 },
  label: { color: '#555', fontSize: 13, fontWeight: '700' },
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
  inputError: { backgroundColor: '#fff5f5', borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 2 },
  errorBox: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  formErrorText: { color: '#dc2626', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  agreeRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  checkbox: {
    alignItems: 'center',
    borderColor: '#e0e0e0',
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxDone: { backgroundColor: '#111', borderColor: '#111' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  agreeText: { color: '#555', flex: 1, fontSize: 13 },
  agreeLink: { color: '#111', fontWeight: '700', textDecorationLine: 'underline' },
  signupBtn: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
  },
  btnDisabled: { backgroundColor: '#ccc' },
  signupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  divider: { backgroundColor: '#e0e0e0', flex: 1, height: 1 },
  dividerTextWrap: { paddingHorizontal: 4 },
  dividerText: { color: '#999', fontSize: 13 },
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
  loginRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 24 },
  loginText: { color: '#777', fontSize: 14 },
  loginLink: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
