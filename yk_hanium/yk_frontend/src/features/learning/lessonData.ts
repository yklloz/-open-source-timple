export type LessonType = 'watch' | 'mimic' | 'quiz' | 'reverse_quiz';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  sign: string;          // 수어 텍스트
  videoUrl?: string;     // 시연 영상
  options?: string[];    // 퀴즈 선택지
  isLocked: boolean;
  xpReward: number;
}

export interface Unit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
}

export const CURRICULUM: Unit[] = [
  {
    id: 'unit-1',
    title: '지문자',
    emoji: '🔤',
    color: '#3b82f6',
    lessons: [
      { id: 'l-1', title: 'ㄱ, ㄴ, ㄷ 배우기', type: 'watch',        sign: 'ㄱ', xpReward: 10, isLocked: false },
      { id: 'l-2', title: 'ㄱ 따라하기',        type: 'mimic',        sign: 'ㄱ', xpReward: 15, isLocked: true },
      { id: 'l-3', title: '지문자 퀴즈',        type: 'quiz',         sign: 'ㄴ', xpReward: 20, isLocked: true },
    ],
  },
  {
    id: 'unit-2',
    title: '기본 인사',
    emoji: '👋',
    color: '#10b981',
    lessons: [
      { id: 'l-4', title: '안녕하세요',   type: 'watch',        sign: '안녕하세요', xpReward: 10, isLocked: true },
      { id: 'l-5', title: '감사합니다',   type: 'mimic',        sign: '감사합니다', xpReward: 15, isLocked: true },
      { id: 'l-6', title: '인사 퀴즈',    type: 'reverse_quiz', sign: '죄송합니다', xpReward: 20, isLocked: true },
    ],
  },
];