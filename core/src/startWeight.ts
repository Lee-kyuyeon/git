import type { Equipment, Exercise, PlannedExercise, Profile } from './types.ts';
import { incrementFor, roundToPlate } from './progression.ts';

/*
 * 첫 기록이 없을 때의 추천 시작 무게.
 * 기준값은 "운동 경력 1년 미만 남성이 약 10회를 여유 있게(RPE 7) 할 수 있는 무게 / 체중" 비율입니다.
 * 일반적인 초보자 근력 기준을 보수적으로 잡은 출발점일 뿐이며, 첫 세션의 체감 난이도로 바로 보정됩니다.
 * 성별은 루틴 설계에는 쓰지 않지만, 절대 근력(특히 상체)은 평균적으로 차이가 커서 시작 무게에만 반영합니다.
 */

/** 덤벨·케틀벨 종목은 한 손(한 개) 무게 */
const RATIO: Record<string, number> = {
  // 가슴
  bb_bench_press: 0.5, incline_bb_press: 0.42, close_grip_bench: 0.42, db_bench_press: 0.16, incline_db_press: 0.14,
  machine_chest_press: 0.45, cable_fly: 0.08, db_fly: 0.07, pec_deck: 0.3, low_cable_fly: 0.07,
  // 등
  lat_pulldown: 0.5, close_grip_pulldown: 0.5, single_arm_pulldown: 0.22, straight_arm_pulldown: 0.2, db_pullover: 0.15,
  bb_row: 0.45, db_row: 0.18, db_bent_row: 0.14, chest_supported_row: 0.14, seated_cable_row: 0.45, single_arm_cable_row: 0.2,
  t_bar_row: 0.35, machine_high_row: 0.45, deadlift: 0.75, rdl: 0.55, db_rdl: 0.2, back_extension: 0,
  // 승모
  db_shrug: 0.22, bb_shrug: 0.6, farmer_carry: 0.25,
  // 어깨
  ohp: 0.3, db_shoulder_press: 0.11, machine_shoulder_press: 0.3, arnold_press: 0.1,
  db_lateral_raise: 0.05, cable_lateral_raise: 0.04, front_raise: 0.06, rear_delt_fly: 0.05, reverse_pec_deck: 0.2,
  face_pull: 0.2, cable_rear_delt_fly: 0.04, upright_row: 0.3,
  // 팔
  db_curl: 0.08, incline_db_curl: 0.06, hammer_curl: 0.09, cable_curl: 0.18, bb_curl: 0.25, preacher_curl: 0.2,
  concentration_curl: 0.08, rope_hammer_curl: 0.18, reverse_curl: 0.18,
  triceps_pushdown: 0.25, rope_pushdown: 0.2, overhead_cable_ext: 0.18, db_overhead_ext: 0.13, skull_crusher: 0.2, db_kickback: 0.05,
  // 하체
  bb_squat: 0.65, front_squat: 0.5, goblet_squat: 0.2, leg_press: 1.1, hack_squat: 0.6, db_split_squat: 0.1, db_lunge: 0.1,
  reverse_lunge: 0.1, step_up: 0.1, leg_extension: 0.4, seated_leg_curl: 0.35, leg_curl: 0.3, hip_thrust: 0.6,
  hip_adduction: 0.45, hip_abduction: 0.45, cable_kickback: 0.06, cable_pull_through: 0.3, cable_adduction: 0.06,
  seated_calf_raise: 0.4, machine_calf_raise: 0.8, db_calf_raise: 0.15, kb_swing: 0.2, sumo_deadlift: 0.75, bb_good_morning: 0.3,
  // 코어·전완
  cable_crunch: 0.35, pallof_press: 0.1, wood_chop: 0.12, wrist_curl: 0.06, reverse_wrist_curl: 0.04, ab_rollout: 0,
};

const FREE_BODY: Equipment[] = ['bodyweight', 'band', 'pullupBar', 'dipStation', 'bench'];

/** 맨몸·밴드로만 하는 종목 (무게 입력이 필요 없음) */
export function isBodyweightExercise(ex: Exercise): boolean {
  return ex.equipment.every((q) => FREE_BODY.includes(q)) || RATIO[ex.id] === 0;
}

/** 덤벨 하나(케틀벨 하나)를 양손으로 드는 종목 */
const SINGLE_WEIGHT = new Set(['db_pullover', 'db_overhead_ext', 'goblet_squat', 'kb_swing']);

/** 덤벨·케틀벨을 양손에 하나씩 드는 종목: 기록하는 무게가 한 손(한 개) 기준 */
export function isPerHand(ex: Exercise): boolean {
  return (ex.equipment.includes('dumbbell') || ex.equipment.includes('kettlebell')) && !SINGLE_WEIGHT.has(ex.id);
}

/** 무게 칸 제목: 맨몸 / 한 손 / 덤벨 1개 / kg */
export function weightUnitLabel(ex: Exercise): string {
  if (isBodyweightExercise(ex)) return '추가 kg';
  if (SINGLE_WEIGHT.has(ex.id)) return ex.equipment.includes('kettlebell') ? 'kg (1개)' : 'kg (덤벨 1개)';
  return isPerHand(ex) ? 'kg (한 손)' : 'kg';
}

const LOWER = new Set(['quads', 'hamstrings', 'glutes', 'adductors', 'calves']);

export function defaultBodyWeight(profile: Pick<Profile, 'sex'>): number {
  return profile.sex === 'female' ? 57 : profile.sex === 'male' ? 72 : 65;
}

export interface StartSuggestion {
  weightKg: number;
  /** 화면 표시용 설명 */
  note: string;
}

/**
 * 추천 시작 무게. 비율표에 없는 종목은 기구·종목 유형별 기본값을 씁니다.
 * 목표 반복 수가 10회와 다르면 Epley 비율로 보정하고, 원판·덤벨 단위로 반올림합니다.
 */
export function suggestStartWeight(ex: Exercise, plan: Pick<PlannedExercise, 'repMin' | 'repMax'>, profile: Profile): StartSuggestion {
  if (isBodyweightExercise(ex)) return { weightKg: 0, note: '맨몸으로 하는 운동이에요. 목표 횟수를 채우기 쉬우면 천천히 하거나 무게를 들어도 돼요' };
  const base = RATIO[ex.id] ?? fallbackRatio(ex);
  const bw = profile.bodyWeightKg ?? defaultBodyWeight(profile);
  const exp = profile.experience === 'advanced' ? 1.7 : profile.experience === 'intermediate' ? 1.35 : 1;
  const lower = ex.primary.some((m) => LOWER.has(m));
  const sex = profile.sex === 'female' ? (lower ? 0.75 : 0.6) : profile.sex === 'male' ? 1 : (lower ? 0.88 : 0.8);
  const reps = Math.round((plan.repMin + plan.repMax) / 2);
  const repAdj = (1 + 10 / 30) / (1 + reps / 30);
  const step = incrementFor(ex);
  const raw = bw * base * exp * sex * repAdj;
  // 바벨은 빈 봉(20kg)보다 가벼울 수 없음
  const min = ex.equipment.includes('barbell') ? 20 : step;
  const weightKg = Math.max(min, roundToPlate(raw, step));
  const unit = isPerHand(ex) ? ' (한 손)' : SINGLE_WEIGHT.has(ex.id) ? ' (1개를 양손으로)' : '';
  return { weightKg, note: `추천 시작 무게 ${weightKg}kg${unit}. 마지막 2회가 힘들 정도가 맞아요. 너무 쉽거나 무거우면 바로 바꾸세요` };
}

function fallbackRatio(ex: Exercise): number {
  const c = ex.mechanic === 'compound';
  if (ex.equipment.includes('barbell')) return c ? 0.4 : 0.2;
  if (ex.equipment.includes('dumbbell') || ex.equipment.includes('kettlebell')) return c ? 0.12 : 0.06;
  if (ex.equipment.includes('cable') || ex.equipment.includes('latPulldown')) return c ? 0.35 : 0.12;
  return c ? 0.45 : 0.3; // 머신
}
