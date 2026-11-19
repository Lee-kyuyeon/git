import {
  ACHIEVEMENTS, ALL_MUSCLES, EXERCISE_BY_ID, REGION_WEIGHT, bestE1RM, levelFromXp, muscleVolume, muscleXp, regionOf,
  startOfWeek, weekCleared, weeklyQuests, type Muscle, type Quest, type Region, type XpSet,
} from '@core';
import type { AppData, Session } from './store.tsx';
import { completedSessions } from './logic.ts';

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

/** AppData가 같으면(업데이트마다 새 객체) 결과를 재사용 */
function memo<T>(fn: (d: AppData) => T): (d: AppData) => T {
  const c = new WeakMap<AppData, T>();
  return (d) => {
    if (c.has(d)) return c.get(d)!;
    const v = fn(d);
    c.set(d, v);
    return v;
  };
}

export function muscleLevels(sessions: Session[]) {
  const xp = muscleXp(sessions.flatMap(sessionXpSets));
  return Object.fromEntries(ALL_MUSCLES.map((m) => [m, { xp: xp[m], ...levelFromXp(xp[m]) }])) as
    Record<Muscle, { xp: number; level: number; into: number; need: number }>;
}

/** 로컬 달력 기준 다음 주 시작 (DST가 있어도 자정 유지) */
function nextWeek(t: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + 7);
  return d.getTime();
}

interface Derived {
  done: Session[];
  /** 세션 id → 그 세션에서 세운 개인 기록 수 (personalRecords와 같은 판정) */
  prs: Map<string, number>;
  /** 주 시작 시각 → 그 주에 시작한 세션 */
  byWeek: Map<number, Session[]>;
}

// AppData는 업데이트마다 새 객체이므로, 같은 렌더에서 여러 화면·함수가 불러도 한 번만 계산
const cache = new WeakMap<AppData, Derived>();

function derive(d: AppData): Derived {
  const hit = cache.get(d);
  if (hit) return hit;
  const done = completedSessions(d);
  // 개인 기록: 시작 순서대로 종목별 최고 e1RM을 누적하며 한 번에 판정 (세션마다 과거 전체를 다시 훑지 않음)
  const best = new Map<string, number>();
  const prs = new Map<string, number>();
  for (const s of [...done].sort((a, b) => a.startedAt - b.startedAt)) {
    let n = 0;
    const now = new Map<string, number>();
    for (const e of s.exercises) {
      const v = bestE1RM(e.sets.filter((x) => x.done));
      if (v === undefined) continue;
      const prev = best.get(e.exerciseId);
      if (prev !== undefined && v > prev) n++;
      now.set(e.exerciseId, Math.max(v, now.get(e.exerciseId) ?? -Infinity));
    }
    for (const [id, v] of now) best.set(id, Math.max(v, best.get(id) ?? -Infinity));
    prs.set(s.id, n);
  }
  const byWeek = new Map<number, Session[]>();
  for (const s of done) {
    const w = startOfWeek(new Date(s.startedAt)).getTime();
    const list = byWeek.get(w);
    if (list) list.push(s); else byWeek.set(w, [s]);
  }
  const out = { done, prs, byWeek };
  cache.set(d, out);
  return out;
}

/** 해당 주(weekStart부터)의 퀘스트 통계 */
function weekStats(dv: Derived, weekStart: number) {
  const inWeek = dv.byWeek.get(weekStart) ?? [];
  let prs = 0;
  for (const s of inWeek) prs += dv.prs.get(s.id) ?? 0;
  return { volume: muscleVolume(inWeek.flatMap(sessionXpSets)), sessions: inWeek.length, prs };
}

export function questsForWeek(d: AppData, weekStart = startOfWeek(new Date()).getTime()): Quest[] {
  if (!d.program || !d.profile) return [];
  return weeklyQuests(d.program, d.profile.daysPerWeek, weekStats(derive(d), weekStart));
}

/** 과거 모든 주의 클리어 여부 (오래된 순) */
export function weekHistory(d: AppData): Array<{ start: number; cleared: boolean; attended: boolean; questXp: number }> {
  const { done } = derive(d);
  if (!done.length || !d.profile) return [];
  const first = startOfWeek(new Date(Math.min(...done.map((s) => s.startedAt)))).getTime();
  const now = startOfWeek(new Date()).getTime();
  const out = [];
  for (let w = first; w <= now; w = nextWeek(w)) {
    const q = questsForWeek(d, w);
    out.push({
      start: w,
      cleared: weekCleared(q),
      attended: q.find((x) => x.kind === 'attendance')?.done ?? false,
      questXp: q.reduce((a, x) => a + (x.done ? x.xp : 0), 0),
    });
  }
  return out;
}

/** 부위별 레벨 (데이터가 바뀔 때만 다시 계산) */
export const levelsOf = memo((d: AppData) => muscleLevels(derive(d).done));

export const playerProgress = memo((d: AppData) => {
  const { prs: prMap } = derive(d);
  const lv = levelsOf(d);
  const muscleTotal = ALL_MUSCLES.reduce((a, m) => a + lv[m].xp, 0);
  const hist = weekHistory(d);
  const cleared = hist.filter((h) => h.cleared).length;
  const questXp = hist.reduce((a, h) => a + h.questXp, 0);
  let prs = 0;
  for (const n of prMap.values()) prs += n;
  // 플레이어 XP = 부위 XP 합의 절반 + 완료한 퀘스트 보상 + 주간 클리어 200 + PR 50
  const xp = Math.round(muscleTotal / 2) + questXp + cleared * 200 + prs * 50;
  let best = 0;
  let cur = 0;
  for (const h of hist) { cur = h.attended ? cur + 1 : 0; best = Math.max(best, cur); }
  return { xp, ...levelFromXp(xp), muscles: lv, clearedWeeks: cleared, prs, bestStreak: best };
});

export const achievements = memo((d: AppData) => {
  const { done } = derive(d);
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
});

/** 계획된 하루 운동이 각 부위 그룹 퀘스트에 더할 세트 수 */
export function dayRegionGain(exercises: Array<{ exerciseId: string; sets: number }>): Partial<Record<Region, number>> {
  const out: Partial<Record<Region, number>> = {};
  for (const pe of exercises) {
    const ex = EXERCISE_BY_ID.get(pe.exerciseId);
    if (!ex) continue;
    const add = (m: Muscle, w: number) => {
      const r = regionOf(m);
      if (r) out[r] = (out[r] ?? 0) + pe.sets * w * REGION_WEIGHT[r];
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
