import type { Muscle } from './types.ts';

export interface MuscleInfo {
  /** 해부학 이름 (한글 · 라틴어) */
  anatomy: string;
  /** 세부 구성 (갈래, 포함 근육) */
  parts: string[];
  /** 하는 일 (관절 움직임) */
  actions: string[];
  /** 자극을 키우는 요령 */
  tips: string[];
  /** 이관절근 등 길이에 관한 메모 */
  lengthNote?: string;
}

export const MUSCLE_INFO: Record<Muscle, MuscleInfo> = {
  chest: {
    anatomy: '대흉근 · Pectoralis major',
    parts: ['쇄골부 (윗가슴)', '흉골부 (가슴 중앙~아래)'],
    actions: ['팔을 몸 앞으로 모으기 (수평 내전)', '앞으로 밀기', '팔을 앞으로 들기 (쇄골부)'],
    tips: ['견갑골을 모으고 내려 가슴을 편 상태로 밀기', '인클라인(15~30°)은 윗가슴 비중이 커짐', '내릴 때 가슴이 충분히 늘어나도록 깊게'],
  },
  lats: {
    anatomy: '광배근 · Latissimus dorsi',
    parts: ['등 옆쪽~허리까지 넓게 덮는 근육'],
    actions: ['팔을 위에서 아래로 당기기 (어깨 내전)', '팔을 앞에서 뒤로 당기기 (어깨 신전)'],
    tips: ['손이 아니라 팔꿈치를 옆구리·골반 쪽으로 끌어내린다고 생각', '맨 위에서 팔을 충분히 펴 늘어난 상태를 만들기', '어깨를 귀 쪽으로 으쓱하지 않기'],
  },
  upperBack: {
    anatomy: '능형근 · 승모근 중·하부 · 대원근 · Rhomboids, Mid/Lower trapezius, Teres major',
    parts: ['견갑골 사이 근육들'],
    actions: ['견갑골을 모으기 (후인)', '견갑골을 아래로 내리기 (하강)'],
    tips: ['당긴 끝에서 견갑골을 1초 꽉 모으기', '가슴을 들어 등이 굽지 않게', '앉아서 일하는 사람의 굽은 자세 개선에 도움'],
  },
  traps: {
    anatomy: '승모근 상부 · Upper trapezius',
    parts: ['목 옆~어깨 위'],
    actions: ['어깨를 귀 쪽으로 올리기 (견갑 거상)', '견갑골을 위로 회전'],
    tips: ['턱을 당기고 목을 중립으로', '어깨를 돌리지 말고 수직으로 올렸다 내리기'],
  },
  frontDelts: {
    anatomy: '삼각근 전면 · Anterior deltoid',
    parts: ['어깨 앞쪽'],
    actions: ['팔을 앞으로 들기 (어깨 굴곡)', '머리 위로 밀기, 가슴 운동 보조'],
    tips: ['벤치·숄더프레스에서 이미 많이 쓰여 따로 할 필요는 적음'],
  },
  sideDelts: {
    anatomy: '삼각근 측면 · Lateral deltoid',
    parts: ['어깨 바깥쪽 (어깨 너비를 만드는 부분)'],
    actions: ['팔을 옆으로 들기 (어깨 외전)'],
    tips: ['프레스만으로는 자극이 적어 레터럴 레이즈가 필요', '새끼손가락이 아니라 팔꿈치로 들어 올린다고 생각', '가벼운 무게로 반동 없이'],
  },
  rearDelts: {
    anatomy: '삼각근 후면 · Posterior deltoid',
    parts: ['어깨 뒤쪽'],
    actions: ['팔을 뒤·옆으로 벌리기 (수평 외전)'],
    tips: ['앞쪽(가슴·전면 삼각근)과 균형을 맞춰 어깨 건강에 중요', '견갑골은 고정하고 팔만 벌리기'],
  },
  biceps: {
    anatomy: '상완이두근 · 상완근 · Biceps brachii, Brachialis',
    parts: ['장두 (바깥쪽)', '단두 (안쪽)', '상완근 (이두 아래 깊은 근육)'],
    actions: ['팔꿈치 굽히기', '손바닥을 위로 돌리기 (회외)'],
    tips: ['팔꿈치를 몸통 옆에 고정', '내릴 때 끝까지 펴기'],
    lengthNote: '장두는 어깨관절도 지나는 이관절근 → 팔을 몸 뒤에 두면(인클라인 컬) 더 늘어난 상태에서 자극',
  },
  triceps: {
    anatomy: '상완삼두근 · Triceps brachii',
    parts: ['장두 (안쪽 뒤, 가장 큼)', '외측두 (바깥쪽)', '내측두 (깊은 곳)'],
    actions: ['팔꿈치 펴기', '장두는 팔을 뒤로 당기는 것도 도움'],
    tips: ['팔꿈치를 고정하고 펴기', '끝까지 펴서 1초 수축'],
    lengthNote: '장두는 이관절근 → 팔을 머리 위로 든 오버헤드 익스텐션이 푸시다운보다 삼두 성장이 컸다는 연구가 있음',
  },
  forearms: {
    anatomy: '전완근 · Forearm flexors/extensors, Brachioradialis',
    parts: ['손목 굽힘근', '손목 폄근', '완요골근 (해머 컬에서 많이 쓰임)'],
    actions: ['쥐기', '손목 굽히기·펴기', '팔꿈치 굽히기 보조'],
    tips: ['데드리프트·로우·파머스 워크에서 쥐는 힘으로 자연히 단련'],
  },
  quads: {
    anatomy: '대퇴사두근 · Quadriceps',
    parts: ['대퇴직근 (가운데, 이관절근)', '외측광근 (바깥)', '내측광근 (무릎 안쪽 위 물방울 모양)', '중간광근 (깊은 곳)'],
    actions: ['무릎 펴기', '대퇴직근은 다리를 앞으로 들기도'],
    tips: ['스쿼트는 무릎이 발끝 방향으로 충분히 나가도 괜찮음 (통증 없을 때)', '깊게 앉을수록 늘어난 상태 자극'],
    lengthNote: '대퇴직근은 스쿼트·레그프레스로는 잘 안 크고 레그 익스텐션에서 성장이 컸다는 연구가 있음',
  },
  hamstrings: {
    anatomy: '햄스트링 · Hamstrings',
    parts: ['대퇴이두근 (바깥)', '반건양근 · 반막양근 (안쪽)'],
    actions: ['무릎 굽히기', '고관절 펴기 (엉덩이를 앞으로 밀기)'],
    tips: ['루마니안 데드리프트는 엉덩이를 뒤로 빼며 허벅지 뒤가 당길 때까지', '레그컬은 엉덩이가 들리지 않게'],
    lengthNote: '이관절근 → 앉아서 하는 시티드 레그컬이 엎드려 하는 것보다 성장이 컸다는 연구가 있음',
  },
  glutes: {
    anatomy: '대둔근 · 중둔근 · Gluteus maximus/medius',
    parts: ['대둔근 (엉덩이 대부분)', '중둔근 (엉덩이 위 옆)'],
    actions: ['고관절 펴기 (엉덩이 앞으로 밀기)', '다리를 바깥으로 벌리기 (중둔근)', '한 발 설 때 골반 안정'],
    tips: ['깊은 스쿼트·런지는 늘어난 상태, 힙 쓰러스트는 수축 상태 자극', '골반을 살짝 말아(후방경사) 허리 대신 엉덩이로'],
  },
  adductors: {
    anatomy: '내전근군 · Adductors',
    parts: ['대내전근 (가장 큼)', '장내전근 · 단내전근', '박근'],
    actions: ['다리를 안쪽으로 모으기', '대내전근은 고관절 펴기도 도움 (스쿼트 바닥에서)'],
    tips: ['깊은 스쿼트에서도 많이 쓰임'],
  },
  calves: {
    anatomy: '비복근 · 가자미근 · Gastrocnemius, Soleus',
    parts: ['비복근 (겉, 이관절근)', '가자미근 (속)'],
    actions: ['발끝으로 서기 (발목 저측굴곡)'],
    tips: ['바닥에서 1~2초 멈춰 반동 없애기', '무릎 펴고 하면 비복근, 굽히고 하면 가자미근 비중↑'],
  },
  core: {
    anatomy: '복직근 · 복사근 · 복횡근 · Rectus abdominis, Obliques, Transversus',
    parts: ['복직근 (식스팩)', '외·내복사근 (옆구리)', '복횡근 (깊은 곳, 복대 역할)'],
    actions: ['몸통 굽히기', '몸통 회전·옆으로 굽힘', '허리가 꺾이지 않게 버티기'],
    tips: ['갈비뼈를 골반 쪽으로 내린다고 생각', '허리가 바닥에서 뜨지 않게'],
  },
};
