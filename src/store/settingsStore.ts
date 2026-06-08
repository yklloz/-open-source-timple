import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  largeCaption: boolean;
  highContrast: boolean;
  autoSpeak: boolean;
  learningAlert: boolean;
  saveHistory: boolean;
  defaultTranslationMode: 'sign_to_text' | 'text_to_sign';
  dailyGoal: number;
  themeMode: 'light' | 'dark';
}

const SETTINGS_KEY = 'signbridge_settings_v1';
const CHAT_HISTORY_KEY = 'signbridge_chat_history_v1';

export const defaultSettings: AppSettings = {
  largeCaption: true,
  highContrast: false,
  autoSpeak: true,
  learningAlert: true,
  saveHistory: false,
  defaultTranslationMode: 'sign_to_text',
  dailyGoal: 90,
  themeMode: 'light',
};

let settingsState: AppSettings = defaultSettings;

export function getSettings() {
  return settingsState;
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) settingsState = { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    settingsState = defaultSettings;
  }
  return settingsState;
}

export async function saveSettings(next: Partial<AppSettings>) {
  settingsState = { ...settingsState, ...next };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState));
  return settingsState;
}

export async function clearChatHistory() {
  await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
}

export async function loadChatHistory<T>() {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export async function saveChatHistory<T>(messages: T) {
  await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}
