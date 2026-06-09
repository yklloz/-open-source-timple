import { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

type MoaMood = 'happy' | 'excited' | 'proud' | 'cheer';

interface MoaProps {
  mood?: MoaMood;
  size?: number;
  message?: string;
  animate?: boolean;
}

const MOOD_MESSAGES: Record<MoaMood, string> = {
  happy:   '안녕! 나는 모아야 🤟',
  excited: '같이 수어 배워보자!',
  proud:   '잘했어! 최고야! 🎉',
  cheer:   '포기하지 마! 할 수 있어! 💪',
};

export default function Moa({ mood = 'happy', size = 120, message, animate = true }: MoaProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.spring(scale, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  }, []);

  const displayMessage = message ?? MOOD_MESSAGES[mood];

  return (
    <View style={styles.wrap}>
      <Animated.View style={[
        styles.container,
        { transform: [{ translateY: bounce }, { scale }] }
      ]}>
        {displayMessage && (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{displayMessage}</Text>
            <View style={styles.bubbleTail} />
          </View>
        )}

        <Image
          source={require('../../assets/moa_mascot_main.png')}
          style={{ width: size, height: size * 1.2 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center' },
  container:  { alignItems: 'center', gap: 8 },
  bubble:     { backgroundColor: '#111', borderRadius: 14,
                paddingHorizontal: 16, paddingVertical: 10,
                marginBottom: 8, maxWidth: 220 },
  bubbleText: { color: '#fff', fontSize: 13,
                fontWeight: '600', textAlign: 'center' },
  bubbleTail: { position: 'absolute', bottom: -7, left: '50%',
                marginLeft: -6, width: 0, height: 0,
                borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7,
                borderLeftColor: 'transparent', borderRightColor: 'transparent',
                borderTopColor: '#111' },
});