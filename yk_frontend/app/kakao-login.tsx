import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function KakaoLoginCallbackScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#F3F8FE' }}>
      <ActivityIndicator size="large" color="#1E88F5" />
      <Text style={{ color: '#20242A', fontSize: 16, fontWeight: '700' }}>Completing Kakao login...</Text>
    </View>
  );
}
