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

export const EQUIPMENT_KO: Record<Exclude<Equipment, 'bodyweight'>, string> = {
  barbell: '바벨', dumbbell: '덤벨', machine: '머신', cable: '케이블',
  kettlebell: '케틀벨', band: '밴드', pullupBar: '철봉', bench: '벤치',
};

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

export const GYM_PRESET: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bench', 'pullupBar'];
export const HOME_PRESET: Equipment[] = ['dumbbell', 'band'];
