import { useCallback, useRef, useState } from 'react';
import { Modal, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSettings, clearChatHistory, defaultSettings, loadSettings, saveSettings } from '@/src/store/settingsStore';

const COLORS = {
  primary: '#1E88F5',
  cyan: '#41C7D8',
  bg: '#F3F8FE',
  card: '#FFFFFF',
  text: '#20242A',
  sub: '#748092',
  line: '#E7EEF8',
  danger: '#F45D75',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SettingRow({
  title,
  desc,
  right,
  danger = false,
  onPress,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.82} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function GoalSlider({
  value,
  onChange,
  dark = false,
}: {
  value: number;
  onChange: (value: number) => void;
  dark?: boolean;
}) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(1);
  const [trackPageX, setTrackPageX] = useState(0);
  const min = 10;
  const max = 100;
  const percent = ((value - min) / (max - min)) * 100;

  const rememberTrackPosition = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      setTrackWidth(Math.max(1, width));
      setTrackPageX(pageX);
    });
  };

  const updateFromX = (locationX?: number, pageX?: number) => {
    const x = typeof locationX === 'number' ? locationX : (typeof pageX === 'number' ? pageX - trackPageX : 0);
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const next = Math.round(min + ratio * (max - min));
    onChange(next);
  };

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderTopRow}>
        <Text style={[styles.sliderLabel, dark && styles.subDark]}>10점</Text>
        <Text style={styles.sliderValue}>{value}점</Text>
        <Text style={[styles.sliderLabel, dark && styles.subDark]}>100점</Text>
      </View>
      <View
        ref={trackRef}
        style={[styles.sliderTrack, dark && styles.sliderTrackDark]}
        onLayout={(event) => {
          setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
          requestAnimationFrame(rememberTrackPosition);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          rememberTrackPosition();
          updateFromX(event.nativeEvent.locationX, event.nativeEvent.pageX);
        }}
        onResponderMove={(event) => updateFromX(event.nativeEvent.locationX, event.nativeEvent.pageX)}
      >
        <View style={[styles.sliderFill, { width: `${percent}%` }]} />
        <View style={[styles.sliderThumb, { left: `${percent}%` }]} />
      </View>
      <Text style={[styles.sliderHelp, dark && styles.subDark]}>막대를 누른 채 좌우로 움직여 오늘의 목표 점수를 조정하세요.</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [draftName, setDraftName] = useState(defaultSettings.profileName);
  const [draftLoginLabel, setDraftLoginLabel] = useState(defaultSettings.loginLabel);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadSettings().then(next => {
        if (mounted) setSettings({ ...next });
      });
      return () => { mounted = false; };
    }, [])
  );

  const updateSetting = async (next: Partial<AppSettings>) => {
    const saved = await saveSettings(next);
    setSettings({ ...saved });
  };

  const handleClearHistory = () => {
    setShowDeleteConfirm(true);
  };

  const confirmClearHistory = async () => {
    await clearChatHistory();
    setShowDeleteConfirm(false);
  };

  const openProfileEdit = () => {
    setDraftName(settings.profileName);
    setDraftLoginLabel(settings.loginLabel);
    setShowProfileEdit(true);
  };

  const saveProfileEdit = async () => {
    const saved = await saveSettings({
      profileName: draftName.trim() || defaultSettings.profileName,
      loginLabel: draftLoginLabel.trim() || defaultSettings.loginLabel,
    });
    setSettings({ ...saved });
    setShowProfileEdit(false);
  };

  const dark = settings.themeMode === 'dark';
  const screenStyle = [styles.safe, dark && styles.safeDark];
  const cardTone = dark ? styles.cardDark : undefined;
  const textTone = dark ? styles.textDark : undefined;
  const subTone = dark ? styles.subDark : undefined;

  return (
    <SafeAreaView style={screenStyle}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bgCircle} />

        <View style={styles.header}>
          <Text style={[styles.title, textTone]}>설정</Text>
          <Text style={[styles.subtitle, subTone]}>학습과 소통 환경을 사용자에게 맞게 조정해요.</Text>
        </View>

        <View style={[styles.profileCard, cardTone]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{settings.profileName.slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, textTone]}>{settings.profileName}</Text>
            <Text style={[styles.userMeta, subTone]}>{settings.loginLabel}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={openProfileEdit}>
            <Text style={styles.editText}>수정</Text>
          </TouchableOpacity>
        </View>


        <Section title="화면 톤">
          <SettingRow
            title="라이트 / 다크 모드"
            desc="앱 화면의 기본 톤을 전환합니다."
            right={<Text style={styles.valueText}>{settings.themeMode === 'dark' ? '다크' : '라이트'}</Text>}
            onPress={() => updateSetting({ themeMode: settings.themeMode === 'dark' ? 'light' : 'dark' })}
          />
        </Section>

        <Section title="접근성">
          <SettingRow
            title="큰 자막 사용"
            desc="소통 화면의 번역 결과를 크게 표시합니다."
            right={<Switch value={settings.largeCaption} onValueChange={(value) => updateSetting({ largeCaption: value })} trackColor={{ false: '#D7DFEA', true: '#B9DDFF' }} thumbColor={settings.largeCaption ? COLORS.primary : '#FFFFFF'} />}
          />
          <Divider />
          <SettingRow
            title="고대비 모드"
            desc="글자와 버튼 대비를 더 강하게 표시합니다."
            right={<Switch value={settings.highContrast} onValueChange={(value) => updateSetting({ highContrast: value })} trackColor={{ false: '#D7DFEA', true: '#B9DDFF' }} thumbColor={settings.highContrast ? COLORS.primary : '#FFFFFF'} />}
          />
          <Divider />
          <SettingRow title="자막 표시 위치" desc="하단 고정" right={<Text style={styles.valueText}>하단</Text>} />
        </Section>

        <Section title="소통 설정">
          <SettingRow title="기본 번역 방향" desc="앱 실행 시 먼저 열릴 소통 모드" right={<Text style={styles.valueText}>{settings.defaultTranslationMode === 'sign_to_text' ? '수어 → 텍스트' : '텍스트 → 수어'}</Text>} onPress={() => updateSetting({ defaultTranslationMode: settings.defaultTranslationMode === 'sign_to_text' ? 'text_to_sign' : 'sign_to_text' })} />
          <Divider />
          <SettingRow
            title="텍스트 자동 음성 출력"
            desc="텍스트 입력 후 음성으로 바로 읽어줍니다."
            right={<Switch value={settings.autoSpeak} onValueChange={(value) => updateSetting({ autoSpeak: value })} trackColor={{ false: '#D7DFEA', true: '#B9DDFF' }} thumbColor={settings.autoSpeak ? COLORS.primary : '#FFFFFF'} />}
          />
          <Divider />
          <SettingRow title="카메라 권한" desc="수어 인식을 위해 필요합니다." right={<Text style={styles.statusOk}>허용됨</Text>} />
          <Divider />
          <SettingRow title="AI 서버 상태" desc="실시간 인식 서버 연결 정보" right={<Text style={styles.statusDemo}>데모</Text>} />
        </Section>

        <Section title="학습 설정">
          <View style={styles.goalRow}>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, dark && styles.textDark]}>일일 목표</Text>
              <Text style={[styles.rowDesc, dark && styles.subDark]}>매일 학습할 퀴즈 목표 점수</Text>
            </View>
            <GoalSlider value={settings.dailyGoal} onChange={(dailyGoal) => updateSetting({ dailyGoal })} dark={dark} />
          </View>
          <Divider />
          <SettingRow
            title="학습 알림"
            desc="정해진 시간에 복습 알림을 보냅니다."
            right={<Switch value={settings.learningAlert} onValueChange={(value) => updateSetting({ learningAlert: value })} trackColor={{ false: '#D7DFEA', true: '#B9DDFF' }} thumbColor={settings.learningAlert ? COLORS.primary : '#FFFFFF'} />}
          />
          <Divider />
          <SettingRow title="복습 난이도" desc="자주 틀린 단어를 더 많이 보여줍니다." right={<Text style={styles.valueText}>보통</Text>} />
        </Section>

        <Section title="개인정보">
          <SettingRow
            title="대화 기록 저장"
            desc="소통 자막 기록을 기기에 저장합니다."
            right={<Switch value={settings.saveHistory} onValueChange={(value) => updateSetting({ saveHistory: value })} trackColor={{ false: '#D7DFEA', true: '#B9DDFF' }} thumbColor={settings.saveHistory ? COLORS.primary : '#FFFFFF'} />}
          />
          <Divider />
          <SettingRow title="저장된 대화 기록 삭제" desc="기기에 저장된 자막 기록을 삭제합니다." danger onPress={handleClearHistory} />
        </Section>

        <Section title="앱 정보">
          <SettingRow title="앱 버전" right={<Text style={styles.valueText}>v1.0.0</Text>} />
          <Divider />
          <SettingRow title="문의하기" desc="오류 제보와 개선 의견을 보냅니다." />
          <Divider />
          <SettingRow title="로그아웃" danger />
        </Section>
      </ScrollView>

      <Modal
        transparent
        visible={showProfileEdit}
        animationType="fade"
        onRequestClose={() => setShowProfileEdit(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmModal, cardTone]}>
            <Text style={[styles.confirmTitle, textTone]}>프로필 수정</Text>
            <Text style={[styles.confirmDesc, subTone]}>설정 화면에 표시될 이름과 로그인 상태 문구를 수정할 수 있어요.</Text>
            <Text style={[styles.inputLabel, textTone]}>이름</Text>
            <TextInput
              style={[styles.profileInput, dark && styles.profileInputDark]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="이름"
              placeholderTextColor="#A7B0BE"
            />
            <Text style={[styles.inputLabel, textTone]}>로그인 표시 문구</Text>
            <TextInput
              style={[styles.profileInput, dark && styles.profileInputDark]}
              value={draftLoginLabel}
              onChangeText={setDraftLoginLabel}
              placeholder="예: Gmail 계정으로 로그인됨"
              placeholderTextColor="#A7B0BE"
            />
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, styles.cancelBtn]} onPress={() => setShowProfileEdit(false)} activeOpacity={0.85}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, styles.saveBtn]} onPress={saveProfileEdit} activeOpacity={0.85}>
                <Text style={styles.deleteText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmModal, cardTone]}>
            <Text style={[styles.confirmTitle, textTone]}>대화 기록 삭제</Text>
            <Text style={[styles.confirmDesc, subTone]}>저장된 대화 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없어요.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, styles.cancelBtn]} onPress={() => setShowDeleteConfirm(false)} activeOpacity={0.85}>
                <Text style={styles.cancelText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, styles.deleteBtn]} onPress={confirmClearHistory} activeOpacity={0.85}>
                <Text style={styles.deleteText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 22, paddingTop: 18, paddingBottom: 110 },
  bgCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -105, top: -100, backgroundColor: '#E3F1FF' },
  header: { marginBottom: 18 },
  title: { color: COLORS.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 6, color: COLORS.sub, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginBottom: 22 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  userName: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  userMeta: { color: COLORS.sub, fontSize: 13, fontWeight: '700', marginTop: 4 },
  editBtn: { borderRadius: 999, backgroundColor: '#E8F3FF', paddingHorizontal: 14, paddingVertical: 9 },
  editText: { color: COLORS.primary, fontWeight: '900' },
  section: { marginBottom: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  row: { minHeight: 66, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  goalRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  rowDesc: { color: COLORS.sub, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.line, marginLeft: 16 },
  chevron: { color: '#B9C2CF', fontSize: 26, fontWeight: '500' },
  valueText: { color: COLORS.sub, fontSize: 13, fontWeight: '900' },
  sliderBlock: { gap: 8 },
  sliderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderLabel: { color: COLORS.sub, fontSize: 12, fontWeight: '800' },
  sliderValue: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  sliderTrack: { height: 18, borderRadius: 999, backgroundColor: '#DDEAF8', justifyContent: 'center', overflow: 'visible' },
  sliderTrackDark: { backgroundColor: '#2B3A55' },
  sliderFill: { position: 'absolute', left: 0, height: '100%', borderRadius: 999, backgroundColor: COLORS.primary },
  sliderThumb: { position: 'absolute', width: 30, height: 30, borderRadius: 15, marginLeft: -15, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: COLORS.primary, shadowColor: '#000', shadowOpacity: .18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  sliderHelp: { color: COLORS.sub, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  statusOk: { color: COLORS.cyan, fontSize: 13, fontWeight: '900' },
  statusDemo: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  dangerText: { color: COLORS.danger },
  safeDark: { backgroundColor: '#101827' },
  cardDark: { backgroundColor: '#172033', borderColor: '#2B3A55' },
  textDark: { color: '#F8FAFC' },
  subDark: { color: '#B8C4D6' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmModal: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: COLORS.line },
  confirmTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  confirmDesc: { color: COLORS.sub, fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 10 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 22 },
  confirmBtn: { flex: 1, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#F2F5F9', borderWidth: 1, borderColor: COLORS.line },
  deleteBtn: { backgroundColor: COLORS.danger },
  saveBtn: { backgroundColor: COLORS.primary },
  inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  profileInput: { height: 52, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#F8FAFD', paddingHorizontal: 14, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  profileInputDark: { backgroundColor: '#101827', borderColor: '#2B3A55', color: '#F8FAFC' },
  cancelText: { color: COLORS.sub, fontSize: 15, fontWeight: '900' },
  deleteText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
