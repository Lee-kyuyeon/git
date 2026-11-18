export type Goal = 'hypertrophy' | 'strength' | 'fatLoss' | 'health';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

export type Muscle =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'kettlebell'
  | 'band' | 'pullupBar' | 'bench' | 'bodyweight';

export type Joint = 'shoulder' | 'lowerBack' | 'knee' | 'wrist' | 'elbow';

export interface Exercise {
  id: string;
  nameKo: string;
  nameEn: string;
  primary: Muscle[];
  secondary: Muscle[];
  /** 수행에 필요한 기구 전부. bodyweight만 있으면 맨몸 종목 */
  equipment: Equipment[];
  mechanic: 'compound' | 'isolation';
  difficulty: 1 | 2 | 3;
  /** 부담이 큰 관절. 사용자의 불편 부위와 겹치면 제외 */
  stressedJoints: Joint[];
  /** 하체 컴파운드처럼 증량 폭이 큰 종목 */
  lowerBody: boolean;
  cues: string[];
}

export interface Profile {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number; // 2~6
  minutesPerSession: number; // 30~90
  equipment: Equipment[];
  injuries: Joint[];
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
}

export interface ProgramDay {
  name: string;
  focus: Muscle[];
  exercises: PlannedExercise[];
}

export interface Program {
  split: 'fullBody' | 'upperLower' | 'pushPullLegs';
  days: ProgramDay[];
}

/** 1~10 RPE. UI에서는 쉬움=7, 적당=8, 힘듦=9, 실패=10 으로 매핑 */
export interface SetLog {
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
}
