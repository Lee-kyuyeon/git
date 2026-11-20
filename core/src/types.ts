export type Goal = 'hypertrophy' | 'strength' | 'fatLoss' | 'health';
export type Experience = 'beginner' | 'intermediate' | 'advanced';

/**
 * 부위 분류. 종목별 자극 차이를 표현하기 위해 어깨(전면/측면/후면)와 등(광배/상부 등)을 나눴습니다.
 * 이관절근 메모: 대퇴직근(quads), 햄스트링, 삼두 장두, 이두 장두는 관절 각도에 따라 늘어난 정도가 달라집니다.
 */
export type Muscle =
  | 'chest' | 'lats' | 'upperBack' | 'traps'
  | 'frontDelts' | 'sideDelts' | 'rearDelts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'adductors' | 'calves' | 'core';

export const ALL_MUSCLES: Muscle[] = [
  'chest', 'lats', 'upperBack', 'traps', 'frontDelts', 'sideDelts', 'rearDelts',
  'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core',
];

export type Equipment =
  | 'barbell' | 'squatRack' | 'dumbbell' | 'kettlebell' | 'bench'
  | 'pullupBar' | 'dipStation' | 'band'
  | 'cable' | 'latPulldown'
  | 'legPress' | 'hackSquat' | 'legExtension' | 'legCurl' | 'hipMachine' | 'calfMachine'
  | 'chestPressMachine' | 'shoulderPressMachine' | 'pecDeck' | 'rowMachine'
  | 'bodyweight';

/** 기구식 머신 (무게가 핀으로 조절되는 고정 궤도 기구) */
export const MACHINES: Equipment[] = [
  'legPress', 'hackSquat', 'legExtension', 'legCurl', 'hipMachine', 'calfMachine',
  'chestPressMachine', 'shoulderPressMachine', 'pecDeck', 'rowMachine',
];

/** 사용자가 고를 수 있는 모든 기구 (맨몸은 항상 포함이라 제외) */
export const ALL_EQUIPMENT: Equipment[] = [
  'barbell', 'squatRack', 'dumbbell', 'kettlebell', 'bench', 'pullupBar', 'dipStation', 'band',
  'cable', 'latPulldown', ...MACHINES,
];

export type Joint = 'shoulder' | 'lowerBack' | 'knee' | 'wrist' | 'elbow' | 'hip' | 'neck';

/** 근육이 어느 길이에서 가장 큰 부하를 받는지. 늘어난 위치(lengthened) 부하가 근비대에 유리하다는 근거가 늘고 있음 */
export type LengthBias = 'lengthened' | 'mid' | 'shortened';

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
  /** 부담이 큰 관절. 사용자의 불편 부위와 겹치면 후순위로 미루고 강도를 낮춤(제외하지 않음) */
  stressedJoints: Joint[];
  lengthBias: LengthBias;
  /** 하체 컴파운드처럼 증량 폭이 큰 종목 */
  lowerBody: boolean;
  cues: string[];
  /** 설명 출처 (외부 데이터에서 가져온 경우) */
  source?: string;
  /** true면 자동 루틴에는 넣지 않고 도감·직접 추가로만 사용 (특수·보조·고난도 종목) */
  catalogOnly?: boolean;
}

/**
 * 직업은 직함이 아니라 "몸을 쓰는 방식"으로 받습니다.
 * - sedentary: 사무직 등 대부분 앉아서 일함
 * - standing: 서비스직 등 오래 서 있음
 * - manual: 육체노동 (들기, 나르기 등)
 */
export type WorkActivity = 'sedentary' | 'standing' | 'manual';

export interface Profile {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number; // 2~6
  minutesPerSession: number; // 30~90
  equipment: Equipment[];
  injuries: Joint[];
  workActivity?: WorkActivity;
  /** 교대·야간 근무. 수면 부족으로 회복이 느리다고 보고 볼륨을 낮춤 */
  shiftWork?: boolean;
  /** 더 키우고 싶은 부위 (예: 둔근, 어깨). 해당 부위 주간 목표 세트를 늘림 */
  focusMuscles?: Muscle[];
  /**
   * 성별. 통계/표시용으로만 쓰며 **프로그램 생성에는 사용하지 않습니다.**
   * 근거: 같은 훈련에 대한 상대적 근비대·근력 증가는 남녀가 비슷하고(Roberts 외 2020, Refalo 외 2025),
   * %1RM별 반복 가능 횟수도 성별 영향이 작음(Nuzzo 외 메타회귀). 강조 부위는 focusMuscles로 본인이 고릅니다.
   */
  sex?: 'male' | 'female' | 'unspecified';
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  /** 목표 RPE (10 = 실패) */
  targetRpe: number;
  /** 사용자 불편 부위와 겹치는 관절. 있으면 가벼운 무게, 통증 없는 가동범위로 시작 */
  caution?: Joint[];
}

export interface ProgramDay {
  name: string;
  focus: Muscle[];
  exercises: PlannedExercise[];
}

export interface Program {
  split: 'fullBody' | 'upperLower' | 'upperLowerPpl' | 'pushPullLegs';
  days: ProgramDay[];
  /** 부위별 주간 목표 세트 (fractional) */
  weeklyTargets: Record<Muscle, number>;
}

/** 1~10 RPE. UI에서는 쉬움=7, 적당=8, 힘듦=9, 실패=10 으로 매핑 */
export interface SetLog {
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
}
