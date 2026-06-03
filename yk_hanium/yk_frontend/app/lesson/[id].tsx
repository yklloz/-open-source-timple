import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type LessonType = 'watch' | 'mimic' | 'quiz' | 'reverse_quiz';

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  sign: string;
  description: string;
  options?: string[];
  xpReward: number;
}

const LESSONS: Record<string, Lesson> = {
  'l-1': { id: 'l-1', title: 'ㄱ, ㄴ, ㄷ 배우기', type: 'watch',
           sign: 'ㄱ', xpReward: 10,
           description: '손을 구부려 ㄱ 모양을 만들어요. 검지를 구부리면 됩니다.' },
  'l-2': { id: 'l-2', title: 'ㄱ 따라하기', type: 'mimic',
           sign: 'ㄱ', xpReward: 15,
           description: '카메라를 보고 ㄱ 수어를 따라해보세요.' },
  'l-3': { id: 'l-3', title: '지문자 퀴즈', type: 'quiz',
           sign: 'ㄴ', xpReward: 20,
           description: '아래 수어는 무엇일까요?',
           options: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'] },
  'l-4': { id: 'l-4', title: '안녕하세요 배우기', type: 'watch',
           sign: '안녕하세요', xpReward: 10,
           description: '손을 펴서 이마 옆에서 바깥쪽으로 흔들어요.' },
  'l-5': { id: 'l-5', title: '감사합니다 따라하기', type: 'mimic',
           sign: '감사합니다', xpReward: 15,
           description: '카메라를 보고 감사합니다 수어를 따라해보세요.' },
  'l-6': { id: 'l-6', title: '인사 퀴즈', type: 'reverse_quiz',
           sign: '죄송합니다', xpReward: 20,
           description: '"죄송합니다"를 수어로 표현해보세요.' },
  'l-7': { id: 'l-7', title: '1~5 배우기', type: 'watch',
           sign: '1', xpReward: 10,
           description: '숫자 1부터 5까지 수어로 배워요.' },
  'l-8': { id: 'l-8', title: '6~10 배우기', type: 'watch',
           sign: '6', xpReward: 10,
           description: '숫자 6부터 10까지 수어로 배워요.' },
  'l-9': { id: 'l-9', title: '숫자 퀴즈', type: 'quiz',
           sign: '3', xpReward: 20,
           description: '아래 수어는 몇 번일까요?',
           options: ['1', '2', '3', '4'] },
};

function goToResult(lesson: Lesson, score: number) {
  router.replace({
    pathname: '/lesson/result',
    params: {
      score:    score,
      xp:       lesson.xpReward,
      sign:     lesson.sign,
      lessonId: lesson.id,
    }
  });
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson  = LESSONS[id];

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>레슨을 찾을 수 없어요</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {lesson.type === 'watch'        && <WatchLesson   lesson={lesson} />}
      {lesson.type === 'mimic'        && <MimicLesson   lesson={lesson} />}
      {lesson.type === 'quiz'         && <QuizLesson    lesson={lesson} />}
      {lesson.type === 'reverse_quiz' && <ReverseLesson lesson={lesson} />}
    </View>
  );
}

// ── Watch ──────────────────────────────────────────────
function WatchLesson({ lesson }: { lesson: Lesson }) {
  return (
    <View style={styles.lessonWrap}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.lessonType}>👀 학습</Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <View style={styles.signDisplay}>
        <Text style={styles.signEmoji}>🤟</Text>
        <Text style={styles.signText}>{lesson.sign}</Text>
        <Text style={styles.signHint}>실제 앱에서는 수어 영상이 재생돼요</Text>
      </View>
      <Text style={styles.description}>{lesson.description}</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 핵심 포인트</Text>
        <Text style={styles.tipText}>손 모양을 천천히 따라하면서 익혀보세요.</Text>
        <Text style={styles.tipText}>거울 앞에서 연습하면 더 효과적이에요.</Text>
      </View>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => goToResult(lesson, 100)}
      >
        <Text style={styles.primaryBtnText}>다음 →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Quiz ───────────────────────────────────────────────
function QuizLesson({ lesson }: { lesson: Lesson }) {
  const [selected, setSelected] = useState<string | null>(null);
  const correct   = lesson.sign;
  const isCorrect = selected === correct;

  return (
    <View style={styles.lessonWrap}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.lessonType}>❓ 퀴즈</Text>
      <Text style={styles.lessonTitle}>{lesson.description}</Text>
      <View style={styles.signDisplay}>
        <Text style={styles.signEmoji}>🤟</Text>
        <Text style={styles.signText}>{lesson.sign}</Text>
      </View>
      <View style={styles.optionsGrid}>
        {lesson.options?.map(option => {
          const isSelected = selected === option;
          const isRight    = option === correct;
          let btnStyle = styles.optionBtn;
          if (selected) {
            if (isRight)         btnStyle = { ...styles.optionBtn, ...styles.optionCorrect };
            else if (isSelected) btnStyle = { ...styles.optionBtn, ...styles.optionWrong };
          }
          return (
            <TouchableOpacity
              key={option}
              style={btnStyle}
              onPress={() => !selected && setSelected(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selected && (
        <View style={[styles.resultBox, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
          <Text style={styles.resultText}>
            {isCorrect ? '🎉 정답이에요!' : `❌ 틀렸어요. 정답은 ${correct}예요.`}
          </Text>
        </View>
      )}
      {selected && (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => goToResult(lesson, isCorrect ? 100 : 50)}
        >
          <Text style={styles.primaryBtnText}>결과 보기 →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Mimic ──────────────────────────────────────────────
function MimicLesson({ lesson }: { lesson: Lesson }) {
  return (
    <View style={styles.lessonWrap}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.lessonType}>🎯 따라하기</Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <View style={styles.signDisplay}>
        <Text style={styles.signEmoji}>📷</Text>
        <Text style={styles.signText}>{lesson.sign}</Text>
        <Text style={styles.signHint}>AI 카메라 채점 기능은 추후 연동돼요</Text>
      </View>
      <Text style={styles.description}>{lesson.description}</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => goToResult(lesson, 85)}
      >
        <Text style={styles.primaryBtnText}>완료 →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Reverse ────────────────────────────────────────────
function ReverseLesson({ lesson }: { lesson: Lesson }) {
  return (
    <View style={styles.lessonWrap}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.lessonType}>✍️ 역퀴즈</Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <View style={styles.signDisplay}>
        <Text style={styles.signEmoji}>💬</Text>
        <Text style={styles.signText}>{lesson.sign}</Text>
        <Text style={styles.signHint}>위 단어를 수어로 표현해보세요</Text>
      </View>
      <Text style={styles.description}>{lesson.description}</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => goToResult(lesson, 90)}
      >
        <Text style={styles.primaryBtnText}>완료 →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  lessonWrap:     { flex: 1, padding: 24, paddingTop: 60, gap: 16 },
  closeBtn:       { alignSelf: 'flex-end', width: 36, height: 36,
                    borderRadius: 18, backgroundColor: '#f0f0f0',
                    alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { color: '#555', fontSize: 16, fontWeight: '700' },
  lessonType:     { fontSize: 13, color: '#555', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: 1 },
  lessonTitle:    { fontSize: 22, fontWeight: '900', color: '#111' },
  signDisplay:    { backgroundColor: '#f9f9f9', borderRadius: 20,
                    borderWidth: 1, borderColor: '#e0e0e0',
                    alignItems: 'center', padding: 32, gap: 8 },
  signEmoji:      { fontSize: 48 },
  signText:       { fontSize: 36, fontWeight: '900', color: '#111' },
  signHint:       { fontSize: 12, color: '#999', textAlign: 'center' },
  description:    { fontSize: 15, color: '#555', lineHeight: 24 },
  tipBox:         { backgroundColor: '#f9f9f9', borderRadius: 16,
                    borderWidth: 1, borderColor: '#e0e0e0', padding: 16, gap: 6 },
  tipTitle:       { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 4 },
  tipText:        { fontSize: 13, color: '#777', lineHeight: 20 },
  optionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionBtn:      { flex: 1, minWidth: '45%', backgroundColor: '#f9f9f9',
                    borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 16,
                    padding: 20, alignItems: 'center' },
  optionCorrect:  { borderColor: '#111', backgroundColor: '#f0f0f0' },
  optionWrong:    { borderColor: '#ccc', backgroundColor: '#f9f9f9' },
  optionText:     { fontSize: 24, fontWeight: '900', color: '#111' },
  resultBox:      { borderRadius: 16, padding: 16 },
  resultCorrect:  { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#111' },
  resultWrong:    { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ccc' },
  resultText:     { fontSize: 15, fontWeight: '700', color: '#111' },
  primaryBtn:     { backgroundColor: '#111', padding: 18,
                    borderRadius: 16, alignItems: 'center', marginTop: 'auto' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  errorText:      { fontSize: 18, color: '#111', marginBottom: 16 },
  backLink:       { fontSize: 15, color: '#555' },
});