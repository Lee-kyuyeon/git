import { ALL_EQUIPMENT } from '@core';
import type { Equipment, Experience, Goal, Joint, LengthBias, Muscle, WorkActivity } from '@core';

export const MUSCLE_KO: Record<Muscle, string> = {
  chest: '가슴', lats: '광배', upperBack: '등 위쪽', traps: '승모',
  frontDelts: '어깨 앞', sideDelts: '어깨 옆', rearDelts: '어깨 뒤',
  biceps: '이두', triceps: '삼두', forearms: '전완',
  quads: '허벅지 앞', hamstrings: '햄스트링', glutes: '둔근', adductors: '내전근', calves: '종아리', core: '코어',
};

export const GOAL_KO: Record<Goal, { label: string; desc: string; emoji: string }> = {
  hypertrophy: { label: '근육 키우기', desc: '근비대 중심, 중간 무게 6~15회', emoji: '💪' },
  strength: { label: '힘 세지기', desc: '무거운 무게 3~6회 중심', emoji: '🏋️' },
  fatLoss: { label: '체지방 줄이기', desc: '근육은 지키며 많이 움직이기', emoji: '🔥' },
  health: { label: '건강 유지', desc: '부담 없이 꾸준히', emoji: '🌿' },
};

export const EXPERIENCE_KO: Record<Experience, { label: string; desc: string }> = {
  beginner: { label: '처음이에요', desc: '1년 미만' },
  intermediate: { label: '좀 해봤어요', desc: '1~3년' },
  advanced: { label: '오래 했어요', desc: '3년 이상' },
};

export const EQUIPMENT_INFO: Record<Exclude<Equipment, 'bodyweight'>, { name: string; desc: string }> = {
  barbell: { name: '바벨', desc: '긴 봉 + 원판' },
  squatRack: { name: '스쿼트 랙', desc: '파워랙·벤치프레스 거치대' },
  dumbbell: { name: '덤벨', desc: '아령' },
  kettlebell: { name: '케틀벨', desc: '손잡이 달린 쇳덩이' },
  bench: { name: '벤치', desc: '평평하거나 각도 조절' },
  pullupBar: { name: '철봉', desc: '턱걸이 바' },
  dipStation: { name: '딥스대', desc: '평행봉' },
  band: { name: '밴드', desc: '고무 저항밴드' },
  cable: { name: '케이블 머신', desc: '높이 조절 도르래' },
  latPulldown: { name: '랫 풀다운', desc: '앉아서 위에서 당기기' },
  legPress: { name: '레그 프레스', desc: '앉아서 발판 밀기' },
  hackSquat: { name: '핵 스쿼트', desc: '등 대고 서서 앉기' },
  legExtension: { name: '레그 익스텐션', desc: '앉아서 다리 펴기' },
  legCurl: { name: '레그 컬', desc: '앉거나 엎드려 다리 굽히기' },
  hipMachine: { name: '힙 어덕션·어브덕션', desc: '다리 모으기·벌리기' },
  calfMachine: { name: '카프 레이즈 머신', desc: '종아리 머신' },
  chestPressMachine: { name: '체스트 프레스', desc: '앉아서 앞으로 밀기' },
  shoulderPressMachine: { name: '숄더 프레스 머신', desc: '앉아서 위로 밀기' },
  pecDeck: { name: '펙덱', desc: '가슴·어깨 뒤 플라이' },
  rowMachine: { name: '로우 머신', desc: '가슴 대고 당기기' },
};

export const EQUIPMENT_KO = Object.fromEntries(Object.entries(EQUIPMENT_INFO).map(([k, v]) => [k, v.name])) as
  Record<Exclude<Equipment, 'bodyweight'>, string>;

export const EQUIPMENT_GROUPS: Array<{ name: string; items: Array<Exclude<Equipment, 'bodyweight'>> }> = [
  { name: '프리웨이트', items: ['barbell', 'squatRack', 'dumbbell', 'kettlebell', 'bench'] },
  { name: '맨몸·소도구', items: ['pullupBar', 'dipStation', 'band'] },
  { name: '케이블', items: ['cable', 'latPulldown'] },
  { name: '하체 머신', items: ['legPress', 'hackSquat', 'legExtension', 'legCurl', 'hipMachine', 'calfMachine'] },
  { name: '상체 머신', items: ['chestPressMachine', 'shoulderPressMachine', 'pecDeck', 'rowMachine'] },
];

export const JOINT_KO: Record<Joint, string> = {
  shoulder: '어깨', lowerBack: '허리', knee: '무릎', wrist: '손목', elbow: '팔꿈치', hip: '고관절', neck: '목',
};

export const WORK_KO: Record<WorkActivity, { label: string; desc: string }> = {
  sedentary: { label: '주로 앉아서', desc: '사무직, 학생' },
  standing: { label: '주로 서서', desc: '매장, 서비스직' },
  manual: { label: '몸을 많이 써요', desc: '현장, 물류, 육체노동' },
};

export const LENGTH_KO: Record<LengthBias, string> = {
  lengthened: '늘어난 위치 자극', mid: '중간 범위', shortened: '수축 위치 자극',
};

export const RPE_OPTIONS = [
  { rpe: 7, label: '쉬움', hint: '3회 이상 더 가능' },
  { rpe: 8, label: '적당', hint: '2회 더 가능' },
  { rpe: 9, label: '힘듦', hint: '1회 더 가능' },
  { rpe: 10, label: '실패', hint: '더는 불가' },
] as const;

export const GYM_PRESET: Equipment[] = [...ALL_EQUIPMENT];
/** 아파트·호텔·회사 헬스장처럼 작은 곳 */
export const SMALL_GYM_PRESET: Equipment[] = ['dumbbell', 'bench', 'cable', 'latPulldown', 'pullupBar', 'legPress'];
export const HOME_PRESET: Equipment[] = ['dumbbell', 'band'];

export const PRESETS: Array<{ id: string; emoji: string; name: string; equipment: Equipment[] }> = [
  { id: 'gym', emoji: '🏢', name: '헬스장', equipment: GYM_PRESET },
  { id: 'small', emoji: '🏨', name: '작은 헬스장', equipment: SMALL_GYM_PRESET },
  { id: 'home', emoji: '🏠', name: '집', equipment: HOME_PRESET },
  { id: 'none', emoji: '🤸', name: '맨몸만', equipment: [] },
];
