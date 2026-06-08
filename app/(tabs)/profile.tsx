import { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSettings, defaultSettings, loadSettings } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', wrong: '#F45D75' };

const WORDS = [
  { word: '안녕하세요', desc: '기본 인사 표현', tag: '인사', state: '완료' },
  { word: '감사합니다', desc: '고마움을 전하는 표현', tag: '인사', state: '복습' },
  { word: '도움', desc: '도움이 필요할 때 쓰는 표현', tag: '상황', state: '학습중' },
  { word: '병원', desc: '의료기관을 나타내는 표현', tag: '장소', state: '완료' },
  { word: '신분증', desc: '본인 확인 상황 표현', tag: '관공서', state: '북마크' },
];

function WordRow({ item, dark }: { item: typeof WORDS[number]; dark: boolean }) {
  const isDone = item.state === '완료';
  const isReview = item.state === '복습';
  return (
    <TouchableOpacity style={[styles.wordRow, dark && styles.cardDark]} activeOpacity={0.85}>
      <View style={[styles.statusBar, { backgroundColor: isDone ? COLORS.cyan : isReview ? COLORS.wrong : COLORS.primary }]} />
      <View style={styles.wordMain}>
        <View style={styles.wordTop}>
          <Text style={[styles.word, dark && styles.textDark]}>{item.word}</Text>
          <Text style={styles.time}>하루전</Text>
        </View>
        <Text style={[styles.desc, dark && styles.subDark]}><Text style={styles.tag}>{item.tag}</Text>  {item.desc}</Text>
      </View>
      <Text style={styles.state}>{item.state}</Text>
    </TouchableOpacity>
  );
}

export default function WordLearningScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadSettings().then(next => {
        if (mounted) setSettings({ ...next });
      });
      return () => { mounted = false; };
    }, [])
  );

  const dark = settings.themeMode === 'dark';

  return (
    <SafeAreaView style={[styles.safe, dark && styles.safeDark]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgCircle} />
        <View style={styles.header}>
          <Text style={[styles.title, dark && styles.textDark]}>단어 학습</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>진행전</Text></View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterActive}><Text style={[styles.filterActiveText, dark && styles.textDark]}>모든 단어</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filter, dark && styles.cardDark]}><Text style={styles.filterText}>단어 숨기기</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filter, dark && styles.cardDark]}><Text style={styles.filterText}>뜻 숨기기</Text></TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeLabel}>진행전</Text>
          <Text style={styles.noticeText}>오늘의 퀴즈 목표 점수는 90점이에요.</Text>
        </View>

        <View style={[styles.wordList, dark && styles.listDark]}>
          {WORDS.map(item => <WordRow key={item.word} item={item} dark={dark} />)}
        </View>

        <View style={[styles.resultCard, dark && styles.cardDark]}>
          <Text style={styles.resultTitle}>최근 퀴즈 결과</Text>
          <View style={styles.scoreCircle}><Text style={styles.scoreMain}>7/10</Text><Text style={styles.scoreSub}>잘하고 있어요</Text></View>
          <Text style={[styles.resultDesc, dark && styles.subDark]}>목표 점수 90점을 향해 3문제만 더 맞혀보세요.</Text>
          <TouchableOpacity style={styles.quizBtn} activeOpacity={0.9}>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterActive: { backgroundColor: 'transparent', paddingVertical: 9, paddingRight: 14 },
  filterActiveText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  filter: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.line },
  filterText: { color: COLORS.primary, fontWeight: '900', fontSize: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14 },
  noticeLabel: { color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '900', fontSize: 12 },
  noticeText: { color: '#FFFFFF', fontWeight: '900', flex: 1 },
  wordList: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  wordRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: '#FFFFFF' },
  statusBar: { width: 5, alignSelf: 'stretch' },
  wordMain: { flex: 1, paddingHorizontal: 16, paddingVertical: 14 },
  wordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  word: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  time: { color: '#B6BECA', fontSize: 12, fontWeight: '800' },
  desc: { color: COLORS.sub, marginTop: 8, fontSize: 14, fontWeight: '700' },
  tag: { color: COLORS.primary, fontWeight: '900' },
  state: { color: '#B6BECA', fontWeight: '900', fontSize: 12, paddingRight: 14 },
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
