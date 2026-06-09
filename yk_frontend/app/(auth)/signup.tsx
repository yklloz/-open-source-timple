import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { signup, setToken } from '@/src/api';
import { saveSettings } from '@/src/store/settingsStore';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isValid = name.trim() && email.trim() && password.length >= 8 && password === confirm && agreed;

  const handleSignup = async () => {
    if (!isValid) return;
    setSubmitError('');
    setLoading(true);
    try {
      const data = await signup(name, email, password);
      await setToken(data.access_token);
      await saveSettings({
        profileName: data.name,
        loginLabel: `${data.email} logged in`,
      });
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      const message = e.message || 'Signup failed.';
      setSubmitError(message);
      Alert.alert('Signup failed', message);
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
            <Text style={styles.backBtn}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Sign up</Text>
          <Text style={styles.sub}>손통해요와 함께 수어 학습을 시작해 보세요.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter at least 8 characters"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, confirm && password !== confirm && styles.inputError]}
              placeholder="Re-enter your password"
              placeholderTextColor="#999"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            {confirm && password !== confirm && (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed(a => !a)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxDone]}>
              {agreed && <Text style={styles.checkmark}>V</Text>}
            </View>
            <Text style={styles.agreeText}>
              <Text style={styles.agreeLink}>Terms</Text>
              <Text> and </Text>
              <Text style={styles.agreeLink}>Privacy Policy</Text>
              <Text> agreed</Text>
            </Text>
          </TouchableOpacity>

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

          <TouchableOpacity
            style={[styles.signupBtn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={!isValid || loading}
          >
            <Text style={styles.signupBtnText}>
              {loading ? 'Signing up...' : 'Create account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <View style={styles.dividerTextWrap}>
              <Text style={styles.dividerText}>or</Text>
            </View>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('Not available yet', 'Please use email signup for now.')}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Sign up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, styles.kakaoBtn]} onPress={() => Alert.alert('Not available yet', 'Please use email signup for now.')}>
            <Text style={styles.socialIcon}>K</Text>
            <Text style={styles.socialText}>Sign up with Kakao</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28 },
  header: { paddingTop: 60, paddingBottom: 8 },
  backBtn: { fontSize: 15, color: '#999', fontWeight: '600' },
  titleWrap: { marginBottom: 28, gap: 6 },
  title: { fontSize: 28, fontWeight: '900', color: '#111' },
  sub: { fontSize: 14, color: '#999' },
  form: { gap: 16 },
  inputWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#555' },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#111', borderColor: '#111' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '900' },
  agreeText: { fontSize: 13, color: '#555', flex: 1 },
  agreeLink: { fontWeight: '700', color: '#111', textDecorationLine: 'underline' },
  signupBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#ccc' },
  signupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerTextWrap: { paddingHorizontal: 4 },
  dividerText: { color: '#999', fontSize: 13 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  kakaoBtn: { backgroundColor: '#FEE500', borderColor: '#FEE500' },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '900',
    fontSize: 13,
  },
  socialText: { fontSize: 15, fontWeight: '600', color: '#111' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  loginText: { fontSize: 14, color: '#999' },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    textDecorationLine: 'underline',
  },
});
