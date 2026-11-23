import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_EQUIPMENT, ALL_MUSCLES, EXERCISE_BY_ID, EXERCISES, alternativesFor, bestE1RM, chooseSplit, coldStartWeight,
  estimate1RM, estimateSeconds, generateProgram, painDuringSet, painNextDay, recommendNext,
  recoveryByMuscle, warmupSets, weeklyStreak, weeklyTargets, weeklyVolume,
  type Muscle, type PlannedExercise, type Profile,
} from '../src/index.ts';

const GYM = ALL_EQUIPMENT;
const gymProfile: Profile = {
  goal: 'hypertrophy', experience: 'intermediate', daysPerWeek: 4, minutesPerSession: 60,
  equipment: [...GYM], injuries: [],
};
const homeProfile: Profile = {
  goal: 'fatLoss', experience: 'beginner', daysPerWeek: 3, minutesPerSession: 40,
  equipment: ['dumbbell', 'band'], injuries: ['knee'],
};
const MAJOR: Muscle[] = ['chest', 'lats', 'upperBack', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes'];

const bench = EXERCISE_BY_ID.get('bb_bench_press')!;
const squat = EXERCISE_BY_ID.get('bb_squat')!;
const plan: PlannedExercise = { exerciseId: 'bb_bench_press', sets: 3, repMin: 8, repMax: 12, restSec: 90, targetRpe: 8 };

// ── 시드 데이터 ──

test('시드 데이터: id 중복 없음, 모든 부위에 주동근 종목 존재', () => {
  assert.equal(new Set(EXERCISES.map((e) => e.id)).size, EXERCISES.length);
  for (const m of ALL_MUSCLES) assert.ok(EXERCISES.some((e) => e.primary.includes(m)), m);
});

test('시드 데이터: 홈트(맨몸/밴드)로 주요 부위를 모두 훈련 가능', () => {
  for (const m of MAJOR) {
    assert.ok(EXERCISES.some((e) => e.primary.includes(m) && e.equipment.every((q) => q === 'bodyweight' || q === 'band')), m);
  }
});

test('시드 데이터: 근거 기반 늘어난 위치 종목 포함 (시티드 레그컬, 오버헤드 삼두)', () => {
  assert.equal(EXERCISE_BY_ID.get('seated_leg_curl')!.lengthBias, 'lengthened');
  assert.equal(EXERCISE_BY_ID.get('db_overhead_ext')!.lengthBias, 'lengthened');
});

// ── 1RM ──

test('1RM: 1회는 무게 그대로, 반복이 많을수록 신뢰도 하락', () => {
  assert.equal(estimate1RM(100, 1).value, 100);
  const r5 = estimate1RM(100, 5);
  assert.ok(r5.value > 110 && r5.value < 118);
  assert.equal(r5.confidence, 'high');
  assert.equal(estimate1RM(50, 15).confidence, 'low');
});

test('1RM 추이: 10회 초과 세트와 웜업은 제외', () => {
  assert.equal(bestE1RM([{ weightKg: 60, reps: 20 }]), undefined);
  const v = bestE1RM([{ weightKg: 40, reps: 5, isWarmup: true }, { weightKg: 80, reps: 5 }, { weightKg: 60, reps: 15 }]);
  assert.equal(v, estimate1RM(80, 5).value);
});

// ── 분할과 볼륨 ──

test('분할 선택: 5회는 상/하/푸시/풀/하체', () => {
  assert.equal(chooseSplit(2), 'fullBody');
  assert.equal(chooseSplit(4), 'upperLower');
  assert.equal(chooseSplit(5), 'upperLowerPpl');
  assert.equal(chooseSplit(6), 'pushPullLegs');
});

for (const days of [3, 4, 5, 6]) {
  test(`볼륨: 헬스장 근비대 주 ${days}회 → 주요 부위가 목표의 65~180%, 주 2회 이상`, () => {
    const p = generateProgram({ ...gymProfile, daysPerWeek: days, minutesPerSession: days === 6 ? 75 : 60 });
    const v = weeklyVolume(p);
    for (const m of MAJOR) {
      const t = p.weeklyTargets[m];
      assert.ok(v[m].sets >= t * 0.65 && v[m].sets <= t * 1.8, `${m}: ${v[m].sets} / 목표 ${t}`);
      assert.ok(v[m].freq >= 2, `${m}: 주 ${v[m].freq}회`);
    }
  });
}

test('볼륨: 세션 시간 예산 준수, 하루 내 종목 중복 없음, 컴파운드 먼저', () => {
  for (const days of [2, 3, 4, 5, 6]) {
    const prof = { ...gymProfile, daysPerWeek: days };
    for (const day of generateProgram(prof).days) {
      const ids = day.exercises.map((e) => e.exerciseId);
      assert.equal(new Set(ids).size, ids.length);
      const total = day.exercises.reduce((s, e) => s + estimateSeconds(e), 0);
      assert.ok(total <= prof.minutesPerSession * 60, `${day.name} ${total}s`);
      const mech = ids.map((id) => EXERCISE_BY_ID.get(id)!.mechanic);
      assert.ok(mech.lastIndexOf('compound') < (mech.indexOf('isolation') === -1 ? Infinity : mech.indexOf('isolation')) || !mech.includes('isolation'));
    }
  }
});

test('볼륨: 주 6회 같은 분할의 A/B 날은 종목이 다름', () => {
  const p = generateProgram({ ...gymProfile, daysPerWeek: 6, minutesPerSession: 75 });
  assert.notDeepEqual(p.days[0]!.exercises.map((e) => e.exerciseId), p.days[3]!.exercises.map((e) => e.exerciseId));
});

// ── 부상 처리: 제외가 아니라 조절 ──

test('부상: 무릎 불편이어도 대퇴사두 훈련은 유지 (기존 버그: 0세트)', () => {
  const v = weeklyVolume(generateProgram(homeProfile));
  assert.ok(v.quads.sets >= 4, `quads ${v.quads.sets}`);
});

test('부상: 무릎 부담 종목은 후순위, 쓰이면 caution 표시와 RPE 7 이하', () => {
  const p = generateProgram({ ...gymProfile, injuries: ['knee'] });
  const all = p.days.flatMap((d) => d.exercises);
  const knee = all.filter((pe) => EXERCISE_BY_ID.get(pe.exerciseId)!.stressedJoints.includes('knee'));
  for (const pe of knee) {
    assert.deepEqual(pe.caution, ['knee']);
    assert.ok(pe.targetRpe <= 7);
  }
  const healthy = generateProgram(gymProfile).days.flatMap((d) => d.exercises)
    .filter((pe) => EXERCISE_BY_ID.get(pe.exerciseId)!.stressedJoints.includes('knee'));
  assert.ok(knee.length <= healthy.length);
});

test('부상: 보유 기구만 사용, 초보는 난이도 3 제외', () => {
  for (const day of generateProgram(homeProfile).days) {
    for (const pe of day.exercises) {
      const ex = EXERCISE_BY_ID.get(pe.exerciseId)!;
      assert.ok(ex.equipment.every((q) => ['dumbbell', 'band', 'bodyweight'].includes(q)), ex.id);
      assert.ok(ex.difficulty <= 2, ex.id);
    }
  }
});

test('통증 모니터링 단계', () => {
  assert.equal(painDuringSet(2).action, 'continue');
  assert.equal(painDuringSet(5).action, 'reduce');
  assert.equal(painDuringSet(6).action, 'swap');
  assert.equal(painDuringSet(9).action, 'stop');
  assert.equal(painNextDay(2, 4), 'swap');
  assert.equal(painNextDay(2, 3), 'keep');
});

test('대체 종목: 같은 주동근, 불편 부위 충돌 적은 것 우선', () => {
  const alts = alternativesFor('bb_squat', { ...gymProfile, injuries: ['knee'] });
  assert.ok(alts.length > 0);
  for (const a of alts) assert.ok(a.primary.some((m) => squat.primary.includes(m)));
  assert.ok(!alts[0]!.stressedJoints.includes('knee'), alts[0]!.id);
});

// ── 개인화: 직업, 성별, 집중 부위 ──

test('직업: 사무직은 상부 등·후면 삼각근·승모 목표 증가 (목·어깨 통증 완화 근거)', () => {
  const desk = weeklyTargets({ ...gymProfile, workActivity: 'sedentary' });
  const base = weeklyTargets(gymProfile);
  for (const m of ['upperBack', 'rearDelts', 'traps'] as const) assert.ok(desk[m] > base[m], m);
  assert.equal(desk.chest, base.chest);
  const v = weeklyVolume(generateProgram({ ...gymProfile, workActivity: 'sedentary' }));
  const vb = weeklyVolume(generateProgram(gymProfile));
  assert.ok(v.upperBack.sets + v.rearDelts.sets > vb.upperBack.sets + vb.rearDelts.sets);
});

test('직업: 육체노동·교대근무는 총 볼륨 감소', () => {
  const sum = (p: Profile) => Object.values(weeklyTargets(p)).reduce((a, b) => a + b, 0);
  assert.ok(sum({ ...gymProfile, workActivity: 'manual' }) < sum(gymProfile));
  assert.ok(sum({ ...gymProfile, workActivity: 'manual', shiftWork: true }) < sum({ ...gymProfile, workActivity: 'manual' }));
});

test('성별: 프로그램 생성에 영향 없음 (상대적 적응이 남녀 비슷하다는 근거)', () => {
  const m = generateProgram({ ...gymProfile, sex: 'male' });
  const f = generateProgram({ ...gymProfile, sex: 'female' });
  assert.deepEqual(m, f);
});

test('집중 부위: 해당 부위 전용 종목이 들어감', () => {
  const p = generateProgram({ ...gymProfile, focusMuscles: ['glutes'] });
  const lowerDays = p.days.filter((d) => d.focus.includes('glutes'));
  for (const d of lowerDays) {
    assert.ok(d.exercises.some((pe) => {
      const ex = EXERCISE_BY_ID.get(pe.exerciseId)!;
      return ex.primary.length === 1 && ex.primary[0] === 'glutes';
    }), d.name);
  }
});

// ── 무게 추천 ──

test('무게 추천: 상한 달성 + 여유 → 증량', () => {
  const r = recommendNext(bench, plan, [
    { weightKg: 60, reps: 12, rpe: 8 }, { weightKg: 60, reps: 12, rpe: 8 }, { weightKg: 60, reps: 12, rpe: 8 },
  ]);
  assert.equal(r.action, 'increase');
  assert.equal(r.weightKg, 62.5);
  assert.equal(r.targetReps, 8);
});

test('무게 추천: 계획 세트를 다 못 채웠으면 증량하지 않음', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 12, rpe: 8 }, { weightKg: 60, reps: 12, rpe: 8 }]);
  assert.equal(r.action, 'repeat');
  assert.equal(r.weightKg, 60);
});

test('무게 추천: 맨몸(무게 0) 종목은 상한 달성해도 무게를 추천하지 않음', () => {
  const r = recommendNext(bench, { ...plan, sets: 2 }, [{ weightKg: 0, reps: 12, rpe: 7 }, { weightKg: 0, reps: 12, rpe: 7 }]);
  assert.equal(r.weightKg, 0);
  assert.notEqual(r.action, 'increase');
});

test('무게 추천: 하체 컴파운드는 5kg 증량, 웜업은 무시', () => {
  const r = recommendNext(squat, { ...plan, exerciseId: 'bb_squat', sets: 2 }, [
    { weightKg: 40, reps: 8, isWarmup: true },
    { weightKg: 100, reps: 12, rpe: 7 }, { weightKg: 100, reps: 12, rpe: 8 },
  ]);
  assert.equal(r.weightKg, 105);
});

test('무게 추천: 상한 달성했지만 힘듦 → 같은 무게 반복', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 12, rpe: 9.5 }, { weightKg: 60, reps: 12, rpe: 9.5 }]);
  assert.equal(r.action, 'repeat');
});

test('무게 추천: 범위 안 → 반복 +1, 실패 세트가 있어도 디로드하지 않음', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 10, rpe: 10 }, { weightKg: 60, reps: 9, rpe: 10 }]);
  assert.equal(r.action, 'addReps');
  assert.equal(r.weightKg, 60);
  assert.equal(r.targetReps, 10);
});

test('무게 추천: 하한 미달 1회 → 유지, 2회 연속 → 10% 디로드', () => {
  const miss = [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 6, rpe: 10 }];
  assert.equal(recommendNext(bench, plan, miss).action, 'repeat');
  assert.equal(recommendNext(bench, plan, miss, [{ weightKg: 60, reps: 10 }]).action, 'repeat');
  const r = recommendNext(bench, plan, miss, [{ weightKg: 60, reps: 7 }]);
  assert.equal(r.action, 'deload');
  assert.equal(r.weightKg, 55);
});

test('무게 추천: 기록 없음 → 콜드스타트, 1RM 입력 시 현실적 무게', () => {
  assert.equal(recommendNext(bench, plan, []).action, 'coldStart');
  const w = coldStartWeight(bench, plan, 100);
  assert.ok(w >= 65 && w <= 75, String(w));
});

// ── 웜업, 회복도, 스트릭 ──

test('웜업 세트: 40/60/80%, 빈 봉 미만 생략', () => {
  assert.deepEqual(warmupSets(100).map((s) => s.weightKg), [40, 60, 80]);
  assert.deepEqual(warmupSets(40).map((s) => s.weightKg), [25, 32.5]);
});

test('회복도: 직후 낮고 시간이 지나면 회복, 미사용 부위 100%', () => {
  const now = new Date('2026-11-18T12:00:00Z');
  const sets = Array.from({ length: 8 }, () => ({ exercise: bench, completedAt: new Date('2026-11-18T11:00:00Z') }));
  const r = recoveryByMuscle(sets, now);
  assert.ok(r.chest < 30, String(r.chest));
  assert.ok(r.triceps > r.chest);
  assert.equal(r.quads, 100);
  const later = recoveryByMuscle(sets, new Date('2026-11-21T12:00:00Z'));
  assert.ok(later.chest > 85, String(later.chest));
});

test('회복도: 초보자·육체노동은 더 느리게, 실패 세트는 피로 가중', () => {
  const t0 = new Date('2026-11-18T00:00:00Z');
  const t48 = new Date('2026-11-20T00:00:00Z');
  const sets = Array.from({ length: 8 }, () => ({ exercise: bench, completedAt: t0 }));
  const base = recoveryByMuscle(sets, t48).chest;
  assert.ok(recoveryByMuscle(sets, t48, { experience: 'beginner' }).chest < base);
  assert.ok(recoveryByMuscle(sets, t48, { workActivity: 'manual', shiftWork: true }).chest < base);
  const failed = sets.map((s) => ({ ...s, rpe: 10 }));
  assert.ok(recoveryByMuscle(failed, t48).chest < base);
});

test('주간 스트릭: 진행 중인 주는 미달이어도 끊기지 않음', () => {
  const now = new Date(2026, 10, 18); // 수요일
  const d = (m: number, day: number) => new Date(2026, m, day);
  const sessions = [
    d(10, 9), d(10, 11), d(10, 13),
    d(10, 3), d(10, 5), d(10, 7),
    d(9, 27),
    d(10, 17),
  ];
  assert.equal(weeklyStreak(sessions, 3, now), 2);
  assert.equal(weeklyStreak([...sessions, d(10, 18), d(10, 18)], 3, now), 3);
});

// ── 게임화 ──
import { ACHIEVEMENTS, levelFromXp, muscleXp, rankOf, setXp, weekCleared, weeklyQuests, xpToNext } from '../src/index.ts';

test('XP: 주동근 10, 보조근 5, 쉬운 세트(RPE<7) 절반, 웜업 0', () => {
  assert.deepEqual(setXp({ exercise: bench }), { chest: 10, triceps: 5, frontDelts: 5 });
  assert.equal(setXp({ exercise: bench, rpe: 6 }).chest, 5);
  assert.equal(setXp({ exercise: bench, rpe: 10 }).chest, 10);
  assert.deepEqual(setXp({ exercise: bench, isWarmup: true }), {});
  assert.equal(muscleXp([{ exercise: bench }, { exercise: bench }]).chest, 20);
});

test('레벨: 경계값과 랭크', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, into: 0, need: 100 });
  assert.equal(levelFromXp(99).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  assert.equal(levelFromXp(100 + xpToNext(2)).level, 3);
  assert.equal(rankOf(1).name, '입문');
  assert.equal(rankOf(12).name, '중급');
});

test('주간 퀘스트: 목표는 프로그램 주간 목표에서, 진행도는 이번 주 볼륨에서', () => {
  const program = generateProgram(gymProfile);
  const zero = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  const empty = weeklyQuests(program, 4, { volume: zero, sessions: 0, prs: 0 });
  assert.equal(empty.length, 7);
  assert.ok(empty.every((q) => !q.done));
  const chestQ = empty.find((q) => q.id === 'vol-chest')!;
  assert.equal(chestQ.target, Math.round(program.weeklyTargets.chest));

  const full = { ...zero };
  for (const m of ALL_MUSCLES) full[m] = program.weeklyTargets[m];
  const qs = weeklyQuests(program, 4, { volume: full, sessions: 4, prs: 0 });
  assert.ok(qs.filter((q) => q.kind === 'volume').every((q) => q.done));
  assert.ok(weekCleared(qs));
  assert.ok(!weekCleared(weeklyQuests(program, 4, { volume: full, sessions: 3, prs: 0 })));
});

test('업적: id 중복 없음, 조건 판정', () => {
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  const s = { sessions: 1, totalSets: 0, prs: 0, bestStreak: 0, maxMuscleLevel: 1, clearedWeeks: 0, painFreeLight: 0 };
  assert.deepEqual(ACHIEVEMENTS.filter((a) => a.test(s)).map((a) => a.id), ['first']);
});

// ── 가이드 콘텐츠 ──
import { GUIDES, MUSCLE_INFO } from '../src/index.ts';

test('가이드: 모든 종목에 준비·동작·자극·실수가 있음', () => {
  for (const e of EXERCISES) {
    const g = GUIDES[e.id];
    assert.ok(g, `가이드 없음: ${e.id}`);
    assert.ok(g.setup.length && g.steps.length && g.feel && g.mistakes.length, e.id);
  }
  assert.deepEqual(Object.keys(GUIDES).filter((id) => !EXERCISE_BY_ID.has(id)), []);
});

test('근육 정보: 16개 부위 모두', () => {
  for (const m of ALL_MUSCLES) assert.ok(MUSCLE_INFO[m].anatomy && MUSCLE_INFO[m].actions.length, m);
});

test('기구: 고를 수 있는 모든 기구가 최소 1개 종목에 쓰임', () => {
  for (const q of ALL_EQUIPMENT) assert.ok(EXERCISES.some((e) => e.equipment.includes(q)), q);
});

test('기구: 작은 헬스장(덤벨·벤치·케이블·랫풀다운·철봉)도 주요 부위 루틴 생성', () => {
  const small: Profile = { ...gymProfile, equipment: ['dumbbell', 'bench', 'cable', 'latPulldown', 'pullupBar'] };
  const p = generateProgram(small);
  const v = weeklyVolume(p);
  for (const m of MAJOR) assert.ok(v[m].sets >= p.weeklyTargets[m] * 0.5, `${m}: ${v[m].sets}`);
  for (const d of p.days) for (const pe of d.exercises) {
    const ex = EXERCISE_BY_ID.get(pe.exerciseId)!;
    assert.ok(ex.equipment.every((q) => q === 'bodyweight' || small.equipment.includes(q)), ex.id);
  }
});

// ── 추천 시작 무게 ──
import { isBodyweightExercise, isPerHand, suggestStartWeight } from '../src/index.ts';

test('시작 무게: 무게를 쓰는 모든 종목에 0보다 큰 추천, 맨몸 종목은 0', () => {
  for (const e of EXERCISES) {
    const s = suggestStartWeight(e, { repMin: 8, repMax: 12 }, gymProfile);
    if (isBodyweightExercise(e)) assert.equal(s.weightKg, 0, e.id);
    else assert.ok(s.weightKg > 0, e.id);
  }
});

test('시작 무게: 현실적인 범위와 보정 방향', () => {
  const p: Profile = { ...gymProfile, experience: 'beginner', sex: 'male', bodyWeightKg: 75 };
  const db = EXERCISE_BY_ID.get('db_bench_press')!;
  const w = suggestStartWeight(db, { repMin: 8, repMax: 12 }, p).weightKg;
  assert.ok(w >= 8 && w <= 16, `db bench ${w}`);
  assert.ok(isPerHand(db));
  const sq = suggestStartWeight(squat, { repMin: 8, repMax: 12 }, p).weightKg;
  assert.ok(sq >= 35 && sq <= 60, `squat ${sq}`);
  assert.ok(suggestStartWeight(squat, { repMin: 8, repMax: 12 }, { ...p, sex: 'female', bodyWeightKg: 55 }).weightKg < sq);
  assert.ok(suggestStartWeight(squat, { repMin: 3, repMax: 5 }, p).weightKg > sq);
  assert.ok(suggestStartWeight(squat, { repMin: 8, repMax: 12 }, { ...p, experience: 'advanced' }).weightKg > sq);
});
