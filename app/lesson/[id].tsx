import { useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SignMediaPlaceholder from '@/src/components/SignMediaPlaceholder';
import { getLesson, Lesson } from '@/src/features/learning/lessonData';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', wrong: '#F45D75', correct: '#27B8A8' };

function goToResult(lesson: Lesson, score: number) {
  router.replace({
    pathname: '/lesson/result',
    params: {
      score: String(score),
      xp: String(lesson.xpReward),
      sign: lesson.sign,
      lessonId: lesson.id,
      title: lesson.title,
    },
  });
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLesson(id);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>레슨을 찾을 수 없어요</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/learn')}>
            <Text style={styles.primaryText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgCircle} />
        <Header lesson={lesson} />
        {lesson.type === 'watch' && <WatchLesson lesson={lesson} />}
        {lesson.type === 'mimic' && <MimicLesson lesson={lesson} />}
        {lesson.type === 'quiz' && <QuizLesson lesson={lesson} />}
        {lesson.type === 'reverse_quiz' && <QuizLesson lesson={lesson} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ lesson }: { lesson: Lesson }) {
  const progress = lesson.type === 'quiz' ? '3 / 3' : lesson.type === 'mimic' ? '2 / 3' : '1 / 3';
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.85}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: progress === '1 / 3' ? '34%' : progress === '2 / 3' ? '67%' : '100%' }]} /></View>
        <Text style={styles.progressText}>{progress}</Text>
      </View>
    </View>
  );
}

function SignPreview({ lesson }: { lesson: Lesson }) {
  return (
    <View style={styles.previewCard}>
      <SignMediaPlaceholder
        title={lesson.sign}
        description={lesson.meaning}
        label="수어 클립 준비 중"
        variant="light"
        height={220}
      />
    </View>
  );
}

function InfoBlock({ lesson }: { lesson: Lesson }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{lesson.category}</Text>
      <Text style={styles.infoTitle}>{lesson.title}</Text>
      <Text style={styles.infoDesc}>{lesson.description}</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>핵심 포인트</Text>
        <Text style={styles.tipText}>{lesson.tip}</Text>
      </View>
    </View>
  );
}

function WatchLesson({ lesson }: { lesson: Lesson }) {
  const [known, setKnown] = useState<'known' | 'review' | null>(null);
  return (
    <View style={styles.lessonWrap}>
      <InfoBlock lesson={lesson} />
      <SignPreview lesson={lesson} />
      <View style={styles.checkRow}>
        <TouchableOpacity style={[styles.checkBtn, known === 'review' && styles.checkBtnActiveLight]} onPress={() => setKnown('review')}>
          <Text style={[styles.checkText, known === 'review' && styles.checkTextActiveLight]}>다시 볼래요</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkBtn, known === 'known' && styles.checkBtnActive]} onPress={() => setKnown('known')}>
          <Text style={[styles.checkText, known === 'known' && styles.checkTextActive]}>알아요</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.primaryBtn, !known && styles.disabledBtn]} disabled={!known} onPress={() => goToResult(lesson, known === 'known' ? 100 : 75)}>
        <Text style={styles.primaryText}>학습 완료</Text>
      </TouchableOpacity>
    </View>
  );
}

function MimicLesson({ lesson }: { lesson: Lesson }) {
  const [started, setStarted] = useState(false);
  const score = useMemo(() => started ? 86 : 0, [started]);
  return (
    <View style={styles.lessonWrap}>
      <InfoBlock lesson={lesson} />
      <View style={styles.cameraCard}>
        <View style={styles.cameraTop}>
          <Text style={styles.cameraTitle}>따라하기 연습</Text>
          <Text style={styles.cameraStatus}>{started ? `정확도 ${score}%` : '대기 중'}</Text>
        </View>
        <View style={styles.cameraArea}>
          <View style={styles.scanFrame}>
            <View style={styles.scanLine} />
            <Text style={styles.cameraText}>{lesson.sign}</Text>
            <Text style={styles.cameraSub}>손과 상체를 가이드 안에 맞춰주세요.</Text>
          </View>
        </View>
      </View>
      {!started ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStarted(true)}>
          <Text style={styles.primaryText}>AI 채점 시작</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => goToResult(lesson, score)}>
          <Text style={styles.primaryText}>결과 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuizLesson({ lesson }: { lesson: Lesson }) {
  const quizItems = lesson.quizItems || [{
    id: 'q1',
    prompt: lesson.meaning,
    sign: lesson.sign,
    meaning: lesson.description,
    options: lesson.options || [],
    answer: lesson.answer || lesson.sign,
  }];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const item = quizItems[index];
  const isCorrect = selected === item.answer;
  const isLast = index === quizItems.length - 1;
  const currentScore = Math.round(((correctCount + (selected && isCorrect ? 1 : 0)) / quizItems.length) * 100);

  const handleNext = () => {
    if (!selected) return;
    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);
    const nextAnswers = [...answers, isCorrect];

    if (isLast) {
      const finalScore = Math.round((nextCorrectCount / quizItems.length) * 100);
      goToResult(lesson, finalScore);
      return;
    }

    setCorrectCount(nextCorrectCount);
    setAnswers(nextAnswers);
    setIndex(prev => prev + 1);
    setSelected(null);
  };

  return (
    <View style={styles.lessonWrap}>
      <View style={styles.quizTopCard}>
        <View style={styles.quizMetaRow}>
          <Text style={styles.infoLabel}>퀴즈</Text>
          <Text style={styles.quizCounter}>{index + 1} / {quizItems.length}</Text>
        </View>
        <View style={styles.quizDots}>
          {quizItems.map((quiz, dotIndex) => {
            const solved = dotIndex < answers.length;
            const active = dotIndex === index;
            const solvedCorrect = answers[dotIndex];
            return <View key={quiz.id} style={[styles.quizDot, active && styles.quizDotActive, solved && (solvedCorrect ? styles.quizDotCorrect : styles.quizDotWrong)]} />;
          })}
        </View>
        <Text style={styles.infoTitle}>{item.prompt}</Text>
        <Text style={styles.infoDesc}>{item.meaning}</Text>
      </View>

      <View style={styles.quizMediaCard}>
        <SignMediaPlaceholder
          title="이 수어 표현의 뜻을 고르세요."
          description="현재는 데모 클립 영역입니다. 실제 수어 영상/사진이 준비되면 이 영역에 재생됩니다."
          label="수어 영상"
          variant="dark"
          height={250}
        />
      </View>

      <View style={styles.optionsWrap}>
        {item.options.map(option => {
          const picked = selected === option;
          const right = option === item.answer;
          const activeStyle = selected ? right ? styles.optionCorrect : picked ? styles.optionWrong : styles.optionDim : null;
          return (
            <TouchableOpacity key={option} style={[styles.optionBtn, activeStyle]} onPress={() => !selected && setSelected(option)} activeOpacity={0.86}>
              <Text style={[styles.optionText, selected && right && styles.optionTextCorrect, selected && picked && !right && styles.optionTextWrong]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected ? (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackTitle, isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>{isCorrect ? '정답이에요' : '다시 확인해볼까요?'}</Text>
          <Text style={styles.feedbackDesc}>{isCorrect ? `현재 예상 점수 ${currentScore}점이에요.` : `정답은 “${item.answer}”입니다.`}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.primaryBtn, !selected && styles.disabledBtn]} disabled={!selected} onPress={handleNext}>
        <Text style={styles.primaryText}>{isLast ? '결과 보기' : '다음 문제'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 22, paddingTop: 14, paddingBottom: 28 },
  bgCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -105, top: -100, backgroundColor: '#E3F1FF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  closeBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  closeText: { color: COLORS.sub, fontSize: 26, lineHeight: 28, fontWeight: '600' },
  progressWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 10, backgroundColor: '#DDEAF8', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 999 },
  progressText: { color: COLORS.sub, fontWeight: '900', fontSize: 12 },
  lessonWrap: { gap: 14 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.line },
  infoLabel: { alignSelf: 'flex-start', color: COLORS.primary, backgroundColor: '#E8F3FF', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '900', marginBottom: 12 },
  infoTitle: { color: COLORS.text, fontSize: 25, lineHeight: 32, fontWeight: '900', letterSpacing: -0.7 },
  infoDesc: { color: COLORS.sub, fontSize: 15, lineHeight: 23, fontWeight: '700', marginTop: 10 },
  tipBox: { marginTop: 16, backgroundColor: '#F8FAFD', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.line },
  tipTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  tipText: { color: COLORS.sub, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  previewCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  videoMock: { width: '100%', height: 210, borderRadius: 16, backgroundColor: '#F8FAFD', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  handGuide: { width: 140, height: 150, position: 'relative' },
  palm: { position: 'absolute', bottom: 8, left: 38, width: 72, height: 74, borderRadius: 28, backgroundColor: '#D8E9FA', borderWidth: 2, borderColor: COLORS.primary },
  finger: { position: 'absolute', bottom: 72, width: 16, borderRadius: 10, backgroundColor: '#D8E9FA', borderWidth: 2, borderColor: COLORS.primary },
  sign: { color: COLORS.text, fontSize: 30, fontWeight: '900', marginTop: 16 },
  meaning: { color: COLORS.sub, textAlign: 'center', fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 6 },
  checkRow: { flexDirection: 'row', gap: 10 },
  checkBtn: { flex: 1, height: 56, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  checkBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkBtnActiveLight: { backgroundColor: '#E8F3FF', borderColor: COLORS.primary },
  checkText: { color: COLORS.sub, fontSize: 15, fontWeight: '900' },
  checkTextActive: { color: '#FFFFFF' },
  checkTextActiveLight: { color: COLORS.primary },
  cameraCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line },
  cameraTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cameraTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  cameraStatus: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  cameraArea: { height: 260, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanFrame: { width: '78%', height: '68%', borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,.32)', alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', top: '48%', width: '88%', height: 2, backgroundColor: COLORS.cyan },
  cameraText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  cameraSub: { color: 'rgba(255,255,255,.62)', fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  quizTopCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.line },
  quizMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quizCounter: { color: COLORS.sub, fontSize: 13, fontWeight: '900' },
  quizDots: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  quizDot: { flex: 1, height: 7, borderRadius: 999, backgroundColor: '#DDEAF8' },
  quizDotActive: { backgroundColor: COLORS.primary },
  quizDotCorrect: { backgroundColor: COLORS.correct },
  quizDotWrong: { backgroundColor: COLORS.wrong },
  quizMediaCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line },
  quizVideoFrame: { height: 250, borderRadius: 18, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mediaHandGuide: { width: 126, height: 138, position: 'relative', opacity: 0.96 },
  mediaPalm: { position: 'absolute', bottom: 8, left: 34, width: 68, height: 70, borderRadius: 28, backgroundColor: '#D8E9FA', borderWidth: 2, borderColor: COLORS.cyan },
  mediaFinger: { position: 'absolute', bottom: 68, width: 15, borderRadius: 10, backgroundColor: '#D8E9FA', borderWidth: 2, borderColor: COLORS.cyan },
  playButton: { position: 'absolute', width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  playIcon: { color: COLORS.primary, fontSize: 25, fontWeight: '900', marginLeft: 4 },
  mediaBadge: { position: 'absolute', left: 14, top: 14, backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  mediaBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  quizMediaTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  quizMediaHint: { color: COLORS.sub, fontSize: 13, fontWeight: '700', lineHeight: 19, textAlign: 'center', marginTop: 7 },
  optionsWrap: { gap: 10 },
  optionBtn: { minHeight: 58, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, justifyContent: 'center', paddingHorizontal: 18 },
  optionCorrect: { backgroundColor: '#E9FAF8', borderColor: COLORS.correct },
  optionWrong: { backgroundColor: '#FFF0F3', borderColor: COLORS.wrong },
  optionDim: { opacity: 0.55 },
  optionText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  optionTextCorrect: { color: COLORS.correct },
  optionTextWrong: { color: COLORS.wrong },
  feedback: { borderRadius: 16, padding: 16, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: '#E9FAF8', borderColor: COLORS.correct },
  feedbackWrong: { backgroundColor: '#FFF0F3', borderColor: COLORS.wrong },
  feedbackTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  feedbackTextCorrect: { color: COLORS.correct },
  feedbackTextWrong: { color: COLORS.wrong },
  feedbackDesc: { color: COLORS.sub, fontWeight: '700', lineHeight: 20 },
  primaryBtn: { height: 58, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: .22, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 8 },
  disabledBtn: { backgroundColor: '#B7CBE0', shadowOpacity: 0, elevation: 0 },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  notFound: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 18 },
  notFoundTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
});
