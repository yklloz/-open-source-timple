export type ScenarioId = 'hospital' | 'cafe' | 'office' | 'transport' | 'emergency';

export interface ScenarioPhrase {
  id: string;
  text: string;
  gloss: string[];
  category: string;
  speaker: 'user' | 'staff';
  keypointLabel?: string;
  videoId?: string;
}

export interface ScenarioPack {
  id: ScenarioId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  status: 'ready' | 'planned';
  phrases: ScenarioPhrase[];
}

export const SCENARIO_PACKS: ScenarioPack[] = [
  {
    id: 'hospital',
    name: '병원',
    subtitle: '접수·진료·처방',
    description: '진료 접수, 증상 설명, 처방 안내처럼 병원에서 자주 쓰는 표현을 먼저 지원합니다.',
    color: '#1E88F5',
    status: 'ready',
    phrases: [
      { id: 'hospital_001', text: '진료 접수하고 싶어요.', gloss: ['진료', '접수', '원하다'], category: '접수', speaker: 'user', keypointLabel: 'hospital_register' },
      { id: 'hospital_002', text: '예약했어요.', gloss: ['예약', '하다'], category: '접수', speaker: 'user', keypointLabel: 'reserved' },
      { id: 'hospital_003', text: '어디가 불편하세요?', gloss: ['어디', '불편', '질문'], category: '진료', speaker: 'staff', videoId: 'where_uncomfortable' },
      { id: 'hospital_004', text: '배가 아파요.', gloss: ['배', '아프다'], category: '증상', speaker: 'user', keypointLabel: 'stomach_pain' },
      { id: 'hospital_005', text: '머리가 아파요.', gloss: ['머리', '아프다'], category: '증상', speaker: 'user', keypointLabel: 'headache' },
      { id: 'hospital_006', text: '처방전이 필요해요.', gloss: ['처방전', '필요'], category: '처방', speaker: 'user', keypointLabel: 'need_prescription' },
      { id: 'hospital_007', text: '약은 하루 세 번 드세요.', gloss: ['약', '하루', '세 번', '먹다'], category: '처방', speaker: 'staff', videoId: 'medicine_three_times' },
      { id: 'hospital_008', text: '잠시만 기다려주세요.', gloss: ['잠시', '기다리다'], category: '안내', speaker: 'staff', videoId: 'please_wait' },
      { id: 'hospital_009', text: '신분증을 보여주세요.', gloss: ['신분증', '보여주다'], category: '접수', speaker: 'staff', videoId: 'show_id' },
      { id: 'hospital_010', text: '도움이 필요해요.', gloss: ['도움', '필요'], category: '긴급', speaker: 'user', keypointLabel: 'need_help' },
    ],
  },
  {
    id: 'cafe',
    name: '카페',
    subtitle: '주문·결제·요청',
    description: '음료 주문, 포장, 옵션 요청 표현으로 확장할 예정입니다.',
    color: '#41C7D8',
    status: 'planned',
    phrases: [
      { id: 'cafe_001', text: '아이스 아메리카노 주세요.', gloss: ['아이스', '아메리카노', '주세요'], category: '주문', speaker: 'user' },
      { id: 'cafe_002', text: '포장해 주세요.', gloss: ['포장', '주세요'], category: '요청', speaker: 'user' },
      { id: 'cafe_003', text: '결제할게요.', gloss: ['결제', '하다'], category: '결제', speaker: 'user' },
    ],
  },
  {
    id: 'office',
    name: '관공서',
    subtitle: '민원·서류·신분 확인',
    description: '민원 신청과 서류 안내 표현으로 확장할 예정입니다.',
    color: '#7C8AA5',
    status: 'planned',
    phrases: [
      { id: 'office_001', text: '민원 신청하고 싶어요.', gloss: ['민원', '신청', '원하다'], category: '민원', speaker: 'user' },
      { id: 'office_002', text: '신분증이 필요합니다.', gloss: ['신분증', '필요'], category: '안내', speaker: 'staff' },
    ],
  },
  {
    id: 'transport',
    name: '교통',
    subtitle: '길 안내·승하차',
    description: '버스, 지하철, 택시 이용 표현으로 확장할 예정입니다.',
    color: '#26A69A',
    status: 'planned',
    phrases: [
      { id: 'transport_001', text: '이 버스는 어디로 가나요?', gloss: ['버스', '어디', '가다'], category: '길 안내', speaker: 'user' },
    ],
  },
  {
    id: 'emergency',
    name: '긴급상황',
    subtitle: '도움 요청·안전',
    description: '도움 요청과 안전 확인 표현으로 확장할 예정입니다.',
    color: '#F45D75',
    status: 'planned',
    phrases: [
      { id: 'emergency_001', text: '도와주세요.', gloss: ['도움', '요청'], category: '긴급', speaker: 'user' },
    ],
  },
];

export function getScenarioPack(id: ScenarioId) {
  return SCENARIO_PACKS.find(pack => pack.id === id) || SCENARIO_PACKS[0];
}
