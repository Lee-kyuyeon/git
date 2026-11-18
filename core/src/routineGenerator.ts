import type { Equipment, Exercise, Goal, Muscle, PlannedExercise, Profile, Program, ProgramDay } from './types.ts';
import { EXERCISES } from './exercises.ts';

/** 목표별 세트/반복/휴식 템플릿 [컴파운드, 고립] */
const SCHEME: Record<Goal, { compound: Omit<PlannedExercise, 'exerciseId'>; isolation: Omit<PlannedExercise, 'exerciseId'> }> = {
  strength: { compound: { sets: 5, repMin: 3, repMax: 5, restSec: 180 }, isolation: { sets: 3, repMin: 6, repMax: 8, restSec: 90 } },
  hypertrophy: { compound: { sets: 4, repMin: 6, repMax: 10, restSec: 120 }, isolation: { sets: 3, repMin: 10, repMax: 15, restSec: 60 } },
  fatLoss: { compound: { sets: 3, repMin: 10, repMax: 15, restSec: 60 }, isolation: { sets: 3, repMin: 12, repMax: 20, restSec: 45 } },
  health: { compound: { sets: 3, repMin: 8, repMax: 12, restSec: 90 }, isolation: { sets: 2, repMin: 12, repMax: 15, restSec: 60 } },
};

/** 분할별 운동일 템플릿: 슬롯 = 순서대로 채울 타깃 부위 */
const SPLITS: Record<Program['split'], Array<{ name: string; slots: Muscle[]; variant?: number }>> = {
  fullBody: [
    { name: '전신 A', slots: ['quads', 'chest', 'back', 'shoulders', 'hamstrings', 'core'] },
    { name: '전신 B', variant: 1, slots: ['hamstrings', 'back', 'chest', 'glutes', 'shoulders', 'biceps', 'triceps'] },
    { name: '전신 C', variant: 2, slots: ['glutes', 'chest', 'back', 'quads', 'shoulders', 'core'] },
  ],
  upperLower: [
    { name: '상체 A', slots: ['chest', 'back', 'shoulders', 'chest', 'back', 'biceps', 'triceps'] },
    { name: '하체 A', slots: ['quads', 'hamstrings', 'glutes', 'quads', 'calves', 'core'] },
    { name: '상체 B', variant: 1, slots: ['back', 'chest', 'shoulders', 'back', 'shoulders', 'triceps', 'biceps'] },
    { name: '하체 B', variant: 1, slots: ['hamstrings', 'quads', 'glutes', 'hamstrings', 'calves', 'core'] },
  ],
  pushPullLegs: [
    { name: '푸시', slots: ['chest', 'shoulders', 'chest', 'shoulders', 'triceps', 'triceps'] },
    { name: '풀', slots: ['back', 'back', 'back', 'shoulders', 'biceps', 'biceps'] },
    { name: '레그', slots: ['quads', 'hamstrings', 'glutes', 'quads', 'calves', 'core'] },
  ],
};

export function chooseSplit(daysPerWeek: number): Program['split'] {
  if (daysPerWeek <= 3) return 'fullBody';
  if (daysPerWeek === 4) return 'upperLower';
  return 'pushPullLegs';
}

/** 사용자가 수행 가능한 종목인지: 기구 보유, 불편 부위 회피, 경력 대비 난이도 */
export function isAvailable(ex: Exercise, profile: Profile): boolean {
  const owned = new Set<Equipment>([...profile.equipment, 'bodyweight']);
  if (!ex.equipment.every((e) => owned.has(e))) return false;
  if (ex.stressedJoints.some((j) => profile.injuries.includes(j))) return false;
  const maxDifficulty = profile.experience === 'beginner' ? 2 : 3;
  return ex.difficulty <= maxDifficulty;
}

/** 한 종목의 예상 소요 시간(초). 세트당 수행 40초 + 휴식, 종목 전환 60초 */
export function estimateSeconds(p: PlannedExercise): number {
  return p.sets * (40 + p.restSec) + 60;
}

/**
 * 프로필로 주간 프로그램을 생성합니다.
 * 1) 주당 횟수로 분할 결정 → 2) 슬롯마다 가능한 종목 중 컴파운드 우선 선택(같은 날 중복 없음)
 * 3) 목표별 세트 스킴 적용 → 4) 시간 예산을 넘는 뒤쪽 종목을 잘라냅니다.
 */
export function generateProgram(profile: Profile, pool: Exercise[] = EXERCISES): Program {
  const split = chooseSplit(profile.daysPerWeek);
  const templates = SPLITS[split];
  const available = pool.filter((e) => isAvailable(e, profile));
  const budgetSec = profile.minutesPerSession * 60;
  const scheme = SCHEME[profile.goal];

  const days: ProgramDay[] = [];
  for (let d = 0; d < profile.daysPerWeek; d++) {
    const tpl = templates[d % templates.length]!;
    // A/B 변형 날과, 같은 템플릿이 반복되는 주(예: PPL 6회)의 두 번째 사이클은 다른 종목을 고르도록 회전
    const rotation = (tpl.variant ?? 0) + Math.floor(d / templates.length);
    const used = new Set<string>();
    const exercises: PlannedExercise[] = [];
    let elapsed = 0;

    tpl.slots.forEach((muscle, slotIdx) => {
      // 첫 두 슬롯은 컴파운드, 이후는 고립 우선
      const preferCompound = slotIdx < 2;
      const candidates = available
        .filter((e) => e.primary.includes(muscle) && !used.has(e.id))
        .sort((a, b) => rank(b, preferCompound) - rank(a, preferCompound));
      if (candidates.length === 0) return;
      const pick = candidates[rotation % candidates.length]!;

      const base = pick.mechanic === 'compound' ? scheme.compound : scheme.isolation;
      const planned: PlannedExercise = { exerciseId: pick.id, ...base };
      const cost = estimateSeconds(planned);
      if (elapsed + cost > budgetSec && exercises.length >= 2) return;

      used.add(pick.id);
      exercises.push(planned);
      elapsed += cost;
    });

    days.push({ name: tpl.name, focus: unique(tpl.slots), exercises });
  }
  return { split, days };
}

/** 대체 종목: 같은 주동근을 쓰는 수행 가능한 종목을 유사도 순으로 */
export function alternativesFor(exerciseId: string, profile: Profile, pool: Exercise[] = EXERCISES): Exercise[] {
  const target = pool.find((e) => e.id === exerciseId);
  if (!target) return [];
  return pool
    .filter((e) => e.id !== exerciseId && isAvailable(e, profile) && e.primary.some((m) => target.primary.includes(m)))
    .sort((a, b) => similarity(b, target) - similarity(a, target));
}

function rank(e: Exercise, preferCompound: boolean): number {
  const mech = (e.mechanic === 'compound') === preferCompound ? 10 : 0;
  // 프리웨이트 > 케이블/머신 > 밴드/맨몸 순으로 점진적 과부하가 쉬움
  const loadable = e.equipment.some((q) => q === 'barbell' || q === 'dumbbell') ? 3
    : e.equipment.some((q) => q === 'cable' || q === 'machine') ? 2 : 1;
  return mech + loadable;
}

function similarity(a: Exercise, b: Exercise): number {
  const shared = a.primary.filter((m) => b.primary.includes(m)).length;
  return shared * 10 + (a.mechanic === b.mechanic ? 5 : 0) + (a.primary.length === b.primary.length ? 1 : 0);
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
