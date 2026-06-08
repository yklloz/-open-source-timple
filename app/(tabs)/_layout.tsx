import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  primary: '#1E88F5',
  text: '#20242A',
  muted: '#A8B0BC',
  bg: '#FFFFFF',
};

function TabIcon({ label, mark, focused }: { label: string; mark: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
        <Text style={[styles.mark, focused && styles.markActive]}>{mark}</Text>
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="learn"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: '#EEF2F7',
          shadowColor: '#D6E5F8',
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -8 },
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen name="learn" options={{ tabBarIcon: ({ focused }) => <TabIcon mark="H" label="홈" focused={focused} /> }} />
      <Tabs.Screen name="communicate" options={{ tabBarIcon: ({ focused }) => <TabIcon mark="T" label="소통" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon mark="W" label="단어" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon mark="S" label="설정" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 64 },
  iconBox: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F5F9' },
  iconBoxActive: { backgroundColor: COLORS.primary },
  mark: { fontSize: 13, color: COLORS.muted, fontWeight: '900' },
  markActive: { color: '#FFFFFF' },
  tabLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '800' },
  tabLabelFocused: { color: COLORS.text },
});
