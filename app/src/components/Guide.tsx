import { lazy, Suspense, useState } from 'react';
import type { Muscle } from '@core';
import { useStore } from '../store.tsx';
import { levelsOf } from '../game.ts';

// 가이드 본문(종목 설명·근육 정보 텍스트)은 처음 열 때 불러옴
const ExerciseDetail = lazy(() => import('./ExerciseSheets.tsx').then((m) => ({ default: m.ExerciseDetail })));
const MuscleDetail = lazy(() => import('./ExerciseSheets.tsx').then((m) => ({ default: m.MuscleDetail })));

/** 종목 상세 ↔ 근육 도감을 오가는 가이드 레이어. 한 번에 시트 하나만 열림 */
export function useGuide(onSwap?: (id: string) => void) {
  const { data } = useStore();
  const [ex, setEx] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const openExercise = (id: string) => { setMuscle(null); setEx(id); };
  const openMuscle = (m: Muscle) => { setEx(null); setMuscle(m); };
  const levels = muscle ? levelsOf(data) : null;
  const layer = (ex || muscle) && (
    <Suspense fallback={null}>
      <ExerciseDetail id={ex} onClose={() => setEx(null)} onOpenMuscle={openMuscle}
        onSwap={onSwap ? (id) => { onSwap(id); setEx(null); } : undefined} />
      <MuscleDetail muscle={muscle} onClose={() => setMuscle(null)} onOpenExercise={openExercise}
        level={muscle && levels ? levels[muscle] : undefined} />
    </Suspense>
  );
  return { openExercise, openMuscle, exerciseOpen: ex, layer };
}
