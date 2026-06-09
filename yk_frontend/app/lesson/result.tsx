import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeLesson } from '@/src/store/progressStore';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', wrong: '#F45D75' };

export default function ResultScreen() {
  const { score, xp, sign, lessonId, title } = useLocalSearchParams<{ score: string; xp: string; sign: string; lessonId: string; title: string }>();
  const [saved, setSaved] = useState(false);
  const scoreNum = Number(score || 0);
  const xpNum = Number(xp || 0);

  useEffect(() => {
    if (!lessonId || saved) return;
    completeLesson(lessonId, xpNum, scoreNum).finally(() => setSaved(true));
  }, [lessonId, saved, scoreNum, xpNum]);

  const result = useMemo(() => {
    if (scoreNum >= 90) return { title: '목표 점수를 달성했어요', desc: '표현을 정확하게 이해했어요. 다음 학습으로 이어가도 좋습니다.', color: COLORS.primary };
    if (scoreNum >= 70) return { title: '잘하고 있어요', desc: '조금만 더 복습하면 목표 점수에 도달할 수 있어요.', color: COLORS.cyan };
    return { title: '한 번 더 연습해요', desc: '틀린 표현을 다시 보고 퀴즈에 재도전해보세요.', color: COLORS.wrong };
  }, [scoreNum]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.bgCircle} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/learn')}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.headerLabel}>퀴즈 결과</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreMain}>{scoreNum}</Text>
          <Text style={styles.scoreSub}>점</Text>
        </View>
        <Text style={styles.title}>{result.title}</Text>
        <Text style={styles.desc}>{result.desc}</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>학습</Text>
            <Text style={styles.summaryValue}>{title || sign}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>표현</Text>
            <Text style={styles.summaryValue}>{sign}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>획득 XP</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>+{xpNum} XP</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelTop}>
            <Text style={styles.levelTitle}>레벨 진행도</Text>
            <Text style={styles.levelText}>Lv.2</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, 68 + Math.floor(xpNum / 2))}%` }]} /></View>
          <Text style={styles.levelDesc}>학습을 완료하면 홈의 포인트와 완료 목록에 반영됩니다.</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => lessonId ? router.replace(`/lesson/${lessonId}`) : router.back()}>
            <Text style={styles.secondaryText}>다시 도전하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/learn')}>
            <Text style={styles.primaryText}>계속하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: 24, paddingTop: 18, alignItems: 'center' },
  bgCircle: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -120, top: -80, backgroundColor: '#E3F1FF' },
  closeBtn: { alignSelf: 'flex-end', width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.sub, fontSize: 26, lineHeight: 28, fontWeight: '600' },
  headerLabel: { color: COLORS.primary, fontSize: 18, fontWeight: '900', marginTop: 12, marginBottom: 24 },
  scoreCircle: { width: 142, height: 142, borderRadius: 71, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: .24, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  scoreMain: { color: '#FFFFFF', fontSize: 48, fontWeight: '900' },
  scoreSub: { color: 'rgba(255,255,255,.82)', fontSize: 15, fontWeight: '900' },
  title: { color: COLORS.primary, fontSize: 23, lineHeight: 30, textAlign: 'center', fontWeight: '900', marginTop: 24 },
  desc: { color: COLORS.sub, fontSize: 15, lineHeight: 23, textAlign: 'center', fontWeight: '700', marginTop: 10, marginBottom: 22 },
  summaryCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 18, paddingVertical: 8 },
  summaryRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  summaryLabel: { color: COLORS.sub, fontSize: 14, fontWeight: '800' },
  summaryValue: { color: COLORS.text, fontSize: 15, fontWeight: '900', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: COLORS.line },
  levelCard: { width: '100%', marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 18 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  levelTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  levelText: { color: COLORS.primary, fontWeight: '900' },
  progressTrack: { height: 10, backgroundColor: '#DDEAF8', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 999 },
  levelDesc: { color: COLORS.sub, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 'auto' },
  secondaryBtn: { flex: 1, height: 56, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: COLORS.sub, fontWeight: '900' },
  primaryBtn: { flex: 1, height: 56, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '900' },
});
