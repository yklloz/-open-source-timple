import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { clearToken, getMe, getToken } from '@/src/api';

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/(auth)');
        return;
      }

      try {
        await getMe();
        router.replace('/(tabs)/learn');
      } catch {
        await clearToken();
        router.replace('/(auth)');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff',
                   alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#111" size="large" />
    </View>
  );
}
