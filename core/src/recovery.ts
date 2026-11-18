import type { Exercise, Muscle, Profile } from './types.ts';
import { ALL_MUSCLES } from './types.ts';

/**
 * 부위별 회복 시정수(시간). 큰 근육일수록 느리게 회복합니다.
 * 근거: 근단백 합성은 운동 후 ~24h 정점, ~36h 기준치 근처로 복귀(MacDougall 외 1995),
 * 근손상 증상은 24~48h 정점. 이 값은 측정값이 아니라 **추정 모델**입니다.
 */
export const RECOVERY_TAU_H: Record<Muscle, number> = {
  chest: 30, lats: 30, upperBack: 28, traps: 22,
  frontDelts: 24, sideDelts: 22, rearDelts: 22,
  biceps: 20, triceps: 20, forearms: 16,
  quads: 36, hamstrings: 36, glutes: 32, adductors: 30, calves: 18, core: 16,
};

/** 한 세션에서 부위가 "완전히 피로"하다고 보는 유효 세트 수 (세션당 볼륨 상한 ~10과 맞춤) */
const FULL_FATIGUE_SETS = 10;

export interface PerformedSet {
  exercise: Exercise;
  completedAt: Date;
  rpe?: number;
}

export type RecoveryContext = Pick<Profile, 'experience' | 'workActivity' | 'shiftWork'>;

/** 회복 속도 보정: 초보자, 육체노동, 교대근무는 느리게 (보수적 휴리스틱) */
export function tauFactor(ctx: Partial<RecoveryContext> = {}): number {
  let f = 1;
  if (ctx.experience === 'beginner') f *= 1.3;
  if (ctx.workActivity === 'manual') f *= 1.15;
  if (ctx.shiftWork) f *= 1.15;
  return f;
}

/**
 * 부위별 추정 회복도(0~100%)를 계산합니다.
 * 피로 = Σ 기여도 × exp(−경과시간 / τ). 주동근은 세트당 1, 보조근은 0.5.
 * 실패 세트(RPE 10)와 늘어난 위치 종목은 근손상이 커서 기여도를 1.2배로 봅니다.
 */
export function recoveryByMuscle(sets: PerformedSet[], now: Date, ctx: Partial<RecoveryContext> = {}): Record<Muscle, number> {
  const fatigue = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  const tf = tauFactor(ctx);

  for (const s of sets) {
    const hours = (now.getTime() - s.completedAt.getTime()) / 3_600_000;
    if (hours < 0) continue;
    let w = 1;
    if ((s.rpe ?? 0) >= 10) w *= 1.2;
    if (s.exercise.lengthBias === 'lengthened') w *= 1.2;
    for (const m of s.exercise.primary) fatigue[m] += w * Math.exp(-hours / (RECOVERY_TAU_H[m] * tf));
    for (const m of s.exercise.secondary) fatigue[m] += 0.5 * w * Math.exp(-hours / (RECOVERY_TAU_H[m] * tf));
  }

  const result = {} as Record<Muscle, number>;
  for (const m of ALL_MUSCLES) {
    const f = Math.min(1, fatigue[m] / FULL_FATIGUE_SETS);
    result[m] = Math.round((1 - f) * 100);
  }
  return result;
}
