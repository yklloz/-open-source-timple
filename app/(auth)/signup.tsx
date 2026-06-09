import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
         StyleSheet, KeyboardAvoidingView, Platform,
         ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { signup, setToken } from '@/src/api';
import { saveSettings } from '@/src/store/settingsStore';

export default function SignupScreen() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isValid = name.trim() && email.trim() && password.length >= 8
                  && password === confirm && agreed;

  const handleSignup = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('이름을 입력해 주세요.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('이메일을 입력해 주세요.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('올바른 이메일 형식으로 입력해 주세요.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('비밀번호가 일치하지 않아요.');
      return;
    }
    if (!agreed) {
      setErrorMessage('이용약관 및 개인정보처리방침에 동의해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(name, email, password);
      await setToken(data.access_token);
      await saveSettings({ profileName: data.name, loginLabel: `${data.email} 계정으로 로그인됨` });
      setSuccessMessage('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.');
      setTimeout(() => router.replace('/(auth)'), 800);
    } catch (e: any) {
      setErrorMessage(e.message || '회원가입에 실패했어요. 다시 시도해 주세요.');
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
          <Text style={styles.sub}>손통해요와 함께 수어를 배워요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="8자 이상 입력하세요"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
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
              onChangeText={setConfirm}
              secureTextEntry
            />
            {confirm && password !== confirm && (
              <Text style={styles.errorText}>비밀번호가 일치하지 않아요</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed(a => !a)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxDone]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
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
          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.signupBtn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupBtnText}>
              {loading ? '가입 중...' : '가입하기'}
            </Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <View style={styles.dividerTextWrap}>
              <Text style={styles.dividerText}>또는</Text>
            </View>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('준비 중', 'Google 회원가입은 추후 연동 예정이에요. 이메일로 가입해 주세요.')}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Google로 가입하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, styles.kakaoBtn]} onPress={() => Alert.alert('준비 중', '카카오 회원가입은 추후 연동 예정이에요. 이메일로 가입해 주세요.')}>
            <Text style={styles.socialIcon}>K</Text>
            <Text style={styles.socialText}>카카오로 가입하기</Text>
          </TouchableOpacity>
        </View>

        {/* 로그인 이동 */}
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
  container:       { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28 },
  header:          { paddingTop: 60, paddingBottom: 8 },
  backBtn:         { fontSize: 15, color: '#999', fontWeight: '600' },
  titleWrap:       { marginBottom: 28, gap: 6 },
  title:           { fontSize: 28, fontWeight: '900', color: '#111' },
  sub:             { fontSize: 14, color: '#999' },
  form:            { gap: 16 },
  inputWrap:       { gap: 6 },
  label:           { fontSize: 13, fontWeight: '700', color: '#555' },
  input:           { backgroundColor: '#f5f5f5', borderRadius: 14,
                     paddingHorizontal: 16, paddingVertical: 16,
                     fontSize: 15, color: '#111',
                     borderWidth: 1, borderColor: '#e0e0e0' },
  inputError:      { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  errorText:       { fontSize: 12, color: '#ef4444', marginTop: 2 },
  errorBox:        { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecdd3', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  formErrorText:   { color: '#dc2626', fontSize: 13, fontWeight: '800', lineHeight: 18 },
  successBox:      { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  successText:     { color: '#047857', fontSize: 13, fontWeight: '900', lineHeight: 18 },
  agreeRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:        { width: 22, height: 22, borderRadius: 6,
                     borderWidth: 2, borderColor: '#e0e0e0',
                     alignItems: 'center', justifyContent: 'center' },
  checkboxDone:    { backgroundColor: '#111', borderColor: '#111' },
  checkmark:       { color: '#fff', fontSize: 13, fontWeight: '900' },
  agreeText:       { fontSize: 13, color: '#555', flex: 1 },
  agreeLink:       { fontWeight: '700', color: '#111', textDecorationLine: 'underline' },
  signupBtn:       { backgroundColor: '#111', borderRadius: 14,
                     padding: 18, alignItems: 'center' },
  btnDisabled:     { backgroundColor: '#ccc' },
  signupBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider:         { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerTextWrap: { paddingHorizontal: 4 },
  dividerText:     { color: '#999', fontSize: 13 },
  socialBtn:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                     backgroundColor: '#f5f5f5', borderRadius: 14,
                     padding: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  kakaoBtn:        { backgroundColor: '#FEE500', borderColor: '#FEE500' },
  socialIcon:      { width: 24, height: 24, borderRadius: 12,
                     backgroundColor: '#e0e0e0', textAlign: 'center',
                     lineHeight: 24, fontWeight: '900', fontSize: 13 },
  socialText:      { fontSize: 15, fontWeight: '600', color: '#111' },
  loginRow:        { flexDirection: 'row', justifyContent: 'center',
                     gap: 6, marginTop: 24 },
  loginText:       { fontSize: 14, color: '#999' },
  loginLink:       { fontSize: 14, fontWeight: '700', color: '#111',
                     textDecorationLine: 'underline' },
});