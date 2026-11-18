import type { Exercise } from './types.ts';
import { EXTRA_SEEDS } from './exercisesExtra.ts';

type Seed = Omit<Exercise, 'lowerBody' | 'cues'> & { cues?: string[] };

const LOWER = new Set(['quads', 'hamstrings', 'glutes', 'adductors', 'calves']);

const seeds: Seed[] = [
  // 가슴
  { id: 'bb_bench_press', nameKo: '바벨 벤치프레스', nameEn: 'Barbell Bench Press', primary: ['chest'], secondary: ['triceps', 'frontDelts'], equipment: ['barbell', 'bench'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'wrist'], lengthBias: 'mid', cues: ['견갑을 모으고 가슴을 연다', '바는 명치 위로 내린다', '발로 바닥을 민다'] },
  { id: 'db_bench_press', nameKo: '덤벨 벤치프레스', nameEn: 'Dumbbell Bench Press', primary: ['chest'], secondary: ['triceps', 'frontDelts'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'lengthened', cues: ['팔꿈치는 몸통과 45도', '가슴 옆까지 충분히 내린다'] },
  { id: 'incline_db_press', nameKo: '인클라인 덤벨 프레스', nameEn: 'Incline Dumbbell Press', primary: ['chest'], secondary: ['frontDelts', 'triceps'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'lengthened' },
  { id: 'machine_chest_press', nameKo: '머신 체스트프레스', nameEn: 'Machine Chest Press', primary: ['chest'], secondary: ['triceps', 'frontDelts'], equipment: ['machine'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'push_up', nameKo: '푸시업', nameEn: 'Push-up', primary: ['chest'], secondary: ['triceps', 'frontDelts', 'core'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['wrist'], lengthBias: 'mid', cues: ['머리부터 발끝까지 일직선', '가슴이 바닥에 닿을 듯 내린다'] },
  { id: 'cable_fly', nameKo: '케이블 플라이', nameEn: 'Cable Fly', primary: ['chest'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'mid' },
  { id: 'db_fly', nameKo: '덤벨 플라이', nameEn: 'Dumbbell Fly', primary: ['chest'], secondary: [], equipment: ['dumbbell', 'bench'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'lengthened' },
  { id: 'band_chest_press', nameKo: '밴드 체스트프레스', nameEn: 'Band Chest Press', primary: ['chest'], secondary: ['triceps', 'frontDelts'], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },

  // 광배근
  { id: 'pull_up', nameKo: '풀업', nameEn: 'Pull-up', primary: ['lats'], secondary: ['biceps', 'upperBack'], equipment: ['pullupBar'], mechanic: 'compound', difficulty: 3, stressedJoints: ['shoulder', 'elbow'], lengthBias: 'lengthened', cues: ['가슴을 바에 가져간다는 느낌', '반동 없이'] },
  { id: 'lat_pulldown', nameKo: '랫 풀다운', nameEn: 'Lat Pulldown', primary: ['lats'], secondary: ['biceps', 'upperBack'], equipment: ['cable'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened', cues: ['바를 쇄골 쪽으로 당긴다', '어깨를 으쓱하지 않는다'] },
  { id: 'band_lat_pulldown', nameKo: '밴드 랫 풀다운', nameEn: 'Band Lat Pulldown', primary: ['lats'], secondary: ['biceps'], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'db_pullover', nameKo: '덤벨 풀오버', nameEn: 'Dumbbell Pullover', primary: ['lats'], secondary: ['chest', 'triceps'], equipment: ['dumbbell', 'bench'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'lengthened' },
  { id: 'straight_arm_pulldown', nameKo: '스트레이트 암 풀다운', nameEn: 'Straight-arm Pulldown', primary: ['lats'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },

  // 상부 등
  { id: 'bb_row', nameKo: '바벨 로우', nameEn: 'Barbell Row', primary: ['upperBack'], secondary: ['lats', 'biceps', 'rearDelts'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['lowerBack'], lengthBias: 'mid' },
  { id: 'db_row', nameKo: '원암 덤벨 로우', nameEn: 'One-arm Dumbbell Row', primary: ['upperBack'], secondary: ['lats', 'biceps', 'rearDelts'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'seated_cable_row', nameKo: '시티드 케이블 로우', nameEn: 'Seated Cable Row', primary: ['upperBack'], secondary: ['lats', 'biceps', 'rearDelts'], equipment: ['cable'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened' },
  { id: 'band_row', nameKo: '밴드 로우', nameEn: 'Band Row', primary: ['upperBack'], secondary: ['lats', 'biceps', 'rearDelts'], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'inverted_row', nameKo: '인버티드 로우', nameEn: 'Inverted Row', primary: ['upperBack'], secondary: ['lats', 'biceps', 'rearDelts'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 2, stressedJoints: [], lengthBias: 'mid' },
  { id: 'db_shrug', nameKo: '덤벨 슈러그', nameEn: 'Dumbbell Shrug', primary: ['traps'], secondary: ['forearms'], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },

  // 어깨
  { id: 'ohp', nameKo: '오버헤드 프레스', nameEn: 'Overhead Press', primary: ['frontDelts'], secondary: ['triceps', 'sideDelts', 'core'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'lowerBack'], lengthBias: 'mid' },
  { id: 'db_shoulder_press', nameKo: '덤벨 숄더프레스', nameEn: 'Dumbbell Shoulder Press', primary: ['frontDelts'], secondary: ['triceps', 'sideDelts'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder'], lengthBias: 'mid' },
  { id: 'machine_shoulder_press', nameKo: '머신 숄더프레스', nameEn: 'Machine Shoulder Press', primary: ['frontDelts'], secondary: ['triceps', 'sideDelts'], equipment: ['machine'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'pike_push_up', nameKo: '파이크 푸시업', nameEn: 'Pike Push-up', primary: ['frontDelts'], secondary: ['triceps'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 2, stressedJoints: ['shoulder', 'wrist'], lengthBias: 'mid' },
  { id: 'db_lateral_raise', nameKo: '덤벨 사이드 레터럴 레이즈', nameEn: 'Dumbbell Lateral Raise', primary: ['sideDelts'], secondary: [], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'shortened', cues: ['팔꿈치를 살짝 굽힌다', '어깨 높이까지만'] },
  { id: 'cable_lateral_raise', nameKo: '케이블 레터럴 레이즈', nameEn: 'Cable Lateral Raise', primary: ['sideDelts'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened' },
  { id: 'band_lateral_raise', nameKo: '밴드 레터럴 레이즈', nameEn: 'Band Lateral Raise', primary: ['sideDelts'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'face_pull', nameKo: '페이스 풀', nameEn: 'Face Pull', primary: ['rearDelts'], secondary: ['upperBack', 'traps'], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'rear_delt_fly', nameKo: '벤트오버 리어 델트 플라이', nameEn: 'Bent-over Rear Delt Fly', primary: ['rearDelts'], secondary: ['upperBack'], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'reverse_pec_deck', nameKo: '리버스 펙덱', nameEn: 'Reverse Pec Deck', primary: ['rearDelts'], secondary: ['upperBack'], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'band_pull_apart', nameKo: '밴드 풀 어파트', nameEn: 'Band Pull-apart', primary: ['rearDelts'], secondary: ['upperBack'], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },

  // 팔
  { id: 'db_curl', nameKo: '덤벨 컬', nameEn: 'Dumbbell Curl', primary: ['biceps'], secondary: ['forearms'], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'incline_db_curl', nameKo: '인클라인 덤벨 컬', nameEn: 'Incline Dumbbell Curl', primary: ['biceps'], secondary: [], equipment: ['dumbbell', 'bench'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened' },
  { id: 'hammer_curl', nameKo: '해머 컬', nameEn: 'Hammer Curl', primary: ['biceps'], secondary: ['forearms'], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'cable_curl', nameKo: '케이블 컬', nameEn: 'Cable Curl', primary: ['biceps'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'band_curl', nameKo: '밴드 컬', nameEn: 'Band Curl', primary: ['biceps'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'triceps_pushdown', nameKo: '트라이셉스 푸시다운', nameEn: 'Triceps Pushdown', primary: ['triceps'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['elbow'], lengthBias: 'mid' },
  { id: 'overhead_cable_ext', nameKo: '오버헤드 케이블 익스텐션', nameEn: 'Overhead Cable Extension', primary: ['triceps'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['elbow', 'shoulder'], lengthBias: 'lengthened' },
  { id: 'db_overhead_ext', nameKo: '덤벨 오버헤드 익스텐션', nameEn: 'Dumbbell Overhead Extension', primary: ['triceps'], secondary: [], equipment: ['dumbbell'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['elbow', 'shoulder'], lengthBias: 'lengthened' },
  { id: 'close_grip_push_up', nameKo: '내로우 푸시업', nameEn: 'Close-grip Push-up', primary: ['triceps'], secondary: ['chest', 'frontDelts'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['wrist'], lengthBias: 'mid' },
  { id: 'bench_dip', nameKo: '벤치 딥스', nameEn: 'Bench Dip', primary: ['triceps'], secondary: ['chest', 'frontDelts'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['shoulder', 'wrist'], lengthBias: 'mid' },
  { id: 'band_pushdown', nameKo: '밴드 푸시다운', nameEn: 'Band Pushdown', primary: ['triceps'], secondary: [], equipment: ['band'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },

  // 대퇴사두
  { id: 'bb_squat', nameKo: '바벨 백스쿼트', nameEn: 'Barbell Back Squat', primary: ['quads', 'glutes'], secondary: ['adductors', 'core'], equipment: ['barbell'], mechanic: 'compound', difficulty: 3, stressedJoints: ['knee', 'lowerBack'], lengthBias: 'lengthened', cues: ['무릎은 발끝 방향', '허리 중립 유지', '고관절과 무릎을 함께 접는다'] },
  { id: 'goblet_squat', nameKo: '고블릿 스쿼트', nameEn: 'Goblet Squat', primary: ['quads', 'glutes'], secondary: ['adductors', 'core'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'], lengthBias: 'lengthened' },
  { id: 'leg_press', nameKo: '레그 프레스', nameEn: 'Leg Press', primary: ['quads', 'glutes'], secondary: ['adductors'], equipment: ['machine'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'], lengthBias: 'mid' },
  { id: 'db_split_squat', nameKo: '불가리안 스플릿 스쿼트', nameEn: 'Bulgarian Split Squat', primary: ['quads', 'glutes'], secondary: ['adductors'], equipment: ['dumbbell', 'bench'], mechanic: 'compound', difficulty: 2, stressedJoints: ['knee'], lengthBias: 'lengthened' },
  { id: 'db_lunge', nameKo: '덤벨 런지', nameEn: 'Dumbbell Lunge', primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['knee'], lengthBias: 'lengthened' },
  { id: 'bw_squat', nameKo: '맨몸 스쿼트', nameEn: 'Bodyweight Squat', primary: ['quads', 'glutes'], secondary: ['adductors'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: ['knee'], lengthBias: 'mid' },
  { id: 'box_squat', nameKo: '박스 스쿼트 (얕은 깊이)', nameEn: 'Box Squat (partial depth)', primary: ['quads', 'glutes'], secondary: [], equipment: ['bench'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'mid', cues: ['통증 없는 깊이의 박스/벤치를 쓴다', '앉았다가 천천히 일어선다'] },
  { id: 'wall_sit', nameKo: '월 싯', nameEn: 'Wall Sit', primary: ['quads'], secondary: ['glutes'], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid', cues: ['통증 없는 무릎 각도에서 버틴다', '반복 수 대신 초 단위 (반복 1회 = 3초)'] },
  { id: 'leg_extension', nameKo: '레그 익스텐션', nameEn: 'Leg Extension', primary: ['quads'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['knee'], lengthBias: 'mid', cues: ['등받이를 뒤로 젖히면 대퇴직근이 더 늘어난다'] },

  // 햄스트링·둔근·내전근
  { id: 'rdl', nameKo: '루마니안 데드리프트', nameEn: 'Romanian Deadlift', primary: ['hamstrings', 'glutes'], secondary: ['upperBack', 'forearms'], equipment: ['barbell'], mechanic: 'compound', difficulty: 2, stressedJoints: ['lowerBack'], lengthBias: 'lengthened', cues: ['엉덩이를 뒤로 뺀다', '바는 다리에 붙여 내린다'] },
  { id: 'db_rdl', nameKo: '덤벨 루마니안 데드리프트', nameEn: 'Dumbbell RDL', primary: ['hamstrings', 'glutes'], secondary: ['forearms'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: ['lowerBack'], lengthBias: 'lengthened' },
  { id: 'single_leg_rdl', nameKo: '싱글 레그 루마니안 데드리프트', nameEn: 'Single-leg RDL', primary: ['hamstrings', 'glutes'], secondary: ['core'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 2, stressedJoints: [], lengthBias: 'lengthened' },
  { id: 'seated_leg_curl', nameKo: '시티드 레그 컬', nameEn: 'Seated Leg Curl', primary: ['hamstrings'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened', cues: ['상체를 살짝 숙이면 햄스트링이 더 늘어난다'] },
  { id: 'leg_curl', nameKo: '라잉 레그 컬', nameEn: 'Lying Leg Curl', primary: ['hamstrings'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'band_good_morning', nameKo: '밴드 굿모닝', nameEn: 'Band Good Morning', primary: ['hamstrings', 'glutes'], secondary: [], equipment: ['band'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'glute_bridge', nameKo: '글루트 브릿지', nameEn: 'Glute Bridge', primary: ['glutes'], secondary: ['hamstrings'], equipment: ['bodyweight'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'hip_thrust', nameKo: '바벨 힙 쓰러스트', nameEn: 'Barbell Hip Thrust', primary: ['glutes'], secondary: ['hamstrings', 'quads'], equipment: ['barbell', 'bench'], mechanic: 'compound', difficulty: 2, stressedJoints: [], lengthBias: 'shortened' },
  { id: 'hip_adduction', nameKo: '힙 어덕션 머신', nameEn: 'Hip Adduction Machine', primary: ['adductors'], secondary: [], equipment: ['machine'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'copenhagen_plank', nameKo: '코펜하겐 플랭크', nameEn: 'Copenhagen Plank', primary: ['adductors'], secondary: ['core'], equipment: ['bench'], mechanic: 'isolation', difficulty: 2, stressedJoints: [], lengthBias: 'mid' },
  { id: 'calf_raise', nameKo: '카프 레이즈', nameEn: 'Calf Raise', primary: ['calves'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'lengthened', cues: ['계단 끝에서 뒤꿈치를 충분히 내린다', '바닥에서 1~2초 멈춘다'] },

  // 코어·전완
  { id: 'plank', nameKo: '플랭크', nameEn: 'Plank', primary: ['core'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'dead_bug', nameKo: '데드버그', nameEn: 'Dead Bug', primary: ['core'], secondary: [], equipment: ['bodyweight'], mechanic: 'isolation', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
  { id: 'cable_crunch', nameKo: '케이블 크런치', nameEn: 'Cable Crunch', primary: ['core'], secondary: [], equipment: ['cable'], mechanic: 'isolation', difficulty: 1, stressedJoints: ['lowerBack'], lengthBias: 'mid' },
  { id: 'hanging_knee_raise', nameKo: '행잉 니 레이즈', nameEn: 'Hanging Knee Raise', primary: ['core'], secondary: ['forearms'], equipment: ['pullupBar'], mechanic: 'isolation', difficulty: 2, stressedJoints: [], lengthBias: 'mid' },
  { id: 'farmer_carry', nameKo: '파머스 워크', nameEn: "Farmer's Carry", primary: ['forearms', 'traps'], secondary: ['core'], equipment: ['dumbbell'], mechanic: 'compound', difficulty: 1, stressedJoints: [], lengthBias: 'mid' },
];

export const EXERCISES: Exercise[] = [...seeds, ...EXTRA_SEEDS].map((s) => ({
  ...s,
  cues: s.cues ?? [],
  lowerBody: s.primary.some((m) => LOWER.has(m)),
}));

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
