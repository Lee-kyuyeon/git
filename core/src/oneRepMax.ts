/** Epley 공식: w × (1 + r/30). 1회는 그대로 반환 */
export function epley(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Brzycki 공식: w × 36 / (37 − r). 반복 수가 적을 때 더 보수적 */
export function brzycki(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps >= 37) return epley(weightKg, reps);
  return (weightKg * 36) / (37 - reps);
}

/**
 * 두 공식의 평균으로 추정합니다. 12회를 넘는 세트는 오차가 커서 신뢰도를 낮춥니다.
 */
export function estimate1RM(weightKg: number, reps: number): { value: number; confidence: 'high' | 'medium' | 'low' } {
  const value = (epley(weightKg, reps) + brzycki(weightKg, reps)) / 2;
  const confidence = reps <= 6 ? 'high' : reps <= 12 ? 'medium' : 'low';
  return { value: round(value, 1), confidence };
}

/** 목표 반복 수를 수행할 수 있는 무게 (Epley 역산) */
export function weightForReps(oneRmKg: number, reps: number): number {
  if (reps <= 1) return oneRmKg;
  return oneRmKg / (1 + reps / 30);
}

export function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * 세트 목록에서 가장 높은 추정 1RM. 1RM 공식은 약 10회 이하에서 더 정확하므로
 * 성장 그래프와 정체기 판정에는 10회 이하 세트만 씁니다. 해당 세트가 없으면 undefined.
 */
export function bestE1RM(sets: Array<{ weightKg: number; reps: number; isWarmup?: boolean }>, maxReps = 10): number | undefined {
  const values = sets
    .filter((s) => !s.isWarmup && s.reps > 0 && s.reps <= maxReps)
    .map((s) => estimate1RM(s.weightKg, s.reps).value);
  return values.length ? Math.max(...values) : undefined;
}
