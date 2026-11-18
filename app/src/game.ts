import {
  ACHIEVEMENTS, ALL_MUSCLES, EXERCISE_BY_ID, REGIONS, effortFactor, levelFromXp, muscleXp, startOfWeek,
  weekCleared, weeklyQuests, type Muscle, type Quest, type Region, type XpSet,
} from '@core';
import type { AppData, Session } from './store.tsx';
import { completedSessions, personalRecords } from './logic.ts';

export function sessionXpSets(s: Session): XpSet[] {
  const out: XpSet[] = [];
  for (const e of s.exercises) {
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex) continue;
    for (const x of e.sets) if (x.done && x.reps > 0) out.push({ exercise: ex, rpe: x.rpe, isWarmup: x.isWarmup });
  }
  return out;
}

export function sessionXp(s: Session): { byMuscle: Record<Muscle, number>; total: number } {
  const byMuscle = muscleXp(sessionXpSets(s));
  return { byMuscle, total: Object.values(byMuscle).reduce((a, b) => a + b, 0) };
}

export function muscleLevels(sessions: Session[]) {
  const xp = muscleXp(sessions.flatMap(sessionXpSets));
  return Object.fromEntries(ALL_MUSCLES.map((m) => [m, { xp: xp[m], ...levelFromXp(xp[m]) }])) as
    Record<Muscle, { xp: number; level: number; into: number; need: number }>;
}

/** 해당 주(weekStart부터 7일)의 퀘스트 통계 */
function weekStats(sessions: Session[], all: Session[], weekStart: number) {
  const end = weekStart + 7 * 864e5;
  const inWeek = sessions.filter((s) => s.startedAt >= weekStart && s.startedAt < end);
  const volume = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of inWeek) {
    for (const x of sessionXpSets(s)) {
      if (x.isWarmup) continue;
      const f = effortFactor(x.rpe);
      for (const m of x.exercise.primary) volume[m] += f;
      for (const m of x.exercise.secondary) volume[m] += 0.5 * f;
    }
  }
  let prs = 0;
  for (const s of inWeek) prs += personalRecords(s, all.filter((b) => b.startedAt < s.startedAt)).length;
  return { volume, sessions: inWeek.length, prs };
}

export function questsForWeek(d: AppData, weekStart = startOfWeek(new Date()).getTime()): Quest[] {
  if (!d.program || !d.profile) return [];
  const done = completedSessions(d);
  return weeklyQuests(d.program, d.profile.daysPerWeek, weekStats(done, done, weekStart));
}

/** 과거 모든 주의 클리어 여부 (오래된 순) */
export function weekHistory(d: AppData): Array<{ start: number; cleared: boolean; attended: boolean }> {
  const done = completedSessions(d);
  if (!done.length || !d.profile) return [];
  const first = startOfWeek(new Date(done[0]!.startedAt)).getTime();
  const now = startOfWeek(new Date()).getTime();
  const out = [];
  for (let w = first; w <= now; w += 7 * 864e5) {
    const q = questsForWeek(d, w);
    out.push({ start: w, cleared: weekCleared(q), attended: q.find((x) => x.kind === 'attendance')?.done ?? false });
  }
  return out;
}

export function playerProgress(d: AppData) {
  const done = completedSessions(d);
  const lv = muscleLevels(done);
  const muscleTotal = ALL_MUSCLES.reduce((a, m) => a + lv[m].xp, 0);
  const hist = weekHistory(d);
  const cleared = hist.filter((h) => h.cleared).length;
  let prs = 0;
  done.forEach((s, i) => { prs += personalRecords(s, done.slice(0, i)).length; });
  // 플레이어 XP = 부위 XP 합의 절반 + 주간 클리어 200 + PR 50
  const xp = Math.round(muscleTotal / 2) + cleared * 200 + prs * 50;
  let best = 0;
  let cur = 0;
  for (const h of hist) { cur = h.attended ? cur + 1 : 0; best = Math.max(best, cur); }
  return { xp, ...levelFromXp(xp), muscles: lv, clearedWeeks: cleared, prs, bestStreak: best };
}

export function achievements(d: AppData) {
  const done = completedSessions(d);
  const p = playerProgress(d);
  let totalSets = 0;
  let painFreeLight = 0;
  for (const s of done) for (const e of s.exercises) for (const x of e.sets) {
    if (!x.done || x.isWarmup) continue;
    totalSets++;
    if (e.plan.caution?.length) painFreeLight++;
  }
  const stats = {
    sessions: done.length, totalSets, prs: p.prs, bestStreak: p.bestStreak,
    maxMuscleLevel: Math.max(...ALL_MUSCLES.map((m) => p.muscles[m].level)), clearedWeeks: p.clearedWeeks, painFreeLight,
  };
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.test(stats) }));
}

/** 계획된 하루 운동이 각 부위 그룹 퀘스트에 더할 세트 수 */
export function dayRegionGain(exercises: Array<{ exerciseId: string; sets: number }>): Partial<Record<Region, number>> {
  const out: Partial<Record<Region, number>> = {};
  for (const pe of exercises) {
    const ex = EXERCISE_BY_ID.get(pe.exerciseId);
    if (!ex) continue;
    const add = (m: Muscle, w: number) => {
      const r = (Object.keys(REGIONS) as Region[]).find((k) => REGIONS[k].muscles.includes(m));
      if (r) out[r] = (out[r] ?? 0) + pe.sets * w * (r === 'legs' ? 0.7 : r === 'shoulders' ? 0.8 : 1);
    };
    ex.primary.forEach((m) => add(m, 1));
    ex.secondary.forEach((m) => add(m, 0.5));
  }
  return out;
}

export const CLASS_INFO = {
  hypertrophy: { name: '빌더', emoji: '🛡️', desc: '근육을 키우는 클래스' },
  strength: { name: '파워', emoji: '⚔️', desc: '더 무겁게 드는 클래스' },
  fatLoss: { name: '커터', emoji: '🔥', desc: '근육은 지키며 체지방을 태우는 클래스' },
  health: { name: '밸런서', emoji: '🌿', desc: '오래 건강하게 움직이는 클래스' },
} as const;
