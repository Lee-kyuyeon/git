import type { Exercise, PlannedExercise, SetLog } from './types.ts';
import { weightForReps } from './oneRepMax.ts';

export interface Recommendation {
  weightKg: number;
  targetReps: number;
  action: 'increase' | 'repeat' | 'addReps' | 'deload' | 'coldStart';
  reason: string;
}

/** 증량 단위: 덤벨은 한 쪽 기준 2kg, 하체 컴파운드는 5kg, 나머지는 2.5kg */
export function incrementFor(ex: Exercise): number {
  if (ex.equipment.includes('dumbbell') || ex.equipment.includes('kettlebell')) return 2;
  if (ex.lowerBody && ex.mechanic === 'compound') return 5;
  return 2.5;
}

export function roundToPlate(weightKg: number, step: number): number {
  return Math.max(0, Math.round(weightKg / step) * step);
}

/**
 * 더블 프로그레션 + RPE 보정으로 다음 세션의 무게와 목표 반복 수를 추천합니다.
 *
 * - 모든 본세트가 repMax에 도달하고 평균 RPE ≤ 8.5이면 → 증량, 목표 반복은 repMin으로 리셋
 * - 한 세트라도 repMin에 못 미치거나 RPE 10(실패)이 2세트 이상이면 → 10% 디로드
 * - 모든 세트가 repMin 이상이면 → 같은 무게로 반복 +1
 * - 그 외 → 같은 무게, 같은 목표로 반복
 */
export function recommendNext(ex: Exercise, plan: PlannedExercise, lastSets: SetLog[]): Recommendation {
  const work = lastSets.filter((s) => !s.isWarmup && s.reps > 0);
  const step = incrementFor(ex);

  if (work.length === 0) {
    return { weightKg: 0, targetReps: plan.repMin, action: 'coldStart', reason: '이전 기록이 없습니다' };
  }

  // 가장 많이 사용한 무게를 기준 무게로 사용
  const weight = mode(work.map((s) => s.weightKg));
  const atWeight = work.filter((s) => s.weightKg === weight);
  const minReps = Math.min(...atWeight.map((s) => s.reps));
  const rpes = atWeight.map((s) => s.rpe).filter((r): r is number => r !== undefined);
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 8;
  const failures = rpes.filter((r) => r >= 10).length;

  if (minReps < plan.repMin || failures >= 2) {
    const w = roundToPlate(weight * 0.9, step);
    return { weightKg: w, targetReps: plan.repMin, action: 'deload', reason: '목표 반복 미달 또는 실패가 잦아 10% 낮춥니다' };
  }
  if (minReps >= plan.repMax && avgRpe <= 8.5) {
    return { weightKg: weight + step, targetReps: plan.repMin, action: 'increase', reason: `모든 세트 ${plan.repMax}회 달성, +${step}kg` };
  }
  if (minReps >= plan.repMax) {
    return { weightKg: weight, targetReps: plan.repMax, action: 'repeat', reason: '반복은 달성했지만 힘들었습니다. 같은 무게로 한 번 더' };
  }
  const target = Math.min(plan.repMax, minReps + 1);
  return { weightKg: weight, targetReps: target, action: 'addReps', reason: `같은 무게로 ${target}회를 목표로` };
}

/**
 * 기록이 없을 때 첫 추천 무게. 온보딩에서 입력한 추정 1RM이 있으면 RIR 2 정도로,
 * 없으면 0(사용자가 입력)을 반환합니다. 플랜핏 리뷰의 "첫 추천이 너무 낮다"는 문제를 피하기 위함입니다.
 */
export function coldStartWeight(ex: Exercise, plan: PlannedExercise, known1RM?: number): number {
  if (!known1RM) return 0;
  return roundToPlate(weightForReps(known1RM, plan.repMax + 2), incrementFor(ex));
}

function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = nums[0]!;
  let bestCount = 0;
  for (const [n, c] of counts) {
    if (c > bestCount || (c === bestCount && n > best)) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}
