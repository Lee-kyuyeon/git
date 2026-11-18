import type { Exercise, Muscle } from './types.ts';

/** 부위별 회복 시정수(시간). 큰 근육일수록 느리게 회복합니다. */
export const RECOVERY_TAU_H: Record<Muscle, number> = {
  chest: 30, back: 30, shoulders: 24, biceps: 20, triceps: 20,
  quads: 36, hamstrings: 36, glutes: 32, calves: 18, core: 16,
};

/** 한 세션에서 부위가 "완전히 피로"하다고 보는 유효 세트 수 */
const FULL_FATIGUE_SETS = 10;

export interface PerformedSet {
  exercise: Exercise;
  completedAt: Date;
}

/**
 * 부위별 회복도(0~100%)를 계산합니다.
 * 피로 = Σ 기여도 × exp(−경과시간 / τ). 주동근은 세트당 1, 보조근은 0.5로 셉니다.
 */
export function recoveryByMuscle(sets: PerformedSet[], now: Date): Record<Muscle, number> {
  const fatigue = Object.fromEntries(Object.keys(RECOVERY_TAU_H).map((m) => [m, 0])) as Record<Muscle, number>;

  for (const s of sets) {
    const hours = (now.getTime() - s.completedAt.getTime()) / 3_600_000;
    if (hours < 0) continue;
    for (const m of s.exercise.primary) fatigue[m] += Math.exp(-hours / RECOVERY_TAU_H[m]);
    for (const m of s.exercise.secondary) fatigue[m] += 0.5 * Math.exp(-hours / RECOVERY_TAU_H[m]);
  }

  const result = {} as Record<Muscle, number>;
  for (const m of Object.keys(fatigue) as Muscle[]) {
    const f = Math.min(1, fatigue[m] / FULL_FATIGUE_SETS);
    result[m] = Math.round((1 - f) * 100);
  }
  return result;
}
