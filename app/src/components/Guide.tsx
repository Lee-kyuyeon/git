import { useState } from 'react';
import type { Muscle } from '@core';
import { ExerciseDetail, MuscleDetail } from './ExerciseSheets.tsx';
import { useStore } from '../store.tsx';
import { completedSessions } from '../logic.ts';
import { muscleLevels } from '../game.ts';

/** 종목 상세 ↔ 근육 도감을 오가는 가이드 레이어. 한 번에 시트 하나만 열림 */
export function useGuide(onSwap?: (id: string) => void) {
  const { data } = useStore();
  const [ex, setEx] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const openExercise = (id: string) => { setMuscle(null); setEx(id); };
  const openMuscle = (m: Muscle) => { setEx(null); setMuscle(m); };
  const levels = muscle ? muscleLevels(completedSessions(data)) : null;
  const layer = (
    <>
      <ExerciseDetail id={ex} onClose={() => setEx(null)} onOpenMuscle={openMuscle}
        onSwap={onSwap ? (id) => { onSwap(id); setEx(null); } : undefined} />
      <MuscleDetail muscle={muscle} onClose={() => setMuscle(null)} onOpenExercise={openExercise}
        level={muscle && levels ? levels[muscle] : undefined} />
    </>
  );
  return { openExercise, openMuscle, exerciseOpen: ex, layer };
}
