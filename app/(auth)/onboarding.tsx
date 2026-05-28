import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Moa from '@/src/components/Moa';

type MoaMood = 'happy' | 'excited' | 'cheer';

const STEPS: { title: string; desc: string; mood: MoaMood }[] = [
  { title: '수어를 배워보세요',     desc: '듀오링고처럼 매일 조금씩\n재미있게 배울 수 있어요', mood: 'happy'   },
  { title: 'AI가 채점해드려요',     desc: '카메라로 수어를 따라하면\nAI가 정확도를 알려줘요', mood: 'excited' },
  { title: '바로 소통할 수 있어요', desc: '수어를 텍스트로, 텍스트를\n수어로 실시간 번역해요', mood: 'cheer'   },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const isLast  = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)/learn');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <Moa mood={current.mood} size={180} animate={true} message={undefined} />

      <View style={styles.content}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnText}>{isLast ? '시작하기 🚀' : '다음 →'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center',
               justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 32 },
  dots:      { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' },
  dotActive: { width: 24, backgroundColor: '#111' },
  content:   { alignItems: 'center', gap: 12 },
  title:     { fontSize: 26, fontWeight: '900', color: '#111', textAlign: 'center' },
  desc:      { fontSize: 15, color: '#999', textAlign: 'center', lineHeight: 24 },
  btn:       { width: '100%', backgroundColor: '#111',
               padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText:   { fontSize: 17, fontWeight: '700', color: '#fff' },
});
