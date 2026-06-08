import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const COLORS = {
  primary: '#1E88F5',
  cyan: '#45C8D8',
  bg: '#F3F8FE',
  text: '#20242A',
  sub: '#748092',
  line: '#E7EEF8',
};

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <View style={styles.brandRow}>
        <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
        <Text style={styles.brand}>SignBridge</Text>
      </View>

      <View style={styles.phoneCard}>
        <View style={styles.phoneHeader}>
          <Text style={styles.phoneTitle}>오늘의 학습</Text>
          <View style={styles.levelBadge}><Text style={styles.levelText}>Lv. 2</Text></View>
        </View>
        <View style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>기본 인사 수어</Text>
          <Text style={styles.lessonSub}>목표 점수 90점</Text>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        </View>
        <View style={styles.rowCard}><Text style={styles.rowTitle}>최근 학습한 단어</Text><Text style={styles.rowCount}>23개</Text></View>
        <View style={styles.rowCard}><Text style={styles.rowTitle}>복습이 필요한 단어</Text><Text style={styles.rowCount}>10개</Text></View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>수어를 매일 조금씩{`\n`}쉽게 배워요</Text>
        <Text style={styles.desc}>단어 학습, 따라하기 퀴즈, 실시간 소통을 하나의 앱에서 사용할 수 있어요.</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/learn')} activeOpacity={0.9}>
        <Text style={styles.primaryText}>시작하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)')} activeOpacity={0.85}>
        <Text style={styles.loginText}>로그인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 34, overflow: 'hidden' },
  circleTop: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -88, top: -72, backgroundColor: '#E3F1FF' },
  circleBottom: { position: 'absolute', width: 260, height: 260, borderRadius: 130, left: -140, bottom: 80, backgroundColor: '#DFF7FB' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  brand: { fontSize: 22, color: COLORS.text, fontWeight: '900' },
  phoneCard: { marginTop: 52, backgroundColor: '#FFFFFF', borderRadius: 34, padding: 22, borderWidth: 8, borderColor: '#FFFFFF', shadowColor: '#B9D6F2', shadowOpacity: 0.42, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 14 },
  phoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  phoneTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  levelBadge: { backgroundColor: '#E8F3FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  levelText: { color: COLORS.primary, fontWeight: '900' },
  lessonCard: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 18, marginBottom: 12 },
  lessonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  lessonSub: { color: 'rgba(255,255,255,.78)', fontWeight: '800', marginTop: 5 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.32)', marginTop: 20, overflow: 'hidden' },
  progressFill: { width: '62%', height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFD', padding: 16, borderRadius: 15, marginTop: 8, borderWidth: 1, borderColor: COLORS.line },
  rowTitle: { color: COLORS.text, fontWeight: '800' },
  rowCount: { color: '#B2BBC8', fontWeight: '900' },
  copy: { marginTop: 'auto' },
  title: { color: COLORS.text, fontSize: 32, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  desc: { color: COLORS.sub, fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 12 },
  primaryBtn: { height: 58, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 28, shadowColor: COLORS.primary, shadowOpacity: .25, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 9 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  loginBtn: { alignItems: 'center', paddingTop: 18 },
  loginText: { color: COLORS.sub, fontWeight: '900' },
});
