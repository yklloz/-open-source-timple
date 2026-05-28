import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView,
         StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AI_SERVER = 'http://127.0.0.1:8000';
const MIN_CONFIDENCE = 0.35;
const CAPTURE_INTERVAL = 220;

type Mode = 'sign_to_text' | 'text_to_sign';

interface Caption {
  id: string;
  text: string;
  label: string;
  confidence: number;
  time: string;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function CommunicateScreen() {
  const [mode, setMode]               = useState<Mode>('sign_to_text');
  const [apiStatus, setApiStatus]     = useState<'checking' | 'online' | 'offline'>('checking');
  const [isTranslating, setIsTranslating] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [confidence, setConfidence]   = useState(0);
  const [captions, setCaptions]       = useState<Caption[]>([]);
  const [inputText, setInputText]     = useState('');
  const lastCaptionRef = useRef({ label: '', addedAt: 0 });
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 서버 헬스체크 ────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${AI_SERVER}/api/health`);
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // ── 수어 인식 Mock (카메라 없이 동작) ────────────────────
  // 나중에 실제 카메라 프레임으로 교체
  const startTranslating = useCallback(async () => {
    if (apiStatus !== 'online') return;

    await fetch(`${AI_SERVER}/api/reset`, { method: 'POST' }).catch(() => {});
    setBufferProgress(0);
    setIsTranslating(true);

    // Mock: 실제 앱에서는 카메라 프레임을 /api/predict-frame 으로 전송
    // 지금은 Mock 데이터로 UI 동작 확인
    const mockSigns = ['안녕하세요', '감사합니다', '도와주세요', '괜찮아요', '사랑해요'];
    let progress = 0;

    intervalRef.current = setInterval(() => {
      progress = Math.min(100, progress + 15);
      setBufferProgress(progress);

      if (progress >= 100) {
        const mockConf = 0.7 + Math.random() * 0.28;
        const mockLabel = mockSigns[Math.floor(Math.random() * mockSigns.length)];
        const now = Date.now();

        setConfidence(mockConf);

        const isDuplicate =
          lastCaptionRef.current.label === mockLabel &&
          now - lastCaptionRef.current.addedAt < 1800;

        if (!isDuplicate && mockConf >= MIN_CONFIDENCE) {
          lastCaptionRef.current = { label: mockLabel, addedAt: now };
          setCaptions(prev => [...prev, {
            id:         `${mockLabel}-${now}`,
            text:       mockLabel,
            label:      mockLabel,
            confidence: mockConf,
            time:       getCurrentTime(),
          }]);
        }
        progress = 0;
      }
    }, CAPTURE_INTERVAL);
  }, [apiStatus]);

  const stopTranslating = useCallback(() => {
    setIsTranslating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setBufferProgress(0);
  }, []);

  const toggleTranslating = () => {
    isTranslating ? stopTranslating() : startTranslating();
  };

  const clearCaptions = () => {
    setCaptions([]);
    lastCaptionRef.current = { label: '', addedAt: 0 };
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    setCaptions(prev => [...prev, {
      id:         `text-${Date.now()}`,
      text:       inputText,
      label:      'TEXT',
      confidence: 1,
      time:       getCurrentTime(),
    }]);
    setInputText('');
  };

  // ── 상태 뱃지 ─────────────────────────────────────────────
  const statusLabel =
    apiStatus === 'checking' ? '서버 확인 중...' :
    apiStatus === 'offline'  ? 'AI 서버 오프라인' :
    isTranslating            ? `인식 중 ${bufferProgress}%` :
                               'AI 서버 연결됨';

  const statusColor =
    apiStatus === 'offline'  ? '#ef4444' :
    apiStatus === 'checking' ? '#f59e0b' :
    isTranslating            ? '#10b981' :
                               '#3b82f6';

  return (
    <SafeAreaView style={styles.container}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>소통</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={clearCaptions}>
          <Text style={styles.clearBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      {/* 모드 탭 */}
      <View style={styles.modeTab}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'sign_to_text' && styles.modeBtnActive]}
          onPress={() => { setMode('sign_to_text'); stopTranslating(); clearCaptions(); }}
        >
          <Text style={[styles.modeBtnText, mode === 'sign_to_text' && styles.modeBtnTextActive]}>
            🤟 수어 → 텍스트
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'text_to_sign' && styles.modeBtnActive]}
          onPress={() => { setMode('text_to_sign'); stopTranslating(); clearCaptions(); }}
        >
          <Text style={[styles.modeBtnText, mode === 'text_to_sign' && styles.modeBtnTextActive]}>
            💬 텍스트 → 수어
          </Text>
        </TouchableOpacity>
      </View>

      {/* 카메라 영역 */}
      {mode === 'sign_to_text' && (
        <View style={styles.cameraArea}>
          {/* 상태 뱃지 */}
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {/* 카메라 플레이스홀더 */}
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>
              {isTranslating ? '🎥' : '📷'}
            </Text>
            <Text style={styles.cameraHint}>
              {isTranslating
                ? 'AI 카메라 인식 중...\n실제 앱에서 카메라 영상이 표시돼요'
                : '버튼을 눌러\n수어 인식을 시작하세요'}
            </Text>
          </View>

          {/* 신뢰도 */}
          {isTranslating && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                최근 신뢰도 {Math.round(confidence * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 텍스트 → 수어 모드 */}
      {mode === 'text_to_sign' && (
        <View style={styles.ttsArea}>
          <Text style={styles.ttsIcon}>🔊</Text>
          <Text style={styles.ttsTitle}>음성/텍스트 입력</Text>
          <Text style={styles.ttsDesc}>
            텍스트를 입력하면 TTS로 음성 출력돼요{'\n'}
            청각장애인 → 비장애인 방향 소통
          </Text>
        </View>
      )}

      {/* 자막 영역 */}
      <View style={styles.captionWrap}>
        <View style={styles.captionHeader}>
          <Text style={styles.captionTitle}>
            {mode === 'sign_to_text' ? '인식된 텍스트' : '전송된 메시지'}
          </Text>
          <Text style={styles.captionCount}>{captions.length}개</Text>
        </View>

        <ScrollView style={styles.captionScroll}>
          {captions.length === 0 ? (
            <Text style={styles.captionEmpty}>
              {mode === 'sign_to_text'
                ? apiStatus === 'online'
                  ? '수어를 인식하면 여기에 텍스트가 표시돼요'
                  : 'AI 서버를 실행하면 수어 인식을 시작할 수 있어요'
                : '메시지를 입력하면 여기에 표시돼요'}
            </Text>
          ) : (
            captions.map((c, i) => (
              <View key={c.id} style={[
                styles.captionItem,
                i === captions.length - 1 && styles.captionItemLatest
              ]}>
                <Text style={[
                  styles.captionText,
                  i === captions.length - 1 && styles.captionTextLatest
                ]}>
                  {c.text}
                </Text>
                <Text style={styles.captionMeta}>
                  {c.label} · {Math.round(c.confidence * 100)}% · {c.time}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* 하단 컨트롤 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomControl}
      >
        {mode === 'sign_to_text' ? (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.recordBtn,
                isTranslating && styles.recordBtnActive,
                apiStatus !== 'online' && styles.recordBtnDisabled,
              ]}
              onPress={toggleTranslating}
              disabled={apiStatus === 'checking'}
            >
              <Text style={styles.recordBtnIcon}>{isTranslating ? '⏹' : '▶'}</Text>
              <Text style={styles.recordBtnText}>
                {isTranslating ? '인식 중지' : '수어 인식 시작'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendBtnText}>전송</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#fff' },
  header:              { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
                         borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle:         { fontSize: 20, fontWeight: '900', color: '#111' },
  clearBtn:            { paddingHorizontal: 12, paddingVertical: 6,
                         borderRadius: 8, backgroundColor: '#f5f5f5' },
  clearBtnText:        { fontSize: 12, color: '#999', fontWeight: '600' },
  modeTab:             { flexDirection: 'row', margin: 16, gap: 8,
                         backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4 },
  modeBtn:             { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive:       { backgroundColor: '#111' },
  modeBtnText:         { fontSize: 12, fontWeight: '700', color: '#999' },
  modeBtnTextActive:   { color: '#fff' },

  // 카메라
  cameraArea:          { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
                         backgroundColor: '#111', height: 200, position: 'relative',
                         alignItems: 'center', justifyContent: 'center' },
  statusBadge:         { position: 'absolute', top: 12, left: 12,
                         flexDirection: 'row', alignItems: 'center', gap: 6,
                         backgroundColor: 'rgba(0,0,0,0.6)',
                         borderRadius: 20, borderWidth: 1,
                         paddingHorizontal: 12, paddingVertical: 5 },
  statusDot:           { width: 7, height: 7, borderRadius: 4 },
  statusText:          { fontSize: 11, fontWeight: '700' },
  cameraPlaceholder:   { alignItems: 'center', gap: 8 },
  cameraIcon:          { fontSize: 36 },
  cameraHint:          { color: '#fff', fontSize: 13, fontWeight: '600',
                         textAlign: 'center', lineHeight: 20 },
  confidenceBadge:     { position: 'absolute', bottom: 12, left: 12,
                         backgroundColor: 'rgba(0,0,0,0.6)',
                         borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  confidenceText:      { color: '#fff', fontSize: 11, fontWeight: '700' },

  // TTS
  ttsArea:             { marginHorizontal: 16, borderRadius: 16,
                         backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0',
                         height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ttsIcon:             { fontSize: 36 },
  ttsTitle:            { fontSize: 16, fontWeight: '700', color: '#111' },
  ttsDesc:             { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },

  // 자막
  captionWrap:         { flex: 1, marginHorizontal: 16, marginTop: 16 },
  captionHeader:       { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'center', marginBottom: 8 },
  captionTitle:        { fontSize: 13, fontWeight: '700', color: '#111' },
  captionCount:        { fontSize: 12, color: '#999' },
  captionScroll:       { flex: 1, backgroundColor: '#f9f9f9',
                         borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  captionEmpty:        { color: '#bbb', fontSize: 13, textAlign: 'center',
                         paddingTop: 40, paddingHorizontal: 20 },
  captionItem:         { paddingHorizontal: 16, paddingVertical: 10,
                         borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  captionItemLatest:   { backgroundColor: '#f5f5f5' },
  captionText:         { fontSize: 16, color: '#555', fontWeight: '500' },
  captionTextLatest:   { color: '#111', fontWeight: '700' },
  captionMeta:         { fontSize: 11, color: '#bbb', marginTop: 2 },

  // 하단 컨트롤
  bottomControl:       { padding: 16 },
  controlRow:          { gap: 10 },
  recordBtn:           { backgroundColor: '#111', borderRadius: 16,
                         flexDirection: 'row', alignItems: 'center',
                         justifyContent: 'center', padding: 18, gap: 8 },
  recordBtnActive:     { backgroundColor: '#333' },
  recordBtnDisabled:   { backgroundColor: '#ccc' },
  recordBtnIcon:       { fontSize: 18 },
  recordBtnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  inputRow:            { flexDirection: 'row', gap: 10 },
  textInput:           { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12,
                         paddingHorizontal: 16, paddingVertical: 14,
                         fontSize: 15, color: '#111',
                         borderWidth: 1, borderColor: '#e0e0e0' },
  sendBtn:             { backgroundColor: '#111', borderRadius: 12,
                         paddingHorizontal: 20, justifyContent: 'center' },
  sendBtnDisabled:     { backgroundColor: '#e0e0e0' },
  sendBtnText:         { color: '#fff', fontWeight: '700', fontSize: 14 },
});