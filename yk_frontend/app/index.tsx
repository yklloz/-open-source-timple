import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { clearToken, getMe } from '@/src/api';

export default function Index() {
  useEffect(() => {
    let active = true;

    async function routeByAuthState() {
      try {
        await getMe();
        if (active) router.replace('/(tabs)/learn');
      } catch {
        await clearToken();
        if (active) router.replace('/(auth)');
      }
    }

    routeByAuthState();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#111" size="large" />
    </View>
  );
}
