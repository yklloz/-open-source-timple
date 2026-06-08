import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import SignMediaPlaceholder from '@/src/components/SignMediaPlaceholder';
import { getScenarioPack, SCENARIO_PACKS, ScenarioId, ScenarioPhrase } from '@/src/features/communication/scenarioPacks';
import { AppSettings, defaultSettings, loadChatHistory, loadSettings, saveChatHistory } from '@/src/store/settingsStore';

const COLORS = { primary: '#1E88F5', cyan: '#41C7D8', bg: '#F3F8FE', card: '#FFFFFF', text: '#20242A', sub: '#748092', line: '#E7EEF8', danger: '#F45D75', done: '#27B8A8' };

type Mode = 'sign_to_text' | 'text_to_sign';
type Message = { id: string; speaker: '사용자' | '직원'; text: string; mine?: boolean; time: string; scenario?: string };

function nowTime() { return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); }

function ScenarioCard({ id, selected, onPress }: { id: ScenarioId; selected: boolean; onPress: () => void }) {
  const pack = getScenarioPack(id);
  return (
    <TouchableOpacity style={[styles.scenarioCard, selected && { borderColor: pack.color, backgroundColor: '#FFFFFF' }]} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.scenarioMark, { backgroundColor: pack.color }]}><Text style={styles.scenarioMarkText}>{pack.name.slice(0, 1)}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={styles.scenarioNameRow}>
          <Text style={styles.scenarioName}>{pack.name}</Text>
          <Text style={[styles.scenarioStatus, pack.status === 'ready' ? styles.scenarioReady : styles.scenarioPlanned]}>{pack.status === 'ready' ? '우선 지원' : '확장 예정'}</Text>
        </View>
        <Text style={styles.scenarioSubtitle}>{pack.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PhraseChip({ phrase, onPress }: { phrase: ScenarioPhrase; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.phraseChip} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.phraseCategory}>{phrase.category}</Text>
      <Text style={styles.phraseText}>{phrase.text}</Text>
    </TouchableOpacity>
  );
}

export default function CommunicateScreen() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('hospital');
  const [mode, setMode] = useState<Mode>('sign_to_text');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', speaker: '직원', text: '어디가 불편하세요?', time: nowTime(), scenario: '병원' },
    { id: 'm2', speaker: '사용자', text: '진료 접수하고 싶어요.', mine: true, time: nowTime(), scenario: '병원' },
  ]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadSettings().then(next => {
        if (!mounted) return;
        setSettings({ ...next });
        setMode(next.defaultTranslationMode);
        if (next.saveHistory) {
          loadChatHistory<Message[]>().then(history => {
            if (mounted && history?.length) setMessages(history);
          });
        }
      });
      return () => { mounted = false; };
    }, [])
  );

  useEffect(() => {
    if (settings.saveHistory) {
      saveChatHistory(messages).catch(() => {});
    }
  }, [messages, settings.saveHistory]);

  const dark = settings.themeMode === 'dark';
  const themedSafe = [styles.safe, dark && styles.safeDark];
  const themedCard = dark ? styles.cardDark : undefined;
  const themedText = dark ? styles.textDark : undefined;
  const themedSub = dark ? styles.subDark : undefined;

  const pack = getScenarioPack(scenarioId);
  const categories = useMemo(() => Array.from(new Set(pack.phrases.map(p => p.category))), [pack]);
  const primaryPhrases = useMemo(() => pack.phrases.slice(0, scenarioId === 'hospital' ? 10 : 4), [pack, scenarioId]);

  const addPhrase = (phrase: ScenarioPhrase) => {
    setMessages(prev => [...prev, {
      id: `${phrase.id}-${Date.now()}`,
      speaker: phrase.speaker === 'staff' ? '직원' : '사용자',
      text: phrase.text,
      mine: phrase.speaker !== 'staff',
      time: nowTime(),
      scenario: pack.name,
    }]);
    setInputText(phrase.text);
  };

  const send = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, {
      id: String(Date.now()),
      speaker: mode === 'text_to_sign' ? '직원' : '사용자',
      text: inputText.trim(),
      mine: mode === 'sign_to_text',
      time: nowTime(),
      scenario: pack.name,
    }]);
    setInputText('');
  };

  const runScenarioMock = () => {
    setIsRunning(true);
    const userPhrases = pack.phrases.filter(p => p.speaker === 'user');
    const phrase = userPhrases[Math.floor(Math.random() * userPhrases.length)] || pack.phrases[0];
    setTimeout(() => {
      addPhrase(phrase);
      setIsRunning(false);
    }, 900);
  };

  return (
    <SafeAreaView style={themedSafe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.bgCircle} />
          <View style={styles.header}>
            <Text style={[styles.title, themedText]}>상황별 소통</Text>
            <Text style={[styles.subtitle, themedSub]}>장소별 표현팩을 선택하면 번역 후보와 빠른 문장이 그 상황에 맞게 좁혀집니다.</Text>
          </View>

          <Text style={[styles.sectionTitle, themedText]}>상황 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioSlider}>
            {SCENARIO_PACKS.map(packItem => (
              <ScenarioCard key={packItem.id} id={packItem.id} selected={packItem.id === scenarioId} onPress={() => setScenarioId(packItem.id)} />
            ))}
          </ScrollView>

          <View style={[styles.packBanner, themedCard, settings.highContrast && styles.highContrastCard, { borderColor: `${pack.color}33` }]}>
            <View style={[styles.packLine, { backgroundColor: pack.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.packTitle}>{pack.name} 소통팩</Text>
              <Text style={styles.packDesc}>{pack.description}</Text>
              <View style={styles.categoryRow}>{categories.map(c => <Text key={c} style={styles.categoryPill}>{c}</Text>)}</View>
            </View>
          </View>

          <View style={[styles.segment, themedCard]}>
            <TouchableOpacity style={[styles.segmentBtn, mode === 'sign_to_text' && styles.segmentActive]} onPress={() => setMode('sign_to_text')}>
              <Text style={[styles.segmentText, mode === 'sign_to_text' && styles.segmentTextActive]}>수어 → 텍스트</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentBtn, mode === 'text_to_sign' && styles.segmentActive]} onPress={() => setMode('text_to_sign')}>
              <Text style={[styles.segmentText, mode === 'text_to_sign' && styles.segmentTextActive]}>텍스트 → 수어</Text>
            </TouchableOpacity>
          </View>

          {mode === 'sign_to_text' ? (
            <View style={[styles.translationCard, themedCard]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{pack.name} 수어 인식</Text>
                <Text style={styles.candidateText}>후보 {pack.phrases.length}개</Text>
              </View>
              <View style={styles.cameraArea}>
                <View style={styles.scanFrame}>
                  <View style={styles.scanLine} />
                  <Text style={styles.cameraText}>{isRunning ? '상황팩 기반 분석 중' : `${pack.name} 표현을 보여주세요`}</Text>
                  <Text style={styles.cameraSub}>{isRunning ? '병원 표현 후보에서 가장 가까운 문장을 찾고 있어요.' : '데모에서는 버튼을 누르면 예시 문장이 추가됩니다.'}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.primaryBtn, isRunning && styles.disabledBtn]} onPress={runScenarioMock} disabled={isRunning}>
                <Text style={styles.primaryBtnText}>{isRunning ? '인식 중...' : `${pack.name} 수어 인식 시작`}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.translationCard, themedCard]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{pack.name} 수어 표현</Text>
                <Text style={styles.candidateText}>영상 클립 준비</Text>
              </View>
              <SignMediaPlaceholder
                title="선택한 문장을 수어 클립으로 표시"
                description="videoId 또는 gloss를 연결하면 실제 수어 클립을 순서대로 재생할 수 있어요."
                label={`${pack.name} 수어 클립`}
                variant="light"
                height={240}
              />
            </View>
          )}

          <View style={[styles.quickCard, themedCard]}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{pack.name} 빠른 문장</Text>
              <Text style={styles.candidateText}>{pack.status === 'ready' ? '병원 우선' : '샘플'}</Text>
            </View>
            <View style={styles.phraseWrap}>
              {primaryPhrases.map(phrase => <PhraseChip key={phrase.id} phrase={phrase} onPress={() => addPhrase(phrase)} />)}
            </View>
          </View>

          <View style={[styles.messagesCard, themedCard, settings.highContrast && styles.highContrastCard]}>
            <View style={styles.messagesHeader}>
              <Text style={styles.sectionTitle}>대화 자막</Text>
              <TouchableOpacity onPress={() => setMessages([])}><Text style={styles.clearText}>{settings.saveHistory ? '초기화/저장' : '초기화'}</Text></TouchableOpacity>
            </View>
            {messages.length === 0 ? <Text style={[styles.emptyText, settings.largeCaption && styles.largeCaptionText]}>아직 대화가 없어요. 빠른 문장을 선택하거나 인식을 시작해보세요.</Text> : messages.map(msg => (
              <View key={msg.id} style={[styles.messageWrap, msg.mine && styles.messageMine]}>
                <Text style={styles.speaker}>{msg.speaker} · {msg.time} · {msg.scenario}</Text>
                <View style={[styles.bubble, msg.mine && styles.bubbleMine]}>
                  <Text style={[styles.bubbleText, settings.largeCaption && styles.largeBubbleText, msg.mine && styles.bubbleTextMine]}>{msg.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput style={styles.input} placeholder={`${pack.name} 상황에서 전달할 문장`} placeholderTextColor="#A7B0BE" value={inputText} onChangeText={setInputText} />
          <TouchableOpacity style={styles.sendBtn} onPress={send}><Text style={styles.sendText}>전송</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 22, paddingTop: 18, paddingBottom: 150 },
  bgCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -105, top: -100, backgroundColor: '#E3F1FF' },
  header: { marginBottom: 18 },
  title: { fontSize: 29, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  subtitle: { marginTop: 6, color: COLORS.sub, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  scenarioSlider: { gap: 10, paddingVertical: 12, paddingRight: 22 },
  scenarioCard: { width: 230, minHeight: 92, backgroundColor: 'rgba(255,255,255,.72)', borderRadius: 18, padding: 14, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 },
  scenarioMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  scenarioMarkText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  scenarioNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  scenarioName: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  scenarioStatus: { fontSize: 10, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  scenarioReady: { color: COLORS.primary, backgroundColor: '#E8F3FF' },
  scenarioPlanned: { color: COLORS.sub, backgroundColor: '#F2F5F9' },
  scenarioSubtitle: { color: COLORS.sub, fontSize: 13, fontWeight: '700', marginTop: 5 },
  packBanner: { flexDirection: 'row', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14 },
  packLine: { width: 5, borderRadius: 999 },
  packTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  packDesc: { color: COLORS.sub, fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 5 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  categoryPill: { color: COLORS.primary, backgroundColor: '#E8F3FF', fontSize: 11, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  segment: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 5, marginBottom: 14, borderWidth: 1, borderColor: COLORS.line },
  segmentBtn: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { color: COLORS.sub, fontWeight: '900' },
  segmentTextActive: { color: '#FFFFFF' },
  translationCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14 },
  quickCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', flex: 1 },
  candidateText: { color: COLORS.sub, fontSize: 12, fontWeight: '900' },
  cameraArea: { height: 240, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanFrame: { width: '80%', height: '68%', borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,.32)', alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', top: '48%', width: '88%', height: 2, backgroundColor: COLORS.cyan },
  cameraText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  cameraSub: { color: 'rgba(255,255,255,.62)', fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center', maxWidth: 240, lineHeight: 18 },
  primaryBtn: { height: 54, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  disabledBtn: { backgroundColor: '#B7CBE0' },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  signPreviewArea: { height: 240, backgroundColor: '#F8FAFD', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, padding: 24 },
  playCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginLeft: 4 },
  signPreviewTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  signPreviewDesc: { color: COLORS.sub, fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 8, textAlign: 'center' },
  phraseWrap: { gap: 9 },
  phraseChip: { backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, padding: 14 },
  phraseCategory: { color: COLORS.primary, fontSize: 11, fontWeight: '900', marginBottom: 5 },
  phraseText: { color: COLORS.text, fontSize: 15, fontWeight: '900', lineHeight: 21 },
  messagesCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, gap: 12 },
  messagesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearText: { color: COLORS.primary, fontWeight: '900' },
  emptyText: { color: COLORS.sub, fontWeight: '700', lineHeight: 20 },
  messageWrap: { alignSelf: 'flex-start', maxWidth: '84%' },
  messageMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  speaker: { color: COLORS.sub, fontSize: 11, fontWeight: '800', marginBottom: 5 },
  bubble: { backgroundColor: '#F0F5FB', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 12 },
  bubbleMine: { backgroundColor: COLORS.primary },
  bubbleText: { color: COLORS.text, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  bubbleTextMine: { color: '#FFFFFF' },
  inputBar: { position: 'absolute', left: 18, right: 18, bottom: 88, flexDirection: 'row', gap: 10, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, shadowColor: '#B9D6F2', shadowOpacity: .34, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  input: { flex: 1, height: 44, borderRadius: 14, backgroundColor: '#F8FAFD', paddingHorizontal: 14, color: COLORS.text, fontWeight: '700' },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '900' },

  highContrastCard: { borderColor: '#20242A', borderWidth: 2 },
  safeDark: { backgroundColor: '#101827' },
  cardDark: { backgroundColor: '#172033', borderColor: '#2B3A55' },
  textDark: { color: '#F8FAFC' },
  subDark: { color: '#B8C4D6' },
  largeCaptionText: { fontSize: 17, lineHeight: 25 },
  largeBubbleText: { fontSize: 19, lineHeight: 27 },
});
