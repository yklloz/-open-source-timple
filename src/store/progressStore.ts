import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressState {
  xp: number;
  streak: number;
  completedLessons: string[];
  scores: Record<string, number>;
}

const KEY = 'signbridge_progress_v1';

const initialState: ProgressState = {
  xp: 90,
  streak: 3,
  completedLessons: [],
  scores: {},
};

let state: ProgressState = initialState;

export function getProgress() {
  return state;
}

export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) state = { ...initialState, ...JSON.parse(raw) };
  } catch {
    state = initialState;
  }
  return state;
}

export async function saveProgress(next: ProgressState) {
  state = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export async function completeLesson(lessonId: string, earnedXP: number, score: number) {
  const alreadyDone = state.completedLessons.includes(lessonId);
  const next: ProgressState = {
    ...state,
    xp: alreadyDone ? state.xp : state.xp + earnedXP,
    completedLessons: alreadyDone ? state.completedLessons : [...state.completedLessons, lessonId],
    scores: { ...state.scores, [lessonId]: Math.max(score, state.scores[lessonId] || 0) },
  };
  return saveProgress(next);
}

export async function resetProgress() {
  return saveProgress(initialState);
}
