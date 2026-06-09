import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CURRICULUM } from '@/src/features/learning/lessonData';
import { getProgress, loadProgress, ProgressState } from '@/src/store/progressStore';
import { AppSettings, defaultSettings, loadSettings } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', wrong: '#F45D75', green: '#27B8A8', yellow: '#F5B642' };
const WORD_STATE_KEY = 'signbridge_word_state_v1';

type FilterType = 'all' | 'review' | 'bookmarked' | 'mastered';
type WordStatus = '학습중' | '복습' | '완료';

type WordItem = {
  word: string;
  desc: string;
  tag: string;
  lessonId: string;
  status: WordStatus;
};

type WordUserState = Record<string, { bookmarked?: boolean; mastered?: boolean }>;

const FALLBACK_WORDS: WordItem[] = [
  { word: '안녕하세요', desc: '기본 인사 표현', tag: '인사', lessonId: 'l-1', status: '학습중' },
  { word: '감사합니다', desc: '고마움을 전하는 표현', tag: '인사', lessonId: 'l-3', status: '복습' },
  { word: '도움', desc: '도움이 필요할 때 쓰는 표현', tag: '상황', lessonId: 'l-4', status: '학습중' },
  { word: '병원', desc: '의료기관을 나타내는 표현', tag: '병원', lessonId: 'l-4', status: '학습중' },
  { word: '신분증', desc: '본인 확인 상황 표현', tag: '병원', lessonId: 'l-4', status: '학습중' },
];

function buildWords(progress: ProgressState): WordItem[] {
  const lessonWords = CURRICULUM.flatMap(unit =>
    unit.lessons.map(lesson => {
      const score = progress.scores[lesson.id];
      const done = progress.completedLessons.includes(lesson.id);
      const status: WordStatus = score >= 90 ? '완료' : done ? '복습' : '학습중';
      return {
        word: lesson.sign,
        desc: lesson.description,
        tag: unit.title.replace('기초 ', '').replace('상황별 ', ''),
        lessonId: lesson.id,
        status,
      };
    })
  );

  const merged = [...lessonWords];
  FALLBACK_WORDS.forEach(word => {
    if (!merged.some(item => item.word === word.word)) merged.push(word);
  });
  return merged;
}

function WordRow({
  item,
  userState,
  dark,
  hideWord,
  hideMeaning,
  onToggleBookmark,
  onToggleMastered,
}: {
  item: WordItem;
  userState?: { bookmarked?: boolean; mastered?: boolean };
  dark: boolean;
  hideWord: boolean;
  hideMeaning: boolean;
  onToggleBookmark: () => void;
  onToggleMastered: () => void;
}) {
  const isMastered = Boolean(userState?.mastered) || item.status === '완료';
  const isReview = item.status === '복습' && !isMastered;
  const displayState = isMastered ? '완료' : item.status;
  const barColor = isMastered ? COLORS.green : isReview ? COLORS.wrong : COLORS.primary;

  return (
    <TouchableOpacity style={[styles.wordRow, dark && styles.cardDark]} activeOpacity={0.9} onPress={() => router.push(`/lesson/${item.lessonId}`)}>
      <View style={[styles.statusBar, { backgroundColor: barColor }]} />
      <View style={styles.wordMain}>
        <View style={styles.wordTop}>
          <Text style={[styles.word, dark && styles.textDark]}>{hideWord ? '••••••' : item.word}</Text>
          <Text style={styles.time}>{userState?.bookmarked ? '북마크됨' : '레슨 열기'}</Text>
        </View>
        <Text style={[styles.desc, dark && styles.subDark]}>
          <Text style={styles.tag}>{item.tag}</Text>  {hideMeaning ? '뜻이 숨겨져 있어요' : item.desc}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.smallBtn, userState?.bookmarked && styles.smallBtnActive]} onPress={(event) => { event.stopPropagation(); onToggleBookmark(); }} activeOpacity={0.85}>
            <Text style={[styles.smallBtnText, userState?.bookmarked && styles.smallBtnActiveText]}>{userState?.bookmarked ? '북마크 해제' : '북마크'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, isMastered && styles.masterBtnActive]} onPress={(event) => { event.stopPropagation(); onToggleMastered(); }} activeOpacity={0.85}>
            <Text style={[styles.smallBtnText, isMastered && styles.smallBtnActiveText]}>{isMastered ? '암기 취소' : '암기 완료'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.state, isMastered && styles.stateDone]}>{displayState}</Text>
    </TouchableOpacity>
  );
}

export default function WordLearningScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [progress, setProgress] = useState<ProgressState>(() => getProgress());
  const [wordState, setWordState] = useState<WordUserState>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [hideWord, setHideWord] = useState(false);
  const [hideMeaning, setHideMeaning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([loadSettings(), loadProgress(), AsyncStorage.getItem(WORD_STATE_KEY)]).then(([nextSettings, nextProgress, rawWordState]) => {
        if (!mounted) return;
        setSettings({ ...nextSettings });
        setProgress({ ...nextProgress });
        setWordState(rawWordState ? JSON.parse(rawWordState) : {});
      }).catch(() => undefined);
      return () => { mounted = false; };
    }, [])
  );

  const dark = settings.themeMode === 'dark';
  const words = useMemo(() => buildWords(progress), [progress]);

  const saveWordState = async (next: WordUserState) => {
    setWordState(next);
    await AsyncStorage.setItem(WORD_STATE_KEY, JSON.stringify(next));
  };

  const toggleBookmark = (word: string) => {
    const current = wordState[word] || {};
    saveWordState({ ...wordState, [word]: { ...current, bookmarked: !current.bookmarked } });
  };

  const toggleMastered = (word: string) => {
    const current = wordState[word] || {};
    saveWordState({ ...wordState, [word]: { ...current, mastered: !current.mastered } });
  };

  const filteredWords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return words.filter(item => {
      const state = wordState[item.word] || {};
      const isMastered = Boolean(state.mastered) || item.status === '완료';
      const matchesQuery = !normalized || item.word.toLowerCase().includes(normalized) || item.desc.toLowerCase().includes(normalized) || item.tag.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'review' && item.status === '복습' && !isMastered) ||
        (filter === 'bookmarked' && state.bookmarked) ||
        (filter === 'mastered' && isMastered);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, wordState, words]);

  const reviewCount = words.filter(item => item.status === '복습' && !wordState[item.word]?.mastered).length;
  const bookmarkCount = words.filter(item => wordState[item.word]?.bookmarked).length;
  const masteredCount = words.filter(item => wordState[item.word]?.mastered || item.status === '완료').length;
  const firstActiveLessonId = words.find(item => item.status !== '완료')?.lessonId || words[0]?.lessonId || 'l-1';
  const latestScore = Object.values(progress.scores).slice(-1)[0] ?? 0;
  const remaining = Math.max(0, settings.dailyGoal - latestScore);

  const FilterButton = ({ value, label }: { value: FilterType; label: string }) => (
    <TouchableOpacity style={[styles.filter, filter === value && styles.filterSelected, dark && styles.cardDark]} onPress={() => setFilter(value)} activeOpacity={0.85}>
      <Text style={[styles.filterText, filter === value && styles.filterSelectedText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, dark && styles.safeDark]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgCircle} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, dark && styles.textDark]}>단어 학습</Text>
            <Text style={[styles.subtitle, dark && styles.subDark]}>{settings.profileName}님의 단어장</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{filteredWords.length}개</Text></View>
        </View>

        <TextInput
          style={[styles.searchInput, dark && styles.searchInputDark]}
          value={query}
          onChangeText={setQuery}
          placeholder="단어, 뜻, 태그 검색"
          placeholderTextColor="#A7B0BE"
        />

        <View style={styles.filterRow}>
          <FilterButton value="all" label="모든 단어" />
          <FilterButton value="review" label={`복습 ${reviewCount}`} />
          <FilterButton value="bookmarked" label={`북마크 ${bookmarkCount}`} />
          <FilterButton value="mastered" label={`암기 ${masteredCount}`} />
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, hideWord && styles.toggleBtnActive]} onPress={() => setHideWord(!hideWord)} activeOpacity={0.85}>
            <Text style={[styles.toggleText, hideWord && styles.toggleTextActive]}>단어 숨기기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, hideMeaning && styles.toggleBtnActive]} onPress={() => setHideMeaning(!hideMeaning)} activeOpacity={0.85}>
            <Text style={[styles.toggleText, hideMeaning && styles.toggleTextActive]}>뜻 숨기기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeLabel}>목표</Text>
          <Text style={styles.noticeText}>오늘의 퀴즈 목표 점수는 {settings.dailyGoal}점이에요.</Text>
        </View>

        <View style={[styles.wordList, dark && styles.listDark]}>
          {filteredWords.length > 0 ? filteredWords.map(item => (
            <WordRow
              key={item.word}
              item={item}
              userState={wordState[item.word]}
              dark={dark}
              hideWord={hideWord}
              hideMeaning={hideMeaning}
              onToggleBookmark={() => toggleBookmark(item.word)}
              onToggleMastered={() => toggleMastered(item.word)}
            />
          )) : (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyTitle, dark && styles.textDark]}>조건에 맞는 단어가 없어요.</Text>
              <Text style={[styles.emptyDesc, dark && styles.subDark]}>검색어 또는 필터를 바꿔보세요.</Text>
            </View>
          )}
        </View>

        <View style={[styles.resultCard, dark && styles.cardDark]}>
          <Text style={styles.resultTitle}>최근 퀴즈 결과</Text>
          <View style={styles.scoreCircle}><Text style={styles.scoreMain}>{latestScore || 0}</Text><Text style={styles.scoreSub}>점</Text></View>
          <Text style={[styles.resultDesc, dark && styles.subDark]}>
            {latestScore >= settings.dailyGoal ? '오늘 목표를 달성했어요. 복습으로 감각을 유지해요.' : `목표 점수까지 ${remaining}점 남았어요.`}
          </Text>
          <TouchableOpacity style={styles.quizBtn} activeOpacity={0.9} onPress={() => router.push(`/lesson/${firstActiveLessonId}`)}>
            <Text style={styles.quizText}>퀴즈 도전하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 22, paddingTop: 18, paddingBottom: 110 },
  bgCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -105, top: -100, backgroundColor: '#E3F1FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  title: { color: COLORS.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: COLORS.sub, marginTop: 5, fontSize: 13, fontWeight: '800' },
  badge: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  searchInput: { height: 54, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 16, color: COLORS.text, fontWeight: '800', marginBottom: 12 },
  searchInputDark: { backgroundColor: '#172033', borderColor: '#2B3A55', color: '#F8FAFC' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filter: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.line },
  filterSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.primary, fontWeight: '900', fontSize: 12 },
  filterSelectedText: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F3FF', borderWidth: 1, borderColor: '#D7E9FF' },
  toggleBtnActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  toggleText: { color: COLORS.primary, fontWeight: '900' },
  toggleTextActive: { color: '#FFFFFF' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14 },
  noticeLabel: { color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '900', fontSize: 12 },
  noticeText: { color: '#FFFFFF', fontWeight: '900', flex: 1 },
  wordList: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  wordRow: { minHeight: 118, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: '#FFFFFF' },
  statusBar: { width: 5, alignSelf: 'stretch' },
  wordMain: { flex: 1, paddingHorizontal: 16, paddingVertical: 14 },
  wordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  word: { color: COLORS.text, fontSize: 18, fontWeight: '900', flex: 1 },
  time: { color: '#B6BECA', fontSize: 12, fontWeight: '800' },
  desc: { color: COLORS.sub, marginTop: 8, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  tag: { color: COLORS.primary, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallBtn: { borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: '#FFFFFF' },
  smallBtnActive: { backgroundColor: COLORS.yellow, borderColor: COLORS.yellow },
  masterBtnActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  smallBtnText: { color: COLORS.sub, fontSize: 12, fontWeight: '900' },
  smallBtnActiveText: { color: '#FFFFFF' },
  state: { color: '#B6BECA', fontWeight: '900', fontSize: 12, paddingRight: 14 },
  stateDone: { color: COLORS.green },
  emptyBox: { padding: 26, alignItems: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  emptyDesc: { color: COLORS.sub, marginTop: 7, fontWeight: '700' },
  resultCard: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  resultTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '900', marginBottom: 18 },
  scoreCircle: { width: 118, height: 118, borderRadius: 59, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: .22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  scoreMain: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  scoreSub: { color: 'rgba(255,255,255,.78)', fontSize: 12, fontWeight: '900', marginTop: 3 },
  resultDesc: { color: COLORS.sub, fontSize: 15, fontWeight: '800', lineHeight: 22, textAlign: 'center', marginTop: 18 },
  quizBtn: { marginTop: 18, height: 54, alignSelf: 'stretch', borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  quizText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  safeDark: { backgroundColor: '#101827' },
  cardDark: { backgroundColor: '#172033', borderColor: '#2B3A55' },
  listDark: { backgroundColor: '#172033', borderColor: '#2B3A55' },
  textDark: { color: '#F8FAFC' },
  subDark: { color: '#B8C4D6' },
});
