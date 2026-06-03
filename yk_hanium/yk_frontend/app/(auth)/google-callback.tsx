import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setToken } from '@/src/api';

export default function GoogleCallbackScreen() {
  const { token, name, error } = useLocalSearchParams<{
    token?: string;
    name?: string;
    error?: string;
  }>();
  const [message, setMessage] = useState('구글 로그인을 처리하고 있어요...');

  useEffect(() => {
    const finishLogin = async () => {
      if (error) {
        setMessage(String(error));
        return;
      }

      if (!token) {
        setMessage('구글 로그인 토큰을 받지 못했어요. 다시 시도해주세요.');
        return;
      }

      try {
        await setToken(String(token));
        router.replace('/(tabs)/learn');
      } catch {
        setMessage('로그인 정보를 저장하지 못했어요. 다시 시도해주세요.');
      }
    };

    finishLogin();
  }, [error, token]);

  const hasFailed = Boolean(error) || message.includes('못했어요');

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#111" size="large" />
      <Text style={styles.title}>{name ? `${name}님, 환영해요` : '구글 로그인'}</Text>
      <Text style={styles.message}>{message}</Text>
      {hasFailed ? (
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)')}>
          <Text style={styles.buttonText}>로그인 화면으로</Text>
        </TouchableOpacity>
      ) : null}
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
  title: { color: '#111', fontSize: 24, fontWeight: '900', marginTop: 24 },
  message: { color: '#777', fontSize: 14, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  button: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    marginTop: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
