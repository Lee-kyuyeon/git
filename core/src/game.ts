import type { Exercise, Muscle, Program } from './types.ts';
import { ALL_MUSCLES } from './types.ts';

/*
 * 게임화: 부위별 경험치(XP)·레벨, 주간 퀘스트, 업적.
 * 원칙: 운동과학적으로 의미 있는 행동에 보상한다.
 * - XP는 부위별 "유효 세트"에 비례 (주동근 1세트 = 10XP, 보조근 = 5XP) → 근비대의 핵심 변수인 주간 볼륨과 같은 단위
 * - 너무 쉬운 세트(RPE < 7)는 절반만 인정 → 실패에 가까울수록 근비대에 유리하다는 근거 반영
 * - 주간 퀘스트 목표 = 루틴 생성기의 부위별 주간 목표 세트 → 퀘스트를 깨면 근거 기반 볼륨을 채운 것
 */

export const XP_PRIMARY = 10;
export const XP_SECONDARY = 5;

export interface XpSet {
  exercise: Exercise;
  rpe?: number;
  isWarmup?: boolean;
}

export function effortFactor(rpe?: number): number {
  if (rpe === undefined) return 1;
  return rpe < 7 ? 0.5 : 1;
}

/** 한 세트가 각 부위에 주는 XP */
export function setXp(s: XpSet): Partial<Record<Muscle, number>> {
  if (s.isWarmup) return {};
  const f = effortFactor(s.rpe);
  const out: Partial<Record<Muscle, number>> = {};
  for (const m of s.exercise.primary) out[m] = (out[m] ?? 0) + XP_PRIMARY * f;
  for (const m of s.exercise.secondary) out[m] = (out[m] ?? 0) + XP_SECONDARY * f;
  return out;
}

export function muscleXp(sets: XpSet[]): Record<Muscle, number> {
  const out = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of sets) for (const [m, v] of Object.entries(setXp(s))) out[m as Muscle] += v!;
  return out;
}

/** 부위별 fractional 세트 (주동근 1, 보조근 0.5, RPE<7은 절반) = XP / XP_PRIMARY */
export function muscleVolume(sets: XpSet[]): Record<Muscle, number> {
  const xp = muscleXp(sets);
  for (const m of ALL_MUSCLES) xp[m] /= XP_PRIMARY;
  return xp;
}

/** 레벨 L → L+1에 필요한 XP. 레벨이 오를수록 조금씩 더 필요 */
export function xpToNext(level: number): number {
  return 100 + 40 * (level - 1);
}

export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rest = Math.max(0, xp);
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

export const RANKS = [
  { min: 1, name: '입문', color: 'bronze' },
  { min: 5, name: '초급', color: 'silver' },
  { min: 10, name: '중급', color: 'gold' },
  { min: 20, name: '상급', color: 'platinum' },
  { min: 35, name: '엘리트', color: 'diamond' },
  { min: 50, name: '전설', color: 'legend' },
] as const;

export function rankOf(level: number) {
  return [...RANKS].reverse().find((r) => level >= r.min)!;
}

// ── 부위 그룹 (퀘스트 단위) ──

export type Region = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs';

export const REGIONS: Record<Region, { name: string; muscles: Muscle[] }> = {
  chest: { name: '가슴', muscles: ['chest'] },
  back: { name: '등', muscles: ['lats', 'upperBack'] },
  shoulders: { name: '어깨', muscles: ['frontDelts', 'sideDelts', 'rearDelts'] },
  arms: { name: '팔', muscles: ['biceps', 'triceps'] },
  legs: { name: '하체', muscles: ['quads', 'hamstrings', 'glutes'] },
};

/** 겹치는 자극(스쿼트 = 대퇴사두+둔근, 프레스 = 전면+측면 삼각근)을 고려한 그룹 세트 가중치 */
export const REGION_WEIGHT: Record<Region, number> = { chest: 1, back: 1, shoulders: 0.8, arms: 1, legs: 0.7 };

export function regionOf(m: Muscle): Region | undefined {
  return (Object.keys(REGIONS) as Region[]).find((r) => REGIONS[r].muscles.includes(m));
}

// ── 주간 퀘스트 ──

export interface Quest {
  id: string;
  title: string;
  kind: 'volume' | 'attendance' | 'pr';
  region?: Region;
  target: number;
  progress: number;
  done: boolean;
  xp: number;
}

export interface WeekStats {
  /** 부위별 이번 주 fractional 세트 (주동근 1, 보조근 0.5, RPE<7은 절반) */
  volume: Record<Muscle, number>;
  sessions: number;
  prs: number;
}

/**
 * 프로그램의 부위별 주간 목표를 부위 그룹으로 묶어 퀘스트로 만듭니다.
 * 목표가 너무 큰 그룹(하체 3부위 합)은 그대로 쓰되, 세션 수로 나눠 떨어지게 정수로 올림.
 */
export function weeklyQuests(program: Program, daysPerWeek: number, week: WeekStats): Quest[] {
  const quests: Quest[] = [];
  quests.push(mk('attendance', `이번 주 ${daysPerWeek}회 운동`, 'attendance', daysPerWeek, week.sessions, 100));
  for (const r of Object.keys(REGIONS) as Region[]) {
    const muscles = REGIONS[r].muscles;
    // 그룹 목표 = 구성 부위 목표의 합 × 겹침 가중치 (하체 70%, 어깨 80%)
    const raw = muscles.reduce((a, m) => a + program.weeklyTargets[m], 0) * REGION_WEIGHT[r];
    const target = Math.max(2, Math.round(raw));
    const progress = muscles.reduce((a, m) => a + week.volume[m], 0) * REGION_WEIGHT[r];
    quests.push({ ...mk(`vol-${r}`, `${REGIONS[r].name} ${target}세트`, 'volume', target, Math.round(progress * 2) / 2, 50), region: r });
  }
  quests.push(mk('pr', '개인 기록 1개 경신', 'pr', 1, week.prs, 50));
  return quests;
}

function mk(id: string, title: string, kind: Quest['kind'], target: number, progress: number, xp: number): Quest {
  return { id, title, kind, target, progress, done: progress >= target, xp };
}

/** 주간 클리어: 출석 퀘스트 + 부위 퀘스트 4개 이상 (PR은 보너스) */
export function weekCleared(quests: Quest[]): boolean {
  const att = quests.find((q) => q.kind === 'attendance')?.done ?? false;
  const vol = quests.filter((q) => q.kind === 'volume' && q.done).length;
  return att && vol >= 4;
}

// ── 업적 ──

export interface AchievementStats {
  sessions: number;
  totalSets: number;
  prs: number;
  bestStreak: number;
  maxMuscleLevel: number;
  clearedWeeks: number;
  painFreeLight: number; // 주의 표시 종목을 완료한 횟수
}

export const ACHIEVEMENTS: Array<{ id: string; emoji: string; name: string; desc: string; test: (s: AchievementStats) => boolean }> = [
  { id: 'first', emoji: '🐣', name: '첫걸음', desc: '첫 운동 완료', test: (s) => s.sessions >= 1 },
  { id: 's10', emoji: '🔟', name: '꾸준함', desc: '운동 10회', test: (s) => s.sessions >= 10 },
  { id: 's50', emoji: '🏅', name: '습관 장인', desc: '운동 50회', test: (s) => s.sessions >= 50 },
  { id: 'sets500', emoji: '🧱', name: '벽돌 500장', desc: '본세트 500개', test: (s) => s.totalSets >= 500 },
  { id: 'pr1', emoji: '📈', name: '한계 돌파', desc: '첫 개인 기록', test: (s) => s.prs >= 1 },
  { id: 'pr10', emoji: '🚀', name: '연속 돌파', desc: '개인 기록 10회', test: (s) => s.prs >= 10 },
  { id: 'clear1', emoji: '🗺️', name: '주간 정복', desc: '주간 퀘스트 클리어', test: (s) => s.clearedWeeks >= 1 },
  { id: 'streak4', emoji: '🔥', name: '불꽃 4주', desc: '4주 연속 목표 달성', test: (s) => s.bestStreak >= 4 },
  { id: 'lv10', emoji: '💎', name: '중급 근육', desc: '한 부위 레벨 10', test: (s) => s.maxMuscleLevel >= 10 },
  { id: 'care', emoji: '🩹', name: '현명한 회복', desc: '불편 부위를 가볍게 10세트', test: (s) => s.painFreeLight >= 10 },
];
