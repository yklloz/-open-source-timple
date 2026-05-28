import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Moa from '@/src/components/Moa';

interface Badge {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  earned: boolean;
}

const BADGES: Badge[] = [
  { id: 'b-1', emoji: '🌱', title: '첫 걸음',    desc: '첫 레슨 완료',        earned: true  },
  { id: 'b-2', emoji: '🔥', title: '3일 연속',   desc: '3일 연속 학습',       earned: true  },
  { id: 'b-3', emoji: '⭐', title: '100 XP',     desc: 'XP 100점 달성',      earned: false },
  { id: 'b-4', emoji: '🤟', title: '지문자 마스터', desc: '지문자 유닛 완료',  earned: false },
  { id: 'b-5', emoji: '👋', title: '인사 마스터', desc: '인사 유닛 완료',      earned: false },
  { id: 'b-6', emoji: '🏆', title: '완벽주의자',  desc: '100점 레슨 3개',     earned: false },
];

const LEVEL_TITLES = ['입문자', '초보자', '중급자', '고급자', '마스터'];

export default function ProfileScreen() {
  const [xp]     = useState(25);
  const [streak] = useState(3);
  const maxXP    = 100;
  const level    = Math.min(Math.floor(xp / 100), 4);
  const progress = (xp % 100) / 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      {/* 모아 + 유저 정보 */}
      <View style={styles.profileCard}>
        <Moa mood="proud" size={100} animate={true} message={undefined} />
        <Text style={styles.userName}>손이음 학습자</Text>
        <Text style={styles.userLevel}>{LEVEL_TITLES[level]}</Text>
      </View>

      {/* 스탯 카드 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statNum}>{streak}</Text>
          <Text style={styles.statLabel}>일 연속</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statNum}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statNum}>1</Text>
          <Text style={styles.statLabel}>완료 레슨</Text>
        </View>
      </View>

      {/* 레벨 진행도 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>레벨 진행도</Text>
          <Text style={styles.sectionSub}>Lv.{level + 1} {LEVEL_TITLES[level]}</Text>
        </View>
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>현재 XP</Text>
            <Text style={styles.levelXP}>{xp} / {maxXP} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.levelNext}>
            다음 레벨까지 {maxXP - xp} XP 남았어요
          </Text>
        </View>
      </View>

      {/* 스트릭 캘린더 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 학습 스트릭</Text>
          <Text style={styles.sectionSub}>{streak}일 연속</Text>
        </View>
        <View style={styles.calendarCard}>
          {['월','화','수','목','금','토','일'].map((day, i) => (
            <View key={day} style={styles.dayWrap}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={[
                styles.dayCircle,
                i < streak && styles.dayCircleDone,
                i === streak - 1 && styles.dayCircleToday,
              ]}>
                <Text style={[
                  styles.dayText,
                  i < streak && styles.dayTextDone,
                ]}>
                  {i < streak ? '✓' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 배지 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏅 배지</Text>
          <Text style={styles.sectionSub}>
            {BADGES.filter(b => b.earned).length}/{BADGES.length} 획득
          </Text>
        </View>
        <View style={styles.badgeGrid}>
          {BADGES.map(badge => (
            <View key={badge.id} style={[
              styles.badgeCard,
              !badge.earned && styles.badgeCardLocked,
            ]}>
              <Text style={[styles.badgeEmoji, !badge.earned && styles.badgeLocked]}>
                {badge.emoji}
              </Text>
              <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTextLocked]}>
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
              {badge.earned && (
                <View style={styles.earnedBadge}>
                  <Text style={styles.earnedText}>획득!</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 언어 설정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>학습 언어</Text>
            <View style={styles.langBtns}>
              <TouchableOpacity style={[styles.langBtn, styles.langBtnActive]}>
                <Text style={styles.langBtnTextActive}>🇰🇷 KSL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langBtn}>
                <Text style={styles.langBtnText}>🇺🇸 ASL</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>앱 버전</Text>
            <Text style={styles.settingValue}>v1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>만든 사람</Text>
            <Text style={styles.settingValue}>손이음팀</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff' },
  header:             { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
                        borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle:        { fontSize: 20, fontWeight: '900', color: '#111' },

  // 프로필 카드
  profileCard:        { alignItems: 'center', paddingVertical: 24, gap: 8 },
  userName:           { fontSize: 20, fontWeight: '900', color: '#111' },
  userLevel:          { fontSize: 14, color: '#999', fontWeight: '600' },

  // 스탯
  statsGrid:          { flexDirection: 'row', gap: 12,
                        paddingHorizontal: 20, marginBottom: 8 },
  statCard:           { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 16,
                        borderWidth: 1, borderColor: '#e0e0e0',
                        alignItems: 'center', padding: 16, gap: 4 },
  statEmoji:          { fontSize: 24 },
  statNum:            { fontSize: 24, fontWeight: '900', color: '#111' },
  statLabel:          { fontSize: 11, color: '#999', fontWeight: '600' },

  // 섹션
  section:            { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 12 },
  sectionTitle:       { fontSize: 16, fontWeight: '900', color: '#111' },
  sectionSub:         { fontSize: 12, color: '#999', fontWeight: '600' },

  // 레벨
  levelCard:          { backgroundColor: '#f9f9f9', borderRadius: 16,
                        borderWidth: 1, borderColor: '#e0e0e0', padding: 16, gap: 10 },
  levelRow:           { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel:         { fontSize: 13, color: '#999' },
  levelXP:            { fontSize: 13, fontWeight: '700', color: '#111' },
  progressBar:        { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill:       { height: '100%', backgroundColor: '#111', borderRadius: 4 },
  levelNext:          { fontSize: 12, color: '#999', textAlign: 'center' },

  // 캘린더
  calendarCard:       { backgroundColor: '#f9f9f9', borderRadius: 16,
                        borderWidth: 1, borderColor: '#e0e0e0',
                        flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  dayWrap:            { alignItems: 'center', gap: 6 },
  dayLabel:           { fontSize: 11, color: '#999', fontWeight: '600' },
  dayCircle:          { width: 32, height: 32, borderRadius: 16,
                        backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  dayCircleDone:      { backgroundColor: '#111' },
  dayCircleToday:     { borderWidth: 2, borderColor: '#111', backgroundColor: '#333' },
  dayText:            { fontSize: 14, color: '#999' },
  dayTextDone:        { color: '#fff', fontWeight: '700' },

  // 배지
  badgeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard:          { width: '47%', backgroundColor: '#f9f9f9',
                        borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0',
                        padding: 16, alignItems: 'center', gap: 4, position: 'relative' },
  badgeCardLocked:    { opacity: 0.5 },
  badgeEmoji:         { fontSize: 32 },
  badgeLocked:        { opacity: 0.3 },
  badgeTitle:         { fontSize: 13, fontWeight: '700', color: '#111' },
  badgeTextLocked:    { color: '#999' },
  badgeDesc:          { fontSize: 11, color: '#999', textAlign: 'center' },
  earnedBadge:        { position: 'absolute', top: 8, right: 8,
                        backgroundColor: '#111', borderRadius: 8,
                        paddingHorizontal: 6, paddingVertical: 2 },
  earnedText:         { fontSize: 10, color: '#fff', fontWeight: '700' },

  // 설정
  settingCard:        { backgroundColor: '#f9f9f9', borderRadius: 16,
                        borderWidth: 1, borderColor: '#e0e0e0', padding: 4 },
  settingRow:         { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel:       { fontSize: 14, color: '#111', fontWeight: '600' },
  settingValue:       { fontSize: 14, color: '#999' },
  divider:            { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 },
  langBtns:           { flexDirection: 'row', gap: 6 },
  langBtn:            { paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 20, backgroundColor: '#f0f0f0',
                        borderWidth: 1, borderColor: '#e0e0e0' },
  langBtnActive:      { backgroundColor: '#111', borderColor: '#111' },
  langBtnText:        { fontSize: 12, color: '#999', fontWeight: '600' },
  langBtnTextActive:  { fontSize: 12, color: '#fff', fontWeight: '600' },
});