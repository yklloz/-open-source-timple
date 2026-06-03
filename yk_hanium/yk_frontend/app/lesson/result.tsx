import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Moa from '@/src/components/Moa';
import { saveProgress } from '@/src/api';

type MoaMood = 'excited' | 'proud' | 'cheer';

export default function ResultScreen() {
  const { score, xp, sign, lessonId } = useLocalSearchParams<{
    score: string; xp: string; sign: string; lessonId?: string;
  }>();

  const scoreNum  = Number(score);
  const mood: MoaMood = scoreNum >= 90 ? 'excited' : scoreNum >= 70 ? 'proud' : 'cheer';
  const title     = scoreNum >= 90 ? '완벽해요!' : scoreNum >= 70 ? '잘했어요!' : '조금 더 연습해요!';

  useEffect(() => {
    if (!lessonId) return;
    saveProgress(lessonId, scoreNum).catch(() => {});
  }, [lessonId, scoreNum]);

  return (
    <View style={styles.container}>
      <Moa mood={mood} size={140} animate={true} message={title} />

      <View style={styles.resultCard}>
        <Text style={styles.signText}>{sign}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNum}>{scoreNum}</Text>
          <Text style={styles.scoreLabel}>점</Text>
        </View>
      </View>

      <View style={styles.xpCard}>
        <Text style={styles.xpIcon}>⭐</Text>
        <Text style={styles.xpText}>+{xp} XP 획득!</Text>
      </View>

      <View style={styles.btns}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>다시 하기 🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/learn')}>
          <Text style={styles.primaryBtnText}>계속하기 →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff', padding: 24,
                      paddingTop: 80, alignItems: 'center', gap: 20 },
  resultCard:       { backgroundColor: '#f9f9f9', borderRadius: 24,
                      borderWidth: 1, borderColor: '#e0e0e0',
                      alignItems: 'center', padding: 32, gap: 12, width: '100%' },
  signText:         { fontSize: 20, color: '#999' },
  scoreBadge:       { borderWidth: 2, borderColor: '#111', borderRadius: 16,
                      paddingHorizontal: 24, paddingVertical: 12,
                      flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNum:         { fontSize: 48, fontWeight: '900', color: '#111' },
  scoreLabel:       { fontSize: 20, color: '#999', fontWeight: '700' },
  xpCard:           { backgroundColor: '#f9f9f9', borderRadius: 16,
                      borderWidth: 1, borderColor: '#e0e0e0',
                      flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'center', padding: 20, gap: 10, width: '100%' },
  xpIcon:           { fontSize: 28 },
  xpText:           { fontSize: 22, fontWeight: '900', color: '#111' },
  btns:             { flexDirection: 'row', gap: 12, marginTop: 'auto', width: '100%' },
  primaryBtn:       { flex: 1, backgroundColor: '#111', padding: 18,
                      borderRadius: 16, alignItems: 'center' },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn:     { flex: 1, backgroundColor: '#f5f5f5', padding: 18,
                      borderRadius: 16, alignItems: 'center',
                      borderWidth: 1, borderColor: '#e0e0e0' },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: '#555' },
});
