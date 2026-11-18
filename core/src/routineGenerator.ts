import type { Equipment, Exercise, Goal, Muscle, PlannedExercise, Profile, Program, ProgramDay } from './types.ts';
import { ALL_MUSCLES } from './types.ts';
import { EXERCISES } from './exercises.ts';

/*
 * 볼륨 목표 기반 루틴 생성기 (근거: docs/05-anatomy-science-review.md)
 *
 * 1) 프로필 → 부위별 주간 목표 세트(fractional: 주동근 1, 보조근 0.5)
 * 2) 분할 → 각 부위가 주 2회 이상 등장하도록 운동일별 대상 부위 결정
 * 3) 운동일마다 "남은 목표가 가장 큰 부위"부터, 그 부위를 가장 효율적으로 채우는 종목을 고름 (그리디)
 * 4) 세션당 부위 상한 10세트, 시간 예산 안에서 종료
 */

// ── 1. 주간 목표 세트 ──────────────────────────────────────────────

type Size = 'large' | 'medium' | 'small' | 'none';

const MUSCLE_SIZE: Record<Muscle, Size> = {
  chest: 'large', lats: 'large', upperBack: 'large', quads: 'large', hamstrings: 'large', glutes: 'large',
  sideDelts: 'medium', rearDelts: 'medium', biceps: 'medium', triceps: 'medium', calves: 'medium', core: 'medium',
  // 전면 삼각근은 프레스류의 보조 자극으로 충분, 승모·내전근은 소량
  frontDelts: 'small', traps: 'small', adductors: 'small',
  forearms: 'none',
};

/** 중급자 기준 부위별 주간 fractional 세트 */
const BASE_TARGET: Record<Goal, Record<Size, number>> = {
  hypertrophy: { large: 12, medium: 8, small: 4, none: 0 },
  strength: { large: 8, medium: 5, small: 3, none: 0 },
  fatLoss: { large: 8, medium: 5, small: 3, none: 0 },
  health: { large: 6, medium: 4, small: 2, none: 0 },
};

const EXPERIENCE_FACTOR = { beginner: 0.75, intermediate: 1, advanced: 1.25 } as const;

/** 세션당 부위별 상한. 이를 넘으면 근비대 추가 이득이 검출되지 않음 (Pelland 외, ~11 fractional) */
export const SESSION_CAP = 10;
/** 주간 상한 (Pelland 외, ~31 fractional 이후 추가 이득 미검출) */
export const WEEKLY_CAP = 24;

/** 사무직 목·어깨 통증 완화에 도움이 되는 부위 (Andersen 외 직장 내 근력훈련 RCT) */
const DESK_MUSCLES: Muscle[] = ['upperBack', 'rearDelts', 'traps'];

export function weeklyTargets(profile: Profile): Record<Muscle, number> {
  const base = BASE_TARGET[profile.goal];
  let factor = EXPERIENCE_FACTOR[profile.experience];
  // 육체노동·교대근무: 일과 자체가 회복 자원을 쓰므로 볼륨을 낮춤 (근거 약함, 보수적 휴리스틱)
  if (profile.workActivity === 'manual') factor *= 0.8;
  if (profile.shiftWork) factor *= 0.85;
  // 주 2회 미만은 한 번에 담을 수 있는 양이 한정됨
  const capByFreq = Math.min(WEEKLY_CAP, SESSION_CAP * Math.max(1, Math.min(profile.daysPerWeek, 3)));

  const out = {} as Record<Muscle, number>;
  for (const m of ALL_MUSCLES) {
    let t = base[MUSCLE_SIZE[m]] * factor;
    if (profile.workActivity === 'sedentary' && DESK_MUSCLES.includes(m)) t = Math.max(t * 1.3, 6 * factor);
    if (profile.focusMuscles?.includes(m)) t = Math.max(t * 1.4, 8);
    out[m] = Math.round(Math.min(t, capByFreq) * 2) / 2;
  }
  return out;
}

// ── 2. 분할 ────────────────────────────────────────────────────────

const UPPER: Muscle[] = ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'traps', 'forearms'];
const LOWER: Muscle[] = ['quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core'];
const PUSH: Muscle[] = ['chest', 'frontDelts', 'sideDelts', 'triceps'];
const PULL: Muscle[] = ['lats', 'upperBack', 'rearDelts', 'biceps', 'traps', 'forearms'];
const FULL: Muscle[] = [...ALL_MUSCLES];

const SPLITS: Record<Program['split'], Array<{ name: string; muscles: Muscle[] }>> = {
  fullBody: [{ name: '전신 A', muscles: FULL }, { name: '전신 B', muscles: FULL }, { name: '전신 C', muscles: FULL }],
  upperLower: [
    { name: '상체 A', muscles: UPPER }, { name: '하체 A', muscles: LOWER },
    { name: '상체 B', muscles: UPPER }, { name: '하체 B', muscles: LOWER },
  ],
  // 주 5회: 모든 부위가 주 2회 이상 (기존 PPL 5회는 하체가 주 1회였음)
  upperLowerPpl: [
    { name: '상체', muscles: UPPER }, { name: '하체 A', muscles: LOWER },
    { name: '푸시', muscles: PUSH }, { name: '풀', muscles: PULL }, { name: '하체 B', muscles: LOWER },
  ],
  pushPullLegs: [
    { name: '푸시 A', muscles: PUSH }, { name: '풀 A', muscles: PULL }, { name: '레그 A', muscles: LOWER },
    { name: '푸시 B', muscles: PUSH }, { name: '풀 B', muscles: PULL }, { name: '레그 B', muscles: LOWER },
  ],
};

export function chooseSplit(daysPerWeek: number): Program['split'] {
  if (daysPerWeek <= 3) return 'fullBody';
  if (daysPerWeek === 4) return 'upperLower';
  if (daysPerWeek === 5) return 'upperLowerPpl';
  return 'pushPullLegs';
}

// ── 3. 세트 스킴 ───────────────────────────────────────────────────

type Scheme = Omit<PlannedExercise, 'exerciseId' | 'caution'>;

const SCHEME: Record<Goal, { compound: Scheme; isolation: Scheme }> = {
  strength: {
    compound: { sets: 4, repMin: 3, repMax: 6, restSec: 180, targetRpe: 8 },
    isolation: { sets: 3, repMin: 6, repMax: 10, restSec: 90, targetRpe: 8 },
  },
  // 근비대: 실패에 가까울수록 유리 (Robinson 외 2024) → 고립은 RPE 9
  hypertrophy: {
    compound: { sets: 4, repMin: 6, repMax: 10, restSec: 120, targetRpe: 8 },
    isolation: { sets: 3, repMin: 10, repMax: 15, restSec: 75, targetRpe: 9 },
  },
  // 다이어트: 근손실 방지를 위해 컴파운드는 중간 반복 유지
  fatLoss: {
    compound: { sets: 3, repMin: 8, repMax: 12, restSec: 90, targetRpe: 8 },
    isolation: { sets: 3, repMin: 12, repMax: 20, restSec: 45, targetRpe: 8.5 },
  },
  health: {
    compound: { sets: 3, repMin: 8, repMax: 12, restSec: 90, targetRpe: 7 },
    isolation: { sets: 2, repMin: 12, repMax: 15, restSec: 60, targetRpe: 7.5 },
  },
};

/** 한 종목의 예상 소요 시간(초). 세트당 수행 40초 + 휴식, 종목 전환 60초 */
export function estimateSeconds(p: Pick<PlannedExercise, 'sets' | 'restSec'>): number {
  return p.sets * (40 + p.restSec) + 60;
}

// ── 4. 종목 선택 ───────────────────────────────────────────────────

/** 수행 가능한 종목인지: 기구 보유, 경력 대비 난이도. 불편 부위는 제외하지 않고 점수로 후순위 처리 */
export function isAvailable(ex: Exercise, profile: Profile): boolean {
  const owned = new Set<Equipment>([...profile.equipment, 'bodyweight']);
  if (!ex.equipment.every((e) => owned.has(e))) return false;
  const maxDifficulty = profile.experience === 'beginner' ? 2 : 3;
  return ex.difficulty <= maxDifficulty;
}

export function jointConflicts(ex: Exercise, profile: Profile): Profile['injuries'] {
  return ex.stressedJoints.filter((j) => profile.injuries.includes(j));
}

function loadability(e: Exercise): number {
  if (e.equipment.some((q) => q === 'barbell' || q === 'dumbbell' || q === 'kettlebell')) return 1;
  if (e.equipment.some((q) => q === 'cable' || q === 'machine')) return 0.8;
  return 0.3;
}

function scoreExercise(
  e: Exercise, deficit: Record<Muscle, number>, profile: Profile, weeklyUse: number, positionInDay: number,
): number {
  let useful = 0;
  for (const m of e.primary) useful += deficit[m] > 0.5 ? 1 : -0.3;
  for (const m of e.secondary) useful += deficit[m] > 0.5 ? 0.5 : 0;
  let s = useful * 3;
  if (e.mechanic === 'compound' && positionInDay < 3) s += 2;
  s += loadability(e);
  if (e.lengthBias === 'lengthened') s += 1;
  s -= jointConflicts(e, profile).length * 5;
  // 육체노동자는 허리 부담 종목을 약간 후순위 (일과에서 이미 허리를 씀)
  if (profile.workActivity === 'manual' && e.stressedJoints.includes('lowerBack')) s -= 1.5;
  s -= weeklyUse * 2.5;
  return s;
}

// ── 5. 생성 ────────────────────────────────────────────────────────

export function generateProgram(profile: Profile, pool: Exercise[] = EXERCISES): Program {
  const split = chooseSplit(profile.daysPerWeek);
  const templates = SPLITS[split];
  const dayTemplates = Array.from({ length: profile.daysPerWeek }, (_, d) => templates[d % templates.length]!);
  const available = pool.filter((e) => isAvailable(e, profile));
  const targets = weeklyTargets(profile);
  const scheme = SCHEME[profile.goal];
  const budgetSec = profile.minutesPerSession * 60;

  const remainingWeekly = { ...targets };
  const weeklyUse = new Map<string, number>();
  const days: ProgramDay[] = [];

  dayTemplates.forEach((tpl, d) => {
    // 오늘 이 부위 몫 = 남은 주간 목표 / 남은 등장 일수 (상한 SESSION_CAP)
    const deficit = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
    for (const m of tpl.muscles) {
      const daysLeft = dayTemplates.slice(d).filter((t) => t.muscles.includes(m)).length;
      deficit[m] = Math.min(SESSION_CAP, remainingWeekly[m] / daysLeft);
    }
    const dayTarget = { ...deficit };
    // 시간이 부족해도 작은 부위가 밀리지 않도록 "오늘 몫 대비 남은 비율"이 큰 부위부터
    const priority = (m: Muscle) => (dayTarget[m] > 0 ? deficit[m] / dayTarget[m] : 0);

    const chosen: Array<{ ex: Exercise; plan: PlannedExercise }> = [];
    const usedToday = new Set<string>();
    const dead = new Set<Muscle>(); // 오늘 더 채울 수 없는 부위
    let elapsed = 0;
    // 집중 부위는 컴파운드의 부수 자극만으로 채워지지 않도록 그 부위 전용 종목을 먼저 1개 넣음
    const mandatory = (profile.focusMuscles ?? []).filter((m) => tpl.muscles.includes(m));

    while (true) {
      const forced = mandatory.shift();
      const target = forced ?? tpl.muscles
        .filter((m) => !dead.has(m) && deficit[m] >= 1.5)
        .sort((a, b) => priority(b) - priority(a) || deficit[b] - deficit[a] || a.localeCompare(b))[0];
      if (!target) break;

      const candidates = available
        .filter((e) => (forced ? e.primary.length === 1 && e.primary[0] === forced : e.primary.includes(target)) && !usedToday.has(e.id))
        .map((e) => ({ e, s: scoreExercise(e, deficit, profile, weeklyUse.get(e.id) ?? 0, chosen.length) }))
        .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id));
      const pick = candidates[0]?.e;
      if (!pick) { if (!forced) dead.add(target); continue; }

      const base = pick.mechanic === 'compound' ? scheme.compound : scheme.isolation;
      // 전신 분할은 같은 부위를 자주 하므로 종목당 세트를 3으로 제한하고 종목 수를 늘림
      const maxSets = split === 'fullBody' ? Math.min(base.sets, 3) : base.sets;
      let sets = forced ? maxSets : Math.max(2, Math.min(maxSets, Math.round(deficit[target])));
      const conflicts = jointConflicts(pick, profile);
      const plan: PlannedExercise = {
        exerciseId: pick.id, ...base, sets,
        // 불편 부위와 겹치면 가볍게 시작 (RPE 7 이하)
        ...(conflicts.length ? { caution: conflicts, targetRpe: Math.min(base.targetRpe, 7) } : {}),
      };
      if (elapsed + estimateSeconds(plan) > budgetSec) {
        plan.sets = sets = 2;
        if (elapsed + estimateSeconds(plan) > budgetSec) break;
      }

      for (const m of pick.primary) deficit[m] -= sets;
      for (const m of pick.secondary) deficit[m] -= sets * 0.5;
      usedToday.add(pick.id);
      weeklyUse.set(pick.id, (weeklyUse.get(pick.id) ?? 0) + 1);
      chosen.push({ ex: pick, plan });
      elapsed += estimateSeconds(plan);
    }

    // 실제 수행분을 주간 잔여 목표에서 차감
    for (const { ex, plan } of chosen) {
      for (const m of ex.primary) remainingWeekly[m] -= plan.sets;
      for (const m of ex.secondary) remainingWeekly[m] -= plan.sets * 0.5;
    }

    // 컴파운드 먼저, 그다음 선택 순서
    chosen.sort((a, b) => Number(b.ex.mechanic === 'compound') - Number(a.ex.mechanic === 'compound'));
    days.push({ name: tpl.name, focus: tpl.muscles, exercises: chosen.map((c) => c.plan) });
  });

  return { split, days, weeklyTargets: targets };
}

/** 부위별 주간 fractional 세트와 빈도(해당 부위 1.5 fractional 세트 이상인 날 수) */
export function weeklyVolume(program: Program, pool: Exercise[] = EXERCISES): Record<Muscle, { sets: number; freq: number }> {
  const byId = new Map(pool.map((e) => [e.id, e]));
  const out = Object.fromEntries(ALL_MUSCLES.map((m) => [m, { sets: 0, freq: 0 }])) as Record<Muscle, { sets: number; freq: number }>;
  for (const day of program.days) {
    const today = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
    for (const pe of day.exercises) {
      const ex = byId.get(pe.exerciseId);
      if (!ex) continue;
      for (const m of ex.primary) today[m] += pe.sets;
      for (const m of ex.secondary) today[m] += pe.sets * 0.5;
    }
    for (const m of ALL_MUSCLES) {
      out[m].sets += today[m];
      if (today[m] >= 1.5) out[m].freq++; // 당기기 3세트의 이두 보조 자극(1.5)도 1회로 셈
    }
  }
  return out;
}

/** 대체 종목: 같은 주동근을 쓰는 수행 가능한 종목을 유사도 순으로 (불편 부위 충돌이 적은 것 우선) */
export function alternativesFor(exerciseId: string, profile: Profile, pool: Exercise[] = EXERCISES): Exercise[] {
  const target = pool.find((e) => e.id === exerciseId);
  if (!target) return [];
  const sim = (e: Exercise) =>
    e.primary.filter((m) => target.primary.includes(m)).length * 10 +
    (e.mechanic === target.mechanic ? 5 : 0) -
    jointConflicts(e, profile).length * 8 +
    (e.lengthBias === 'lengthened' ? 1 : 0);
  return pool
    .filter((e) => e.id !== exerciseId && isAvailable(e, profile) && e.primary.some((m) => target.primary.includes(m)))
    .sort((a, b) => sim(b) - sim(a) || a.id.localeCompare(b.id));
}
