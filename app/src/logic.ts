import {
  ALL_MUSCLES, EXERCISE_BY_ID, bestE1RM, coldStartWeight, incrementFor, recommendNext,
  recoveryByMuscle, startOfWeek, warmupSets, weeklyStreak, weeklyVolume,
  type Muscle, type PerformedSet, type PlannedExercise, type Profile, type Program,
} from '@core';
import type { AppData, LoggedSet, Session, SessionExercise } from './store.tsx';
import { uid } from './store.tsx';

export const completedSessions = (d: AppData) => d.sessions.filter((s) => s.endedAt);

/** 해당 종목의 최근 두 세션 본세트 (최신이 먼저) */
export function lastTwo(sessions: Session[], exerciseId: string): [LoggedSet[], LoggedSet[]] {
  const found: LoggedSet[][] = [];
  // 기구 종목에서 무게 0으로 체크한 세트는 입력 실수로 보고 추천에서 제외
  const bodyweightOnly = EXERCISE_BY_ID.get(exerciseId)?.equipment.every((q) => q === 'bodyweight' || q === 'band' || q === 'pullupBar' || q === 'bench') ?? false;
  for (let i = sessions.length - 1; i >= 0 && found.length < 2; i--) {
    const ex = sessions[i]!.exercises.find((e) => e.exerciseId === exerciseId);
    const done = ex?.sets.filter((s) => s.done && !s.isWarmup && s.reps > 0 && (bodyweightOnly || s.weightKg > 0));
    if (done && done.length) found.push(done);
  }
  return [found[0] ?? [], found[1] ?? []];
}

export function buildExercise(plan: PlannedExercise, sessions: Session[]): SessionExercise {
  const ex = EXERCISE_BY_ID.get(plan.exerciseId)!;
  const [last, prev] = lastTwo(sessions, plan.exerciseId);
  const rec = recommendNext(ex, plan, last, prev);
  const weight = rec.action === 'coldStart' ? coldStartWeight(ex, plan) : rec.weightKg;
  const work: LoggedSet[] = Array.from({ length: plan.sets }, () => ({ weightKg: weight, reps: rec.targetReps, done: false }));
  const warm = ex.mechanic === 'compound' && weight >= 40
    ? warmupSets(weight, incrementFor(ex)).map((w) => ({ ...w, done: false }))
    : [];
  return { exerciseId: plan.exerciseId, plan, sets: [...warm, ...work], reason: rec.action === 'coldStart' ? '첫 기록이에요. 가볍게 시작해 보세요' : rec.reason };
}

export function freePlan(exerciseId: string, profile?: Profile): PlannedExercise {
  const ex = EXERCISE_BY_ID.get(exerciseId)!;
  const compound = ex.mechanic === 'compound';
  return {
    exerciseId, sets: 3, repMin: compound ? 6 : 10, repMax: compound ? 10 : 15, restSec: compound ? 120 : 75,
    targetRpe: 8, ...(profile && ex.stressedJoints.some((j) => profile.injuries.includes(j))
      ? { caution: ex.stressedJoints.filter((j) => profile.injuries.includes(j)), targetRpe: 7 } : {}),
  };
}

export function nextDayIndex(d: AppData): number {
  if (!d.program) return 0;
  const last = [...completedSessions(d)].reverse().find((s) => s.dayIndex !== null);
  return last ? ((last.dayIndex ?? -1) + 1) % d.program.days.length : 0;
}

export function startSession(d: AppData, dayIndex: number | null): Session {
  const done = completedSessions(d);
  if (dayIndex === null || !d.program) {
    return { id: uid(), startedAt: Date.now(), dayIndex: null, dayName: '자유 운동', exercises: [] };
  }
  const day = d.program.days[dayIndex]!;
  return {
    id: uid(), startedAt: Date.now(), dayIndex, dayName: day.name,
    exercises: day.exercises.map((p) => buildExercise(p, done)),
  };
}

export function sessionStats(s: Session) {
  let volume = 0;
  let sets = 0;
  for (const e of s.exercises) for (const x of e.sets) if (x.done && !x.isWarmup) { volume += x.weightKg * x.reps; sets++; }
  const minutes = Math.max(1, Math.round(((s.endedAt ?? Date.now()) - s.startedAt) / 60000));
  return { volume: Math.round(volume), sets, minutes };
}

/** 이번 세션에서 추정 1RM 개인 최고 기록을 깬 종목 */
export function personalRecords(s: Session, before: Session[]): Array<{ exerciseId: string; e1rm: number }> {
  const out: Array<{ exerciseId: string; e1rm: number }> = [];
  for (const e of s.exercises) {
    const now = bestE1RM(e.sets.filter((x) => x.done));
    if (!now) continue;
    const prev = before.flatMap((b) => b.exercises.filter((x) => x.exerciseId === e.exerciseId).flatMap((x) => x.sets.filter((y) => y.done)));
    const best = bestE1RM(prev);
    if (best !== undefined && now > best) out.push({ exerciseId: e.exerciseId, e1rm: now });
  }
  return out;
}

export function performedSets(sessions: Session[], sinceMs: number): PerformedSet[] {
  const out: PerformedSet[] = [];
  for (const s of sessions) {
    if ((s.endedAt ?? s.startedAt) < sinceMs) continue;
    for (const e of s.exercises) {
      const ex = EXERCISE_BY_ID.get(e.exerciseId);
      if (!ex) continue;
      for (const x of e.sets) if (x.done && !x.isWarmup) out.push({ exercise: ex, completedAt: new Date(s.endedAt ?? s.startedAt), rpe: x.rpe });
    }
  }
  return out;
}

export function recovery(d: AppData): Record<Muscle, number> {
  const now = Date.now();
  return recoveryByMuscle(performedSets(completedSessions(d), now - 7 * 864e5), new Date(now), d.profile ?? {});
}

/** 이번 주(월요일부터) 실제 수행한 부위별 fractional 세트 */
export function thisWeekVolume(d: AppData): Record<Muscle, number> {
  const since = startOfWeek(new Date()).getTime();
  const out = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const p of performedSets(completedSessions(d), since)) {
    for (const m of p.exercise.primary) out[m] += 1;
    for (const m of p.exercise.secondary) out[m] += 0.5;
  }
  return out;
}

export function streak(d: AppData): number {
  const dates = completedSessions(d).map((s) => new Date(s.startedAt));
  return weeklyStreak(dates, d.profile?.daysPerWeek ?? 3, new Date());
}

export function sessionsThisWeek(d: AppData): number {
  const since = startOfWeek(new Date()).getTime();
  return completedSessions(d).filter((s) => s.startedAt >= since).length;
}

/** 레벨: 누적 완료 세트 기준. 레벨 n에 필요한 누적 세트 = 25·n·(n−1)/2 */
export function level(d: AppData): { level: number; progress: number } {
  const total = completedSessions(d).reduce((a, s) => a + sessionStats(s).sets, 0);
  let lv = 1;
  while (25 * lv * (lv + 1) / 2 <= total) lv++;
  const lo = 25 * (lv - 1) * lv / 2;
  const hi = 25 * lv * (lv + 1) / 2;
  return { level: lv, progress: (total - lo) / (hi - lo) };
}

/** 프로그램이 목표 볼륨을 시간 부족으로 못 채우는 주요 부위 */
export function underCovered(program: Program): Muscle[] {
  const v = weeklyVolume(program);
  const major: Muscle[] = ['chest', 'lats', 'upperBack', 'quads', 'hamstrings', 'glutes'];
  return major.filter((m) => program.weeklyTargets[m] > 0 && v[m].sets < program.weeklyTargets[m] * 0.8);
}

/** 종목별 날짜순 추정 1RM 기록 (10회 이하 세트만) */
export function e1rmHistory(sessions: Session[], exerciseId: string): Array<{ t: number; v: number }> {
  const out: Array<{ t: number; v: number }> = [];
  for (const s of sessions) {
    const sets = s.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((x) => x.done));
    const v = bestE1RM(sets);
    if (v !== undefined) out.push({ t: s.startedAt, v });
  }
  return out;
}

export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function fmtKg(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
