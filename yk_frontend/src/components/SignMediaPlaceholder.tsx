import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = {
  primary: '#1E88F5',
  cyan: '#41C7D8',
  text: '#20242A',
  sub: '#748092',
  line: '#E7EEF8',
  soft: '#F8FAFD',
};

type Variant = 'light' | 'dark';

export default function SignMediaPlaceholder({
  title = '수어 클립 준비 중',
  description = '실제 수어 영상 또는 이미지를 연결할 수 있는 영역입니다.',
  label = '수어 영상',
  variant = 'dark',
  height = 250,
  onPlay,
}: {
  title?: string;
  description?: string;
  label?: string;
  variant?: Variant;
  height?: number;
  onPlay?: () => void;
}) {
  const isDark = variant === 'dark';
  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { height }, isDark ? styles.frameDark : styles.frameLight]}>
        <View style={[styles.badge, isDark ? styles.badgeDark : styles.badgeLight]}>
          <Text style={[styles.badgeText, isDark ? styles.badgeTextDark : styles.badgeTextLight]}>{label}</Text>
        </View>

        <View style={styles.guideBox}>
          <View style={styles.headGuide} />
          <View style={styles.shoulderGuide} />
          <View style={styles.handLeft} />
          <View style={styles.handRight} />
          <View style={styles.centerLine} />
        </View>

        <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.84}>
          <Text style={styles.playIcon}>▶</Text>
        </TouchableOpacity>

        <View style={styles.guideCaption}>
          <Text style={[styles.guideCaptionText, isDark ? styles.guideCaptionDark : styles.guideCaptionLight]}>손과 상체를 화면 중앙에 맞춰주세요</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  frame: { width: '100%', borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
  frameDark: { backgroundColor: '#111827', borderColor: 'rgba(255,255,255,.08)' },
  frameLight: { backgroundColor: COLORS.soft, borderColor: COLORS.line },
  badge: { position: 'absolute', left: 14, top: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  badgeDark: { backgroundColor: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.22)' },
  badgeLight: { backgroundColor: '#E8F3FF', borderColor: '#D8E9FA' },
  badgeText: { fontSize: 12, fontWeight: '900' },
  badgeTextDark: { color: '#FFFFFF' },
  badgeTextLight: { color: COLORS.primary },
  guideBox: { width: 178, height: 178, alignItems: 'center', justifyContent: 'center' },
  headGuide: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: COLORS.cyan, backgroundColor: 'rgba(65,199,216,.14)', marginBottom: 8 },
  shoulderGuide: { width: 118, height: 64, borderTopLeftRadius: 60, borderTopRightRadius: 60, borderWidth: 2, borderColor: COLORS.cyan, borderBottomWidth: 0, backgroundColor: 'rgba(65,199,216,.10)' },
  handLeft: { position: 'absolute', left: 12, top: 92, width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'rgba(30,136,245,.12)' },
  handRight: { position: 'absolute', right: 12, top: 92, width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'rgba(30,136,245,.12)' },
  centerLine: { position: 'absolute', width: 1, height: 150, backgroundColor: 'rgba(65,199,216,.30)' },
  playButton: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  playIcon: { color: COLORS.primary, fontSize: 25, fontWeight: '900', marginLeft: 4 },
  guideCaption: { position: 'absolute', left: 18, right: 18, bottom: 16, alignItems: 'center' },
  guideCaptionText: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  guideCaptionDark: { color: 'rgba(255,255,255,.70)' },
  guideCaptionLight: { color: COLORS.sub },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  description: { color: COLORS.sub, fontSize: 13, fontWeight: '700', lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
