import type { SetLog } from './types.ts';
import { roundToPlate } from './progression.ts';

/**
 * 작업 중량 기준 웜업 세트를 만듭니다. 빈 봉(20kg) 이하는 생략합니다.
 * 40% × 8, 60% × 5, 80% × 3
 */
export function warmupSets(workingWeightKg: number, step = 2.5, minWeightKg = 20): SetLog[] {
  const scheme: Array<[number, number]> = [[0.4, 8], [0.6, 5], [0.8, 3]];
  const sets: SetLog[] = [];
  for (const [pct, reps] of scheme) {
    const w = roundToPlate(workingWeightKg * pct, step);
    if (w < minWeightKg) continue;
    if (sets.length && sets[sets.length - 1]!.weightKg === w) continue;
    sets.push({ weightKg: w, reps, isWarmup: true });
  }
  return sets;
}
