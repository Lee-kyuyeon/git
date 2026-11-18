import type { Exercise } from './types.ts';

type Seed = Omit<Exercise, 'lowerBody' | 'cues'> & { cues?: string[] };

const LOWER = new Set(['quads', 'hamstrings', 'glutes', 'calves']);

const seeds: Seed[] = [
  // 가슴
  { id: 'bb_bench_press', nameKo: '바벨 벤치프레스', nameEn: 'Barbell Bench Press', primary: ['chest'], secondary: ['triceps', 'shoulders'], equipment: ['barbell', 'bench'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'wrist'], cues: ['견갑을 모으고 가슴을 연다', '바는 명치 위로 내린다', '발로 바닥을 민다'] },
  { id: 'db_bench_press', nameKo: '덤벨 벤치프레스', nameEn: 'Dumbbell Bench Press', primary: ['chest'], secondary: ['triceps', 'shoulders'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder'], cues: ['팔꿈치는 몸통과 45도', '가슴 옆까지 충분히 내린다'] },
  { id: 'machine_chest_press', nameKo: '머신 체스트프레스', nameEn: 'Machine Chest Press', primary: ['chest'], secondary: ['triceps'], equipment: ['machine'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'push_up', nameKo: '푸시업', nameEn: 'Push-up', primary: ['chest'], secondary: ['triceps', 'shoulders', 'core'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['wrist'], cues: ['머리부터 발끝까지 일직선', '가슴이 바닥에 닿을 듯 내린다'] },
  { id: 'cable_fly', nameKo: '케이블 플라이', nameEn: 'Cable Fly', primary: ['chest'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['shoulder'] },
  { id: 'db_fly', nameKo: '덤벨 플라이', nameEn: 'Dumbbell Fly', primary: ['chest'], secondary: [], equipment: ['dumbbell', 'bench'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['shoulder'] },
  { id: 'band_chest_press', nameKo: '밴드 체스트프레스', nameEn: 'Band Chest Press', primary: ['chest'], secondary: ['triceps'], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },

  // 등
  { id: 'pull_up', nameKo: '풀업', nameEn: 'Pull-up', primary: ['back'], secondary: ['biceps'], equipment: ['pullupBar'], mechanic: 'compound', difficulty: 3, stressedJoints: ['shoulder', 'elbow'], cues: ['가슴을 바에 가져간다는 느낌', '반동 없이'] },
  { id: 'lat_pulldown', nameKo: '랫 풀다운', nameEn: 'Lat Pulldown', primary: ['back'], secondary: ['biceps'], equipment: ['cable'], mechanic: 'compound', difficulty: 1, stressedJoints: [], cues: ['바를 쇄골 쪽으로 당긴다', '어깨를 으쓱하지 않는다'] },
  { id: 'bb_row', nameKo: '바벨 로우', nameEn: 'Barbell Row', primary: ['back'], secondary: ['biceps', 'hamstrings'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['lowerBack'] },
  { id: 'db_row', nameKo: '원암 덤벨 로우', nameEn: 'One-arm Dumbbell Row', primary: ['back'], secondary: ['biceps'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'seated_cable_row', nameKo: '시티드 케이블 로우', nameEn: 'Seated Cable Row', primary: ['back'], secondary: ['biceps'], equipment: ['cable'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'band_row', nameKo: '밴드 로우', nameEn: 'Band Row', primary: ['back'], secondary: ['biceps'], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'inverted_row', nameKo: '인버티드 로우', nameEn: 'Inverted Row', primary: ['back'], secondary: ['biceps'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 2, stressedJoints: [] },

  // 어깨
  { id: 'ohp', nameKo: '오버헤드 프레스', nameEn: 'Overhead Press', primary: ['shoulders'], secondary: ['triceps', 'core'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'lowerBack'] },
  { id: 'db_shoulder_press', nameKo: '덤벨 숄더프레스', nameEn: 'Dumbbell Shoulder Press', primary: ['shoulders'], secondary: ['triceps'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder'] },
  { id: 'db_lateral_raise', nameKo: '덤벨 사이드 레터럴 레이즈', nameEn: 'Dumbbell Lateral Raise', primary: ['shoulders'], secondary: [], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], cues: ['팔꿈치를 살짝 굽힌다', '어깨 높이까지만'] },
  { id: 'band_lateral_raise', nameKo: '밴드 레터럴 레이즈', nameEn: 'Band Lateral Raise', primary: ['shoulders'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'face_pull', nameKo: '페이스 풀', nameEn: 'Face Pull', primary: ['shoulders'], secondary: ['back'], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'pike_push_up', nameKo: '파이크 푸시업', nameEn: 'Pike Push-up', primary: ['shoulders'], secondary: ['triceps'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'wrist'] },

  // 팔
  { id: 'db_curl', nameKo: '덤벨 컬', nameEn: 'Dumbbell Curl', primary: ['biceps'], secondary: [], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'cable_curl', nameKo: '케이블 컬', nameEn: 'Cable Curl', primary: ['biceps'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'band_curl', nameKo: '밴드 컬', nameEn: 'Band Curl', primary: ['biceps'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'triceps_pushdown', nameKo: '트라이셉스 푸시다운', nameEn: 'Triceps Pushdown', primary: ['triceps'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['elbow'] },
  { id: 'db_overhead_ext', nameKo: '덤벨 오버헤드 익스텐션', nameEn: 'Dumbbell Overhead Extension', primary: ['triceps'], secondary: [], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['elbow', 'shoulder'] },
  { id: 'bench_dip', nameKo: '벤치 딥스', nameEn: 'Bench Dip', primary: ['triceps'], secondary: ['chest'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder', 'wrist'] },
  { id: 'band_pushdown', nameKo: '밴드 푸시다운', nameEn: 'Band Pushdown', primary: ['triceps'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },

  // 하체
  { id: 'bb_squat', nameKo: '바벨 백스쿼트', nameEn: 'Barbell Back Squat', primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], equipment: ['barbell'], mechanic: 'compound', difficulty: 3, stressedJoints: ['knee', 'lowerBack'], cues: ['무릎은 발끝 방향', '허리 중립 유지', '고관절과 무릎을 함께 접는다'] },
  { id: 'goblet_squat', nameKo: '고블릿 스쿼트', nameEn: 'Goblet Squat', primary: ['quads', 'glutes'], secondary: ['core'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'] },
  { id: 'leg_press', nameKo: '레그 프레스', nameEn: 'Leg Press', primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: ['machine'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'] },
  { id: 'bw_squat', nameKo: '맨몸 스쿼트', nameEn: 'Bodyweight Squat', primary: ['quads', 'glutes'], secondary: [], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'] },
  { id: 'leg_extension', nameKo: '레그 익스텐션', nameEn: 'Leg Extension', primary: ['quads'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['knee'] },
  { id: 'rdl', nameKo: '루마니안 데드리프트', nameEn: 'Romanian Deadlift', primary: ['hamstrings', 'glutes'], secondary: ['back'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['lowerBack'], cues: ['엉덩이를 뒤로 뺀다', '바는 다리에 붙여 내린다'] },
  { id: 'db_rdl', nameKo: '덤벨 루마니안 데드리프트', nameEn: 'Dumbbell RDL', primary: ['hamstrings', 'glutes'], secondary: [], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['lowerBack'] },
  { id: 'leg_curl', nameKo: '레그 컬', nameEn: 'Leg Curl', primary: ['hamstrings'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'glute_bridge', nameKo: '글루트 브릿지', nameEn: 'Glute Bridge', primary: ['glutes'], secondary: ['hamstrings'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'hip_thrust', nameKo: '바벨 힙 쓰러스트', nameEn: 'Barbell Hip Thrust', primary: ['glutes'], secondary: ['hamstrings'], equipment: ['barbell', 'bench'], mechanic: 'compound', difficulty: 2, stressedJoints: [] },
  { id: 'db_lunge', nameKo: '덤벨 런지', nameEn: 'Dumbbell Lunge', primary: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['knee'] },
  { id: 'band_good_morning', nameKo: '밴드 굿모닝', nameEn: 'Band Good Morning', primary: ['hamstrings', 'glutes'], secondary: [], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [] },
  { id: 'calf_raise', nameKo: '카프 레이즈', nameEn: 'Calf Raise', primary: ['calves'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },

  // 코어
  { id: 'plank', nameKo: '플랭크', nameEn: 'Plank', primary: ['core'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'dead_bug', nameKo: '데드버그', nameEn: 'Dead Bug', primary: ['core'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [] },
  { id: 'cable_crunch', nameKo: '케이블 크런치', nameEn: 'Cable Crunch', primary: ['core'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['lowerBack'] },
];

export const EXERCISES: Exercise[] = seeds.map((s) => ({
  ...s,
  cues: s.cues ?? [],
  lowerBody: s.primary.some((m) => LOWER.has(m)),
}));

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
