import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_AUTH_STORAGE_KEY = 'son_tong_haeyo_kakao_auth_result_v1';

function readParams(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const params = new URLSearchParams(query);
  return {
    access_token: params.get('access_token') || '',
    token_type: params.get('token_type') || 'bearer',
    user_id: Number(params.get('user_id')),
    name: params.get('name') || 'Kakao user',
    email: params.get('email') || '',
    error: params.get('error') || '',
    error_description: params.get('error_description') || '',
  };
}

export default function KakaoLoginCallbackScreen() {
  const [message, setMessage] = useState('카카오 로그인 처리 중...');

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    if (typeof window === 'undefined') return;

    const result = readParams(window.location.href);

    if (result.error) {
      localStorage.setItem(KAKAO_AUTH_STORAGE_KEY, JSON.stringify({
        type: 'error',
        message: result.error_description || result.error,
      }));
      setMessage('카카오 로그인에 실패했어요. 창을 닫아 주세요.');
      window.opener?.postMessage({ type: 'kakao-auth-error' }, window.location.origin);
      setTimeout(() => window.close(), 500);
      return;
    }

    if (result.access_token && result.user_id) {
      localStorage.setItem(KAKAO_AUTH_STORAGE_KEY, JSON.stringify({
        type: 'success',
        data: {
          access_token: result.access_token,
          token_type: result.token_type,
          user_id: result.user_id,
          name: result.name,
          email: result.email,
        },
      }));
      setMessage('카카오 로그인 완료! 창을 닫는 중입니다.');
      window.opener?.postMessage({ type: 'kakao-auth-success' }, window.location.origin);
      setTimeout(() => window.close(), 500);
      return;
    }

    setMessage('카카오 로그인 결과를 확인하지 못했어요. 다시 시도해 주세요.');
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#F3F8FE', padding: 24 }}>
      <ActivityIndicator size="large" color="#1E88F5" />
      <Text style={{ color: '#20242A', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
