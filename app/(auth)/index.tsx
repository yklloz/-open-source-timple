import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { setToken } from '@/src/api';
import { loginWithKakao } from '@/src/api/kakao';
import { loginLocalUser } from '@/src/store/authStore';
import { saveSettings } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', kakao: '#FEE500' };

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const enterDemo = () => router.replace('/(tabs)/learn');

  const handleKakaoLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithKakao();

      // TODO: 백엔드가 준비되면 kakaoAccessToken을 서버로 보내서
      // 우리 서비스 JWT로 교환하는 방식으로 바꾸면 됩니다.
      setToken(result.kakaoAccessToken);
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      Alert.alert('카카오 로그인 실패', e.message || '다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      Alert.alert('로그인 필요', '이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginLocalUser(email, password);
      setToken(`local-${user.email}`);
      await saveSettings({ profileName: user.name, loginLabel: `${user.email} 계정으로 로그인됨` });
      router.replace('/(tabs)/learn');
    } catch (e: any) {
      const message = e.message || '회원가입한 계정만 로그인할 수 있어요.';
      setErrorMessage(message);
      Alert.alert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.circle} />
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
        <Text style={styles.title}>SignBridge</Text>
        <Text style={styles.subtitle}>수어 학습과 실시간 소통을 시작하세요</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>로그인</Text>
        <TextInput style={styles.input} placeholder="이메일" placeholderTextColor="#A7B0BE" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#A7B0BE" value={password} onChangeText={setPassword} secureTextEntry />
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.9}>
          <Text style={styles.primaryText}>{loading ? '로그인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>또는</Text><View style={styles.divider} /></View>

        <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('준비 중', 'Gmail 로그인은 추후 연동 예정이에요. 회원가입 후 이메일/비밀번호로 로그인해 주세요.')} activeOpacity={0.85}>
          <View style={styles.socialMark}><Text style={styles.socialMarkText}>G</Text></View>
          <Text style={styles.socialText}>Gmail로 계속하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.kakaoBtn]} onPress={handleKakaoLogin} activeOpacity={0.85}>
          <View style={[styles.socialMark, styles.kakaoMark]}><Text style={styles.kakaoMarkText}>K</Text></View>
          <Text style={styles.kakaoText}>Kakao로 계속하기</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.signup}>계정이 없나요? 회원가입</Text>
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
  errorBox: { backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: '#F8B8C4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  errorText: { color: '#D83A56', fontSize: 13, fontWeight: '900', lineHeight: 18 },
  primaryBtn: { height: 56, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
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
