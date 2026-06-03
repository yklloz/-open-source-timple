import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Moa from '@/src/components/Moa';
import { clearToken } from '@/src/api';

export default function SignupCompleteScreen() {
  const { name, email } = useLocalSearchParams<{
    name?: string;
    email?: string;
  }>();

  const handleStart = () => {
    router.replace('/(auth)/onboarding');
  };

  const handleBackToLogin = async () => {
    await clearToken();
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Moa mood="proud" size={140} animate={true} message="가입이 완료됐어요!" />

      <View style={styles.content}>
        <Text style={styles.title}>회원가입 완료</Text>
        <Text style={styles.desc}>
          {name ? `${name}님, ` : ''}손이음에 오신 것을 환영해요.
          {'\n'}이제 한국수어 학습을 시작할 수 있어요.
        </Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
          <Text style={styles.primaryBtnText}>학습 시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleBackToLogin}>
          <Text style={styles.secondaryBtnText}>로그인 화면으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  content: { alignItems: 'center', gap: 12, marginTop: 24 },
  title: { color: '#111', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  desc: { color: '#555', fontSize: 15, lineHeight: 24, textAlign: 'center' },
  email: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#777',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actions: { gap: 10, marginTop: 36, width: '100%' },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  secondaryBtnText: { color: '#555', fontSize: 16, fontWeight: '700' },
});
