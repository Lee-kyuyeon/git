import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISE_BY_ID, EXERCISES, alternativesFor, chooseSplit, estimate1RM, estimateSeconds,
  generateProgram, recommendNext, recoveryByMuscle, warmupSets, weeklyStreak, coldStartWeight,
  type PlannedExercise, type Profile,
} from '../src/index.ts';

const gymProfile: Profile = {
  goal: 'hypertrophy', experience: 'intermediate', daysPerWeek: 4, minutesPerSession: 60,
  equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'bench', 'pullupBar'], injuries: [],
};
const homeProfile: Profile = {
  goal: 'fatLoss', experience: 'beginner', daysPerWeek: 3, minutesPerSession: 40,
  equipment: ['dumbbell', 'band'], injuries: ['knee'],
};
const bench = EXERCISE_BY_ID.get('bb_bench_press')!;
const squat = EXERCISE_BY_ID.get('bb_squat')!;
const plan: PlannedExercise = { exerciseId: 'bb_bench_press', sets: 3, repMin: 8, repMax: 12, restSec: 90 };

test('시드 데이터: id 중복 없음, 모든 부위에 맨몸/밴드 대안 존재', () => {
  assert.equal(new Set(EXERCISES.map((e) => e.id)).size, EXERCISES.length);
  for (const m of ['chest', 'back', 'shoulders', 'triceps', 'glutes', 'core'] as const) {
    assert.ok(EXERCISES.some((e) => e.primary.includes(m) && e.equipment.every((q) => q === 'bodyweight' || q === 'band')), m);
  }
});

test('1RM: 1회는 무게 그대로, 반복이 많을수록 신뢰도 하락', () => {
  assert.equal(estimate1RM(100, 1).value, 100);
  const r5 = estimate1RM(100, 5);
  assert.ok(r5.value > 110 && r5.value < 118);
  assert.equal(r5.confidence, 'high');
  assert.equal(estimate1RM(50, 15).confidence, 'low');
});

test('분할 선택', () => {
  assert.equal(chooseSplit(2), 'fullBody');
  assert.equal(chooseSplit(4), 'upperLower');
  assert.equal(chooseSplit(6), 'pushPullLegs');
});

test('루틴 생성: 헬스장 4회 → 상하체 분할, 시간 예산 준수, 하루 내 중복 없음', () => {
  const p = generateProgram(gymProfile);
  assert.equal(p.split, 'upperLower');
  assert.equal(p.days.length, 4);
  for (const day of p.days) {
    assert.ok(day.exercises.length >= 3, day.name);
    const ids = day.exercises.map((e) => e.exerciseId);
    assert.equal(new Set(ids).size, ids.length);
    const total = day.exercises.reduce((s, e) => s + estimateSeconds(e), 0);
    assert.ok(total <= gymProfile.minutesPerSession * 60, `${day.name} ${total}s`);
  }
  // 상체 A 첫 종목은 컴파운드
  assert.equal(EXERCISE_BY_ID.get(p.days[0]!.exercises[0]!.exerciseId)!.mechanic, 'compound');
});

test('루틴 생성: 홈트 + 무릎 부상 → 보유 기구만, 무릎 부담 종목 제외', () => {
  const p = generateProgram(homeProfile);
  for (const day of p.days) {
    for (const pe of day.exercises) {
      const ex = EXERCISE_BY_ID.get(pe.exerciseId)!;
      assert.ok(ex.equipment.every((q) => ['dumbbell', 'band', 'bodyweight'].includes(q)), ex.id);
      assert.ok(!ex.stressedJoints.includes('knee'), ex.id);
      assert.ok(ex.difficulty <= 2, ex.id);
    }
  }
});

test('루틴 생성: 6회 PPL은 두 번째 사이클에서 다른 종목을 고름', () => {
  const p = generateProgram({ ...gymProfile, daysPerWeek: 6 });
  assert.notDeepEqual(p.days[0]!.exercises.map((e) => e.exerciseId), p.days[3]!.exercises.map((e) => e.exerciseId));
});

test('대체 종목: 같은 주동근, 수행 가능 종목만', () => {
  const alts = alternativesFor('bb_bench_press', homeProfile);
  assert.ok(alts.length > 0);
  for (const a of alts) assert.ok(a.primary.includes('chest'));
  assert.ok(!alts.some((a) => a.equipment.includes('barbell')));
});

test('무게 추천: 상한 달성 + 여유 → 증량', () => {
  const r = recommendNext(bench, plan, [
    { weightKg: 60, reps: 12, rpe: 8 }, { weightKg: 60, reps: 12, rpe: 8 }, { weightKg: 60, reps: 12, rpe: 8 },
  ]);
  assert.equal(r.action, 'increase');
  assert.equal(r.weightKg, 62.5);
  assert.equal(r.targetReps, 8);
});

test('무게 추천: 하체 컴파운드는 5kg 증량, 웜업은 무시', () => {
  const r = recommendNext(squat, { ...plan, exerciseId: 'bb_squat' }, [
    { weightKg: 40, reps: 8, isWarmup: true },
    { weightKg: 100, reps: 12, rpe: 7 }, { weightKg: 100, reps: 12, rpe: 8 },
  ]);
  assert.equal(r.weightKg, 105);
});

test('무게 추천: 상한 달성했지만 힘듦 → 같은 무게 반복', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 12, rpe: 9.5 }, { weightKg: 60, reps: 12, rpe: 9.5 }]);
  assert.equal(r.action, 'repeat');
});

test('무게 추천: 범위 안 → 반복 +1', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 10, rpe: 8 }, { weightKg: 60, reps: 9, rpe: 9 }]);
  assert.equal(r.action, 'addReps');
  assert.equal(r.weightKg, 60);
  assert.equal(r.targetReps, 10);
});

test('무게 추천: 하한 미달 → 10% 디로드', () => {
  const r = recommendNext(bench, plan, [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 6, rpe: 10 }]);
  assert.equal(r.action, 'deload');
  assert.equal(r.weightKg, 55);
});

test('무게 추천: 기록 없음 → 콜드스타트, 1RM 입력 시 현실적 무게', () => {
  assert.equal(recommendNext(bench, plan, []).action, 'coldStart');
  const w = coldStartWeight(bench, plan, 100);
  assert.ok(w >= 65 && w <= 75, String(w));
});

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

test('주간 스트릭: 진행 중인 주는 미달이어도 끊기지 않음', () => {
  const now = new Date(2026, 10, 18); // 수요일
  const d = (m: number, day: number) => new Date(2026, m, day);
  const sessions = [
    d(10, 9), d(10, 11), d(10, 13), // 지난주 3회
    d(10, 3), d(10, 5), d(10, 7), // 2주 전 3회
    d(9, 27), // 3주 전 1회 → 끊김
    d(10, 17), // 이번 주 1회
  ];
  assert.equal(weeklyStreak(sessions, 3, now), 2);
  assert.equal(weeklyStreak([...sessions, d(10, 18), d(10, 18)], 3, now), 3);
});
