import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/(auth)');
    }, 300);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff',
                   alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#111" size="large" />
    </View>
  );
}