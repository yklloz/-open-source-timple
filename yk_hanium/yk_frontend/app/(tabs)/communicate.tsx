import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AI_SERVER = 'http://127.0.0.1:8000';
const MIN_CONFIDENCE = 0.35;
const CAPTURE_INTERVAL = 220;

type Mode = 'sign_to_text' | 'text_to_sign';
type ApiStatus = 'checking' | 'online' | 'offline';

interface Caption {
  id: string;
  text: string;
  label: string;
  confidence: number;
  time: string;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommunicateScreen() {
  const [mode, setMode] = useState<Mode>('sign_to_text');
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [isTranslating, setIsTranslating] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [inputText, setInputText] = useState('');
  const lastCaptionRef = useRef({ label: '', addedAt: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${AI_SERVER}/api/health`);
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };

    checkServer();
    const id = setInterval(checkServer, 5000);
    return () => clearInterval(id);
  }, []);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
    lastCaptionRef.current = { label: '', addedAt: 0 };
  }, []);

  const stopTranslating = useCallback(() => {
    setIsTranslating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setBufferProgress(0);
  }, []);

  const startTranslating = useCallback(async () => {
    if (apiStatus !== 'online' || isTranslating) return;

    await fetch(`${AI_SERVER}/api/reset`, { method: 'POST' }).catch(() => {});
    setBufferProgress(0);
    setIsTranslating(true);

    const mockSigns = ['안녕하세요', '감사합니다', '도와주세요', '괜찮아요', '사랑해요'];
    let progress = 0;

    intervalRef.current = setInterval(() => {
      progress = Math.min(100, progress + 15);
      setBufferProgress(progress);

      if (progress < 100) return;

      const mockConf = 0.7 + Math.random() * 0.28;
      const mockLabel = mockSigns[Math.floor(Math.random() * mockSigns.length)];
      const now = Date.now();
      const isDuplicate =
        lastCaptionRef.current.label === mockLabel &&
        now - lastCaptionRef.current.addedAt < 1800;

      setConfidence(mockConf);

      if (!isDuplicate && mockConf >= MIN_CONFIDENCE) {
        lastCaptionRef.current = { label: mockLabel, addedAt: now };
        setCaptions((prev) => [
          ...prev,
          {
            id: `${mockLabel}-${now}`,
            text: mockLabel,
            label: mockLabel,
            confidence: mockConf,
            time: getCurrentTime(),
          },
        ]);
      }

      progress = 0;
    }, CAPTURE_INTERVAL);
  }, [apiStatus, isTranslating]);

  useEffect(() => stopTranslating, [stopTranslating]);

  const toggleTranslating = () => {
    if (isTranslating) {
      stopTranslating();
    } else {
      startTranslating();
    }
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    stopTranslating();
    clearCaptions();
  };

  const handleSend = () => {
    const message = inputText.trim();
    if (!message) return;

    setCaptions((prev) => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        text: message,
        label: '텍스트',
        confidence: 1,
        time: getCurrentTime(),
      },
    ]);
    setInputText('');
  };

  const statusLabel =
    apiStatus === 'checking'
      ? '서버 확인 중...'
      : apiStatus === 'offline'
        ? 'AI 서버 연결 안 됨'
        : isTranslating
          ? `인식 중 ${bufferProgress}%`
          : 'AI 서버 연결됨';

  const statusColor =
    apiStatus === 'offline'
      ? '#ef4444'
      : apiStatus === 'checking'
        ? '#f59e0b'
        : isTranslating
          ? '#10b981'
          : '#3b82f6';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>소통</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={clearCaptions}>
          <Text style={styles.clearBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeTab}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'sign_to_text' && styles.modeBtnActive]}
          onPress={() => changeMode('sign_to_text')}
        >
          <Text style={[styles.modeBtnText, mode === 'sign_to_text' && styles.modeBtnTextActive]}>
            수어를 글자로
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'text_to_sign' && styles.modeBtnActive]}
          onPress={() => changeMode('text_to_sign')}
        >
          <Text style={[styles.modeBtnText, mode === 'text_to_sign' && styles.modeBtnTextActive]}>
            글자를 수어로
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'sign_to_text' && (
        <View style={styles.cameraArea}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>{isTranslating ? '인식' : '카메라'}</Text>
            <Text style={styles.cameraHint}>
              {isTranslating
                ? '수어 인식 예시가 실행 중이에요.\n실제 카메라 입력은 추후 연결할 수 있어요.'
                : '아래 버튼을 눌러\n수어 인식을 시작해보세요.'}
            </Text>
          </View>

          {isTranslating && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                신뢰도 {Math.round(confidence * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {mode === 'text_to_sign' && (
        <View style={styles.ttsArea}>
          <Text style={styles.ttsIcon}>입력</Text>
          <Text style={styles.ttsTitle}>텍스트 입력</Text>
          <Text style={styles.ttsDesc}>
            아래에 문장을 입력하면 대화 목록에 표시돼요.
          </Text>
        </View>
      )}

      <View style={styles.captionWrap}>
        <View style={styles.captionHeader}>
          <Text style={styles.captionTitle}>
            {mode === 'sign_to_text' ? '인식된 문장' : '보낸 문장'}
          </Text>
          <Text style={styles.captionCount}>{captions.length}</Text>
        </View>

        <ScrollView style={styles.captionScroll}>
          {captions.length === 0 ? (
            <Text style={styles.captionEmpty}>
              {mode === 'sign_to_text'
                ? apiStatus === 'online'
                  ? '수어를 인식하면 여기에 문장이 표시돼요.'
                  : '인식을 사용하려면 백엔드 서버를 먼저 실행해주세요.'
                : '보낸 문장이 여기에 표시돼요.'}
            </Text>
          ) : (
            captions.map((caption, index) => (
              <View
                key={caption.id}
                style={[
                  styles.captionItem,
                  index === captions.length - 1 && styles.captionItemLatest,
                ]}
              >
                <Text
                  style={[
                    styles.captionText,
                    index === captions.length - 1 && styles.captionTextLatest,
                  ]}
                >
                  {caption.text}
                </Text>
                <Text style={styles.captionMeta}>
                  {caption.label} | {Math.round(caption.confidence * 100)}% | {caption.time}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

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
              disabled={apiStatus === 'checking' || apiStatus === 'offline'}
            >
              <Text style={styles.recordBtnIcon}>{isTranslating ? '정지' : '시작'}</Text>
              <Text style={styles.recordBtnText}>
                {isTranslating ? '수어 인식 멈추기' : '수어 인식 시작'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="문장을 입력하세요"
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    alignItems: 'center',
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { color: '#111', fontSize: 20, fontWeight: '900' },
  clearBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: { color: '#777', fontSize: 12, fontWeight: '600' },
  modeTab: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    margin: 16,
    padding: 4,
  },
  modeBtn: { alignItems: 'center', borderRadius: 10, flex: 1, paddingVertical: 10 },
  modeBtnActive: { backgroundColor: '#111' },
  modeBtnText: { color: '#777', fontSize: 12, fontWeight: '700' },
  modeBtnTextActive: { color: '#fff' },
  cameraArea: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    marginHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cameraPlaceholder: { alignItems: 'center', gap: 8 },
  cameraIcon: { color: '#fff', fontSize: 24, fontWeight: '900' },
  cameraHint: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  confidenceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'absolute',
  },
  confidenceText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ttsArea: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    height: 200,
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 24,
  },
  ttsIcon: { color: '#111', fontSize: 22, fontWeight: '900' },
  ttsTitle: { color: '#111', fontSize: 16, fontWeight: '700' },
  ttsDesc: { color: '#777', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  captionWrap: { flex: 1, marginHorizontal: 16, marginTop: 16 },
  captionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  captionTitle: { color: '#111', fontSize: 13, fontWeight: '700' },
  captionCount: { color: '#777', fontSize: 12 },
  captionScroll: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  captionEmpty: { color: '#999', fontSize: 13, paddingHorizontal: 20, paddingTop: 40, textAlign: 'center' },
  captionItem: {
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  captionItemLatest: { backgroundColor: '#f5f5f5' },
  captionText: { color: '#555', fontSize: 16, fontWeight: '500' },
  captionTextLatest: { color: '#111', fontWeight: '700' },
  captionMeta: { color: '#999', fontSize: 11, marginTop: 2 },
  bottomControl: { padding: 16 },
  controlRow: { gap: 10 },
  recordBtn: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 18,
  },
  recordBtnActive: { backgroundColor: '#333' },
  recordBtnDisabled: { backgroundColor: '#ccc' },
  recordBtnIcon: { color: '#fff', fontSize: 14, fontWeight: '900' },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 10 },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111',
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sendBtn: { backgroundColor: '#111', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  sendBtnDisabled: { backgroundColor: '#e0e0e0' },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
