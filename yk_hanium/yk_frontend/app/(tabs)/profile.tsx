import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Moa from '@/src/components/Moa';
import { clearToken, getMe, getMyProgress, UserResponse } from '@/src/api';

interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
}

const BADGES: Badge[] = [
  { id: 'b-1', icon: '첫', title: '첫걸음', desc: '첫 레슨을 완료했어요', earned: true },
  { id: 'b-2', icon: '3일', title: '3일 연속', desc: '3일 연속 학습했어요', earned: true },
  { id: 'b-3', icon: 'XP', title: '100 XP', desc: '누적 100 XP를 달성해요', earned: false },
  { id: 'b-4', icon: '가', title: '지문자 마스터', desc: '지문자 레슨을 완료해요', earned: false },
  { id: 'b-5', icon: '인', title: '인사 마스터', desc: '인사 표현을 모두 익혀요', earned: false },
  { id: 'b-6', icon: '만점', title: '집중왕', desc: '3개 레슨에서 100점을 받아요', earned: false },
];

const LEVEL_TITLES = ['입문자', '초급자', '중급자', '고급자', '마스터'];
const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ProfileScreen() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [completedLessons, setCompletedLessons] = useState(0);

  const xp = user?.xp ?? 0;
  const streak = user?.streak ?? 0;
  const maxXP = 100;
  const level = Math.min(Math.floor(xp / maxXP), LEVEL_TITLES.length - 1);
  const progress = (xp % maxXP) / maxXP;
  const userName = user?.name ?? '손이음 학습자';

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const [me, progressData] = await Promise.all([getMe(), getMyProgress()]);
          setUser(me);
          setCompletedLessons(progressData.completed.length);
        } catch {
          await clearToken();
          router.replace('/(auth)');
        }
      };

      loadProfile();
    }, [])
  );

  const handleLogout = async () => {
    await clearToken();
    router.replace('/(auth)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      <View style={styles.profileCard}>
        <Moa mood="proud" size={100} animate={true} message="오늘도 잘하고 있어요!" />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{user?.email ?? '로그인 정보를 불러오는 중이에요'}</Text>
        <Text style={styles.userLevel}>Lv.{level + 1} {LEVEL_TITLES[level]}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>연속</Text>
          <Text style={styles.statNum}>{streak}</Text>
          <Text style={styles.statLabel}>일 연속</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>XP</Text>
          <Text style={styles.statNum}>{xp}</Text>
          <Text style={styles.statLabel}>누적 XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>완료</Text>
          <Text style={styles.statNum}>{completedLessons}</Text>
          <Text style={styles.statLabel}>레슨</Text>
        </View>
      </View>

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
            다음 레벨까지 {maxXP - (xp % maxXP)} XP 남았어요
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>학습 연속 기록</Text>
          <Text style={styles.sectionSub}>{streak}일 연속</Text>
        </View>
        <View style={styles.calendarCard}>
          {WEEK_DAYS.map((day, index) => {
            const isDone = index < streak;
            const isToday = index === streak - 1;

            return (
              <View key={day} style={styles.dayWrap}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={[
                  styles.dayCircle,
                  isDone && styles.dayCircleDone,
                  isToday && styles.dayCircleToday,
                ]}>
                  <Text style={[styles.dayText, isDone && styles.dayTextDone]}>
                    {isDone ? '완료' : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>배지</Text>
          <Text style={styles.sectionSub}>
            {BADGES.filter((badge) => badge.earned).length}/{BADGES.length}개 획득
          </Text>
        </View>
        <View style={styles.badgeGrid}>
          {BADGES.map((badge) => (
            <View
              key={badge.id}
              style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}
            >
              <Text style={[styles.badgeIcon, !badge.earned && styles.badgeLocked]}>
                {badge.icon}
              </Text>
              <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTextLocked]}>
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
              {badge.earned && (
                <View style={styles.earnedBadge}>
                  <Text style={styles.earnedText}>획득</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>학습 언어</Text>
            <View style={styles.langBtns}>
              <TouchableOpacity style={[styles.langBtn, styles.langBtnActive]}>
                <Text style={styles.langBtnTextActive}>한국수어</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langBtn}>
                <Text style={styles.langBtnText}>미국수어</Text>
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
          <Text style={styles.settingLabel}>팀</Text>
            <Text style={styles.settingValue}>손이음</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  header: {
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerTitle: { color: '#111', fontSize: 20, fontWeight: '900' },
  profileCard: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  userName: { color: '#111', fontSize: 20, fontWeight: '900' },
  userEmail: { color: '#777', fontSize: 13, fontWeight: '500' },
  userLevel: { color: '#777', fontSize: 14, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statIcon: { color: '#111', fontSize: 16, fontWeight: '900' },
  statNum: { color: '#111', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#777', fontSize: 11, fontWeight: '600' },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: '#111', fontSize: 16, fontWeight: '900' },
  sectionSub: { color: '#777', fontSize: 12, fontWeight: '600' },
  levelCard: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel: { color: '#777', fontSize: 13 },
  levelXP: { color: '#111', fontSize: 13, fontWeight: '700' },
  progressBar: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#111', borderRadius: 4, height: '100%' },
  levelNext: { color: '#777', fontSize: 12, textAlign: 'center' },
  calendarCard: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  dayWrap: { alignItems: 'center', gap: 6 },
  dayLabel: { color: '#777', fontSize: 11, fontWeight: '600' },
  dayCircle: {
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dayCircleDone: { backgroundColor: '#111' },
  dayCircleToday: { backgroundColor: '#333', borderColor: '#111', borderWidth: 2 },
  dayText: { color: '#777', fontSize: 10 },
  dayTextDone: { color: '#fff', fontWeight: '700' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 16,
    position: 'relative',
    width: '47%',
  },
  badgeCardLocked: { opacity: 0.5 },
  badgeIcon: { color: '#111', fontSize: 24, fontWeight: '900' },
  badgeLocked: { opacity: 0.3 },
  badgeTitle: { color: '#111', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  badgeTextLocked: { color: '#777' },
  badgeDesc: { color: '#777', fontSize: 11, textAlign: 'center' },
  earnedBadge: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  earnedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  settingCard: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 4,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { color: '#111', fontSize: 14, fontWeight: '600' },
  settingValue: { color: '#777', fontSize: 14 },
  divider: { backgroundColor: '#e0e0e0', height: 1, marginHorizontal: 16 },
  langBtns: { flexDirection: 'row', gap: 6 },
  langBtn: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  langBtnText: { color: '#777', fontSize: 12, fontWeight: '600' },
  langBtnTextActive: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logoutBtn: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    marginTop: 14,
    padding: 16,
  },
  logoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
