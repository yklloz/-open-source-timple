import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CURRICULUM, Lesson } from '@/src/features/learning/lessonData';
import { getProgress, loadProgress, ProgressState } from '@/src/store/progressStore';
import { AppSettings, defaultSettings, loadSettings } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', soft: '#F8FAFD', done: '#27B8A8', locked: '#C7D2DF' };

function getLevelInfo(xp: number) {
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const percent = Math.min(99, xp % 100);
  return { level, percent };
}

function ProgressRing({ xp, dark = false }: { xp: number; dark?: boolean }) {
  const { level, percent } = getLevelInfo(xp);
  return (
    <View style={[styles.ringOuter, dark && styles.cardDark]}>
      <View style={[styles.ringInner, dark && styles.innerDark]}>
        <Text style={styles.levelTitle}>Lv.{level}</Text>
        <Text style={styles.levelSub}>{percent}%</Text>
      </View>
    </View>
  );
}

function ListRow({ title, count, onPress, dark = false }: { title: string; count: string; onPress?: () => void; dark?: boolean }) {
  return (
    <TouchableOpacity style={[styles.listRow, dark && styles.cardDark]} activeOpacity={0.85} onPress={onPress}>
      <Text style={[styles.listTitle, dark && styles.textDark]}>{title}</Text>
      <View style={styles.rowRight}><Text style={styles.count}>{count}</Text><Text style={styles.chevron}>›</Text></View>
    </TouchableOpacity>
  );
}

function LessonCard({ lesson, status, color }: { lesson: Lesson; status: 'done' | 'active' | 'locked'; color: string }) {
  const isDone = status === 'done';
  const isLocked = status === 'locked';
  const statusLabel = isDone ? '완료' : isLocked ? '잠김' : '진행전';
  const cardColor = isDone ? COLORS.done : isLocked ? COLORS.locked : color;

  return (
    <TouchableOpacity
      style={[styles.lessonCard, { backgroundColor: cardColor }, isLocked && styles.lessonCardLocked]}
      onPress={() => !isLocked && router.push(`/lesson/${lesson.id}`)}
      activeOpacity={isLocked ? 1 : 0.9}
    >
      <View style={styles.lessonTopRow}>
        <Text style={styles.lessonCategory}>{lesson.category}</Text>
        <Text style={styles.lessonXp}>+{lesson.xpReward} XP</Text>
      </View>
      <Text style={styles.lessonType}>{lesson.title}</Text>
      <Text style={styles.lessonGoal}>{isDone ? '복습할 수 있어요' : lesson.type === 'mimic' ? 'AI 정확도 체크' : '목표 점수 90점'}</Text>
      <View style={styles.cardProgress}><Text style={styles.cardProgressText}>{statusLabel}</Text></View>
    </TouchableOpacity>
  );
}

export default function LearnHomeScreen() {
  const [progress, setProgress] = useState<ProgressState>(() => getProgress());
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([loadProgress(), loadSettings()]).then(([nextProgress, nextSettings]) => {
        if (!mounted) return;
        setProgress({ ...nextProgress });
        setSettings({ ...nextSettings });
      });
      return () => { mounted = false; };
    }, [])
  );

  const dark = settings.themeMode === 'dark';

  const allLessons = useMemo(() => CURRICULUM.flatMap(unit => unit.lessons.map(lesson => ({ ...lesson, unitColor: unit.color }))), []);
  const completedCount = progress.completedLessons.length;
  const totalCount = allLessons.length;
  const activeLessonId = allLessons.find(item => !progress.completedLessons.includes(item.id))?.id || allLessons[0]?.id;
  const recentCount = Math.max(0, completedCount);
  const reviewCount = Object.values(progress.scores).filter(score => score < 90).length;
  const masteredCount = Object.values(progress.scores).filter(score => score >= 90).length;

  return (
    <SafeAreaView style={[styles.safe, dark && styles.safeDark]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgCircle} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.hello, dark && styles.textDark]}>Hello! Jay</Text>
            <Text style={[styles.sub, dark && styles.textDark]}>{completedCount > 0 ? '학습 기록이 쌓이고 있어요!' : '새로운 학습이 있어요!'}</Text>
            <View style={styles.points}><Text style={styles.pointsText}>{progress.xp} Points</Text></View>
          </View>
          <ProgressRing xp={progress.xp} dark={dark} />
        </View>

        <View style={[styles.summaryPanel, dark && styles.cardDark]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, dark && styles.textDark]}>{completedCount}/{totalCount}</Text>
            <Text style={styles.summaryLabel}>완료 레슨</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, dark && styles.textDark]}>{progress.streak}</Text>
            <Text style={styles.summaryLabel}>연속 학습일</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, dark && styles.textDark]}>{masteredCount}</Text>
            <Text style={styles.summaryLabel}>목표 달성</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, dark && styles.textDark]}>오늘의 학습</Text>
          <TouchableOpacity onPress={() => activeLessonId && router.push(`/lesson/${activeLessonId}`)}>
            <Text style={styles.sectionAction}>이어하기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lessonSlider}>
          {allLessons.map((lesson, index) => {
            const isDone = progress.completedLessons.includes(lesson.id);
            const prevDone = index === 0 || progress.completedLessons.includes(allLessons[index - 1].id);
            const status = isDone ? 'done' : prevDone ? 'active' : 'locked';
            return <LessonCard key={lesson.id} lesson={lesson} status={status} color={lesson.unitColor} />;
          })}
        </ScrollView>

        <View style={[styles.commPanel, dark && styles.cardDark]}>
          <View>
            <Text style={[styles.commTitle, dark && styles.textDark]}>양방향 소통</Text>
            <Text style={[styles.commDesc, dark && styles.subDark]}>수어를 텍스트로, 텍스트를 수어로 변환해요.</Text>
          </View>
          <TouchableOpacity style={styles.commBtn} onPress={() => router.push('/(tabs)/communicate')}>
            <Text style={styles.commBtnText}>열기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listWrap}>
          <ListRow title="최근 학습한 단어" count={`${recentCount}개`} onPress={() => router.push('/(tabs)/profile')} dark={dark} />
          <ListRow title="복습이 필요한 단어" count={`${reviewCount}개`} onPress={() => router.push('/(tabs)/profile')} dark={dark} />
          <ListRow title="목표 점수 달성" count={`${masteredCount}개`} onPress={() => router.push('/(tabs)/profile')} dark={dark} />
          <ListRow title="전체 학습 단어" count={`${totalCount}개`} onPress={() => router.push('/(tabs)/profile')} dark={dark} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 110 },
  bgCircle: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -95, top: -90, backgroundColor: '#E3F1FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  hello: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  sub: { fontSize: 17, color: COLORS.text, marginTop: 8, fontWeight: '600' },
  points: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: '#E8F3FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  pointsText: { color: COLORS.primary, fontWeight: '900' },
  ringOuter: { width: 98, height: 98, borderRadius: 49, borderWidth: 5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  ringInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#F8FAFD', alignItems: 'center', justifyContent: 'center' },
  levelTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  levelSub: { color: COLORS.sub, fontSize: 12, fontWeight: '900', marginTop: 2 },
  summaryPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, paddingVertical: 15, marginBottom: 22 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  summaryLabel: { color: COLORS.sub, fontSize: 11, fontWeight: '800', marginTop: 4 },
  summaryDivider: { width: 1, height: 34, backgroundColor: COLORS.line },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  sectionAction: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  lessonSlider: { gap: 12, paddingRight: 22 },
  lessonCard: { width: 300, height: 158, borderRadius: 14, padding: 22, overflow: 'hidden', shadowColor: COLORS.primary, shadowOpacity: .18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  lessonCardLocked: { shadowOpacity: 0, elevation: 0 },
  lessonTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lessonCategory: { color: 'rgba(255,255,255,.88)', fontSize: 12, fontWeight: '900' },
  lessonXp: { color: 'rgba(255,255,255,.88)', fontSize: 12, fontWeight: '900' },
  lessonType: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  lessonGoal: { color: 'rgba(255,255,255,.78)', fontWeight: '800', marginTop: 6 },
  cardProgress: { position: 'absolute', left: 22, bottom: 20, minWidth: 58, height: 58, borderRadius: 29, borderWidth: 5, borderColor: 'rgba(255,255,255,.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  cardProgressText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  commPanel: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.line },
  commTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  commDesc: { color: COLORS.sub, fontSize: 13, fontWeight: '700', marginTop: 4, maxWidth: 220 },
  commBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 },
  commBtnText: { color: '#fff', fontWeight: '900' },
  listWrap: { marginTop: 18, gap: 9 },
  listRow: { height: 66, backgroundColor: '#FFFFFF', borderRadius: 11, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.line },
  listTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { color: '#B7C0CC', fontWeight: '900' },
  chevron: { color: '#CAD1DA', fontSize: 28, fontWeight: '400' },
  safeDark: { backgroundColor: '#101827' },
  cardDark: { backgroundColor: '#172033', borderColor: '#2B3A55' },
  innerDark: { backgroundColor: '#101827' },
  textDark: { color: '#F8FAFC' },
  subDark: { color: '#B8C4D6' },
});
