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
 * - 계획한 세트를 모두 하고, 모두 repMax에 도달하고, 평균 RPE ≤ 8.5이면 → 증량, 목표 반복은 repMin으로 리셋
 * - repMax에 도달했지만 힘들었으면(RPE > 8.5) → 같은 무게로 한 번 더
 * - repMin 미달: 직전 세션도 같은 무게 이상에서 미달이었으면 → 10% 디로드, 처음이면 → 같은 무게 유지
 *   (실패 자체는 디로드 사유가 아님. 근비대는 실패에 가까울수록 오히려 유리: Robinson 외 2024)
 * - 그 외 → 같은 무게로 반복 +1
 *
 * RPE 자가 보고는 실제보다 약 1회 여유를 적게 말하는 경향이 있어(Halperin 외), 증량 기준은 8.5로 둡니다.
 */
export function recommendNext(
  ex: Exercise, plan: PlannedExercise, lastSets: SetLog[], previousSessionSets: SetLog[] = [],
): Recommendation {
  const work = workSets(lastSets);
  const step = incrementFor(ex);

  if (work.length === 0) {
    return { weightKg: 0, targetReps: plan.repMin, action: 'coldStart', reason: '이전 기록이 없습니다' };
  }

  const { weight, minReps, avgRpe } = summarize(work);

  if (minReps < plan.repMin) {
    const prev = workSets(previousSessionSets);
    const prevMissed = prev.length > 0 && summarize(prev).weight >= weight && summarize(prev).minReps < plan.repMin;
    if (prevMissed) {
      return { weightKg: roundToPlate(weight * 0.9, step), targetReps: plan.repMin, action: 'deload', reason: '2회 연속 목표 반복 미달이라 10% 낮춥니다' };
    }
    return { weightKg: weight, targetReps: plan.repMin, action: 'repeat', reason: '한 번 미달은 컨디션 영향일 수 있어 같은 무게로 다시' };
  }
  if (minReps >= plan.repMax && avgRpe <= 8.5 && work.length < plan.sets) {
    return { weightKg: weight, targetReps: plan.repMax, action: 'repeat', reason: `지난번 ${work.length}/${plan.sets}세트만 해서 같은 무게로 다 채워 봐요` };
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

function workSets(sets: SetLog[]): SetLog[] {
  return sets.filter((s) => !s.isWarmup && s.reps > 0);
}

function summarize(work: SetLog[]): { weight: number; minReps: number; avgRpe: number } {
  // 가장 많이 사용한 무게를 기준 무게로 사용
  const weight = mode(work.map((s) => s.weightKg));
  const atWeight = work.filter((s) => s.weightKg === weight);
  const minReps = Math.min(...atWeight.map((s) => s.reps));
  const rpes = atWeight.map((s) => s.rpe).filter((r): r is number => r !== undefined);
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 8;
  return { weight, minReps, avgRpe };
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
