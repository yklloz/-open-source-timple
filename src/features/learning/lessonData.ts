export type LessonType = 'watch' | 'mimic' | 'quiz' | 'reverse_quiz';

export interface QuizItem {
  id: string;
  prompt: string;
  sign: string;
  meaning: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  sign: string;
  category: string;
  meaning: string;
  description: string;
  tip: string;
  options?: string[];
  answer?: string;
  quizItems?: QuizItem[];
  xpReward: number;
  difficulty: 1 | 2 | 3;
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
}

export const LESSONS: Record<string, Lesson> = {
  'l-1': {
    id: 'l-1',
    title: '기본 인사 배우기',
    type: 'watch',
    sign: '안녕하세요',
    category: '인사',
    meaning: '상대방을 처음 만났을 때 쓰는 기본 인사 표현',
    description: '손을 자연스럽게 펴고 이마 옆에서 바깥쪽으로 움직이는 느낌으로 표현합니다.',
    tip: '표정도 함께 부드럽게 지으면 더 자연스러운 수어가 됩니다.',
    xpReward: 10,
    difficulty: 1,
  },
  'l-2': {
    id: 'l-2',
    title: '감사합니다 따라하기',
    type: 'mimic',
    sign: '감사합니다',
    category: '인사',
    meaning: '고마움을 표현할 때 사용하는 수어',
    description: '화면의 가이드에 맞춰 손 위치와 움직임을 천천히 따라합니다.',
    tip: '손이 화면 중앙에 오도록 하고, 움직임은 너무 빠르지 않게 해보세요.',
    xpReward: 15,
    difficulty: 1,
  },
  'l-3': {
    id: 'l-3',
    title: '인사 표현 퀴즈',
    type: 'quiz',
    sign: '감사합니다',
    category: '퀴즈',
    meaning: '아래 수어 표현의 뜻을 고르세요.',
    description: '학습한 인사 표현을 보고 알맞은 뜻을 선택합니다.',
    tip: '단어만 외우기보다 상황을 같이 떠올리면 오래 기억됩니다.',
    options: ['안녕하세요', '감사합니다', '죄송합니다', '괜찮아요'],
    answer: '감사합니다',
    quizItems: [
      { id: 'q1', prompt: '아래 수어 표현의 뜻을 고르세요.', sign: '감사합니다', meaning: '고마움을 전하는 표현', options: ['안녕하세요', '감사합니다', '죄송합니다', '괜찮아요'], answer: '감사합니다' },
      { id: 'q2', prompt: '상황에 맞는 수어 표현을 고르세요.', sign: '처음 만난 사람에게 인사할 때', meaning: '기본 인사 상황', options: ['감사합니다', '도움이 필요해요', '안녕하세요', '진료 접수'], answer: '안녕하세요' },
      { id: 'q3', prompt: '다음 뜻과 연결되는 표현은 무엇인가요?', sign: '실수했거나 미안할 때 쓰는 표현', meaning: '사과 표현', options: ['괜찮아요', '죄송합니다', '감사합니다', '안녕하세요'], answer: '죄송합니다' },
    ],
    xpReward: 20,
    difficulty: 1,
  },
  'l-4': {
    id: 'l-4',
    title: '병원 표현 배우기',
    type: 'watch',
    sign: '진료 접수',
    category: '병원',
    meaning: '병원에서 접수 의사를 전달하는 표현',
    description: '병원 접수 상황에서 자주 쓰는 표현을 수어와 텍스트로 함께 익힙니다.',
    tip: '실제 대화에서는 “진료 접수하고 싶어요”처럼 문장으로 연결해 사용합니다.',
    xpReward: 10,
    difficulty: 2,
  },
  'l-5': {
    id: 'l-5',
    title: '도움 요청 따라하기',
    type: 'mimic',
    sign: '도움이 필요해요',
    category: '상황',
    meaning: '긴급하거나 도움이 필요할 때 쓰는 표현',
    description: '카메라 영역에 손과 상체가 들어오도록 맞춘 뒤 표현을 따라합니다.',
    tip: '급한 상황에서도 상대가 알아볼 수 있게 동작을 또렷하게 표현해보세요.',
    xpReward: 15,
    difficulty: 2,
  },
  'l-6': {
    id: 'l-6',
    title: '상황별 표현 퀴즈',
    type: 'quiz',
    sign: '도움이 필요해요',
    category: '퀴즈',
    meaning: '아래 표현이 필요한 상황을 고르세요.',
    description: '상황을 보고 적절한 수어 표현을 연결합니다.',
    tip: '응급·병원·관공서 표현은 자주 복습하는 것이 좋아요.',
    options: ['감사 인사', '도움 요청', '길 안내', '예약 확인'],
    answer: '도움 요청',
    quizItems: [
      { id: 'q1', prompt: '아래 표현이 필요한 상황을 고르세요.', sign: '도움이 필요해요', meaning: '긴급하거나 도움이 필요한 상황', options: ['감사 인사', '도움 요청', '길 안내', '예약 확인'], answer: '도움 요청' },
      { id: 'q2', prompt: '병원에서 접수를 원할 때 알맞은 표현은?', sign: '병원 접수 상황', meaning: '진료를 받기 전 접수하는 상황', options: ['진료 접수', '괜찮아요', '천천히 말해주세요', '화장실'], answer: '진료 접수' },
      { id: 'q3', prompt: '관공서에서 본인 확인에 필요한 것은?', sign: '본인 확인 상황', meaning: '서류 처리 전 확인하는 물건', options: ['처방전', '신분증', '예약 확인', '감사 인사'], answer: '신분증' },
    ],
    xpReward: 20,
    difficulty: 2,
  },
};

export const CURRICULUM: Unit[] = [
  {
    id: 'unit-1',
    title: '기본 인사',
    subtitle: '일상에서 가장 먼저 쓰는 표현',
    color: '#1E88F5',
    lessons: [LESSONS['l-1'], LESSONS['l-2'], LESSONS['l-3']],
  },
  {
    id: 'unit-2',
    title: '상황별 표현',
    subtitle: '병원과 도움 요청 상황',
    color: '#41C7D8',
    lessons: [LESSONS['l-4'], LESSONS['l-5'], LESSONS['l-6']],
  },
];

export function getLesson(id?: string) {
  if (!id) return undefined;
  return LESSONS[id];
}
