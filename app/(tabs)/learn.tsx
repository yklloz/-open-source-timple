import { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Moa from '@/src/components/Moa';
import { getMyProgress, getToken } from '@/src/api';

type LessonType = 'watch' | 'mimic' | 'quiz' | 'reverse_quiz';

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  sign: string;
  xpReward: number;
  isLocked: boolean;
}

interface Unit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
}

const BASE_CURRICULUM: Unit[] = [
  {
    id: 'unit-1', title: '지문자', emoji: '🔤', color: '#3b82f6',
    lessons: [
      { id: 'l-1', title: 'ㄱ, ㄴ, ㄷ 배우기', type: 'watch',        sign: 'ㄱ', xpReward: 10, isLocked: false },
      { id: 'l-2', title: 'ㄱ 따라하기',        type: 'mimic',        sign: 'ㄱ', xpReward: 15, isLocked: true  },
      { id: 'l-3', title: '지문자 퀴즈',        type: 'quiz',         sign: 'ㄴ', xpReward: 20, isLocked: true  },
    ],
  },
  {
    id: 'unit-2', title: '기본 인사', emoji: '👋', color: '#10b981',
    lessons: [
      { id: 'l-4', title: '안녕하세요 배우기',   type: 'watch',        sign: '안녕하세요', xpReward: 10, isLocked: true },
      { id: 'l-5', title: '감사합니다 따라하기', type: 'mimic',        sign: '감사합니다', xpReward: 15, isLocked: true },
      { id: 'l-6', title: '인사 퀴즈',          type: 'reverse_quiz', sign: '죄송합니다', xpReward: 20, isLocked: true },
    ],
  },
  {
    id: 'unit-3', title: '숫자', emoji: '🔢', color: '#f59e0b',
    lessons: [
      { id: 'l-7', title: '1~5 배우기',  type: 'watch', sign: '1', xpReward: 10, isLocked: true },
      { id: 'l-8', title: '6~10 배우기', type: 'watch', sign: '6', xpReward: 10, isLocked: true },
      { id: 'l-9', title: '숫자 퀴즈',   type: 'quiz',  sign: '3', xpReward: 20, isLocked: true },
    ],
  },
];

const LESSON_ICONS: Record<LessonType, string> = {
  watch: '👀', mimic: '🎯', quiz: '❓', reverse_quiz: '✍️',
};
const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  watch: '학습', mimic: '따라하기', quiz: '퀴즈', reverse_quiz: '역퀴즈',
};

function applyProgress(curriculum: Unit[], completed: string[]): Unit[] {
  const allLessons = curriculum.flatMap(u => u.lessons);
  return curriculum.map(unit => ({
    ...unit,
    lessons: unit.lessons.map(lesson => {
      if (!lesson.isLocked) return lesson;
      const idx     = allLessons.findIndex(l => l.id === lesson.id);
      const prev    = idx > 0 ? allLessons[idx - 1] : null;
      const unlocked = prev ? completed.includes(prev.id) : false;
      return { ...lesson, isLocked: !unlocked };
    }),
  }));
}

export default function LearnScreen() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp,     setXp]     = useState(0);
  const [streak] = useState(3);
  const [curriculum, setCurriculum] = useState(BASE_CURRICULUM);

  // 화면 포커스될 때마다 진도 새로고침
  useFocusEffect(
    useCallback(() => {
      const token = getToken();
      if (!token) return;

      getMyProgress()
        .then(data => {
          const completed = data.completed as string[];
          setCompletedLessons(completed);
          setCurriculum(applyProgress(BASE_CURRICULUM, completed));
          setXp(completed.length * 10);
        })
        .catch(() => {});
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>손이음</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{xp}</Text>
          </View>
        </View>
      </View>

      {/* 모아 */}
      <View style={styles.moaWrap}>
        <Moa mood="happy" size={90} animate={true} message="오늘도 같이 배워보자!" />
      </View>

      {/* 언어 선택 */}
      <View style={styles.langRow}>
        <TouchableOpacity style={[styles.langBtn, styles.langBtnActive]}>
          <Text style={styles.langBtnTextActive}>🇰🇷 KSL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.langBtn}>
          <Text style={styles.langBtnText}>🇺🇸 ASL</Text>
        </TouchableOpacity>
      </View>

      {/* 유닛 */}
      {curriculum.map((unit) => (
        <View key={unit.id} style={styles.unit}>
          <View style={styles.unitHeader}>
            <Text style={styles.unitEmoji}>{unit.emoji}</Text>
            <View>
              <Text style={styles.unitTitle}>{unit.title}</Text>
              <Text style={styles.unitSub}>{unit.lessons.length}개 레슨</Text>
            </View>
          </View>

          <View style={styles.lessonPath}>
            {unit.lessons.map((lesson, index) => {
              const isDone   = completedLessons.includes(lesson.id);
              const isActive = !lesson.isLocked && !isDone;
              const position = index % 3 === 0 ? 'flex-start' : index % 3 === 1 ? 'center' : 'flex-end';

              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonNode,
                    { alignSelf: position as any },
                    isActive  && styles.nodeActive,
                    isDone    && styles.nodeDone,
                    lesson.isLocked && styles.nodeLocked,
                  ]}
                  onPress={() => !lesson.isLocked && router.push(`/lesson/${lesson.id}`)}
                  disabled={lesson.isLocked}
                  activeOpacity={0.7}
                >
                  <Text style={styles.nodeIcon}>
                    {lesson.isLocked ? '🔒' : isDone ? '✅' : LESSON_ICONS[lesson.type]}
                  </Text>
                  <Text style={styles.nodeTitle}>{lesson.title}</Text>
                  <View style={styles.nodeBottom}>
                    <Text style={styles.nodeType}>{LESSON_TYPE_LABEL[lesson.type]}</Text>
                    <Text style={styles.nodeXP}>+{lesson.xpReward}XP</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#fff' },
  header:            { flexDirection: 'row', justifyContent: 'space-between',
                       alignItems: 'center', padding: 20, paddingTop: 60,
                       borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle:       { fontSize: 20, fontWeight: '900', color: '#111' },
  statsRow:          { flexDirection: 'row', gap: 8 },
  statBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4,
                       backgroundColor: '#f5f5f5', borderRadius: 20,
                       paddingHorizontal: 12, paddingVertical: 6 },
  statIcon:          { fontSize: 14 },
  statValue:         { fontSize: 14, fontWeight: '700', color: '#111' },
  moaWrap:           { alignItems: 'center', paddingVertical: 16 },
  langRow:           { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  langBtn:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                       backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0' },
  langBtnActive:     { backgroundColor: '#111', borderColor: '#111' },
  langBtnText:       { fontSize: 13, color: '#999', fontWeight: '600' },
  langBtnTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  unit:              { marginBottom: 16, paddingHorizontal: 20 },
  unitHeader:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                       padding: 16, borderRadius: 16, marginBottom: 20,
                       borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' },
  unitEmoji:         { fontSize: 28 },
  unitTitle:         { fontSize: 16, fontWeight: '700', color: '#111' },
  unitSub:           { fontSize: 12, color: '#999', marginTop: 2 },
  lessonPath:        { gap: 16, paddingHorizontal: 8 },
  lessonNode:        { width: 140, padding: 14, borderRadius: 16,
                       backgroundColor: '#f9f9f9', borderWidth: 2,
                       borderColor: '#e0e0e0', gap: 6 },
  nodeActive:        { borderColor: '#111', backgroundColor: '#fff',
                       shadowColor: '#000', shadowOpacity: .08,
                       shadowRadius: 12, elevation: 4 },
  nodeDone:          { backgroundColor: '#f0f0f0', borderColor: '#ccc' },
  nodeLocked:        { opacity: 0.35 },
  nodeIcon:          { fontSize: 26 },
  nodeTitle:         { fontSize: 12, fontWeight: '600', color: '#111' },
  nodeBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeType:          { fontSize: 10, color: '#999' },
  nodeXP:            { fontSize: 10, color: '#555', fontWeight: '700' },
});