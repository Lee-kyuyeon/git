import type { Equipment } from '@core';

/*
 * 기구 일러스트 (자체 제작 SVG, 64×64).
 * 굵은 잉크 윤곽 + 보라(패드·좌석) + 골드(원판·무게) 로 앱 디자인과 맞춤. 외부 이미지 없음, 용량 수 KB.
 */
const INK = 'var(--ink)';
const PAD = 'var(--accent)';
const W = 'var(--gold)';
const MET = 'var(--surface)';
const s = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const ICONS: Record<Exclude<Equipment, 'bodyweight'>, JSX.Element> = {
  barbell: (<g {...s}>
    <line x1="4" y1="32" x2="60" y2="32" />
    <rect x="10" y="20" width="6" height="24" rx="2" fill={W} /><rect x="16" y="24" width="4" height="16" rx="1.5" fill={W} />
    <rect x="48" y="20" width="6" height="24" rx="2" fill={W} /><rect x="44" y="24" width="4" height="16" rx="1.5" fill={W} />
  </g>),
  squatRack: (<g {...s}>
    <rect x="12" y="6" width="6" height="52" rx="1.5" fill={MET} /><rect x="46" y="6" width="6" height="52" rx="1.5" fill={MET} />
    <line x1="10" y1="58" x2="20" y2="58" /><line x1="44" y1="58" x2="54" y2="58" />
    <line x1="4" y1="24" x2="60" y2="24" />
    <rect x="5" y="17" width="4" height="14" rx="1.5" fill={W} /><rect x="55" y="17" width="4" height="14" rx="1.5" fill={W} />
    <path d="M18 27h4M42 27h4" />
  </g>),
  dumbbell: (<g {...s}>
    <line x1="22" y1="32" x2="42" y2="32" />
    <rect x="10" y="22" width="12" height="20" rx="3" fill={W} /><rect x="42" y="22" width="12" height="20" rx="3" fill={W} />
  </g>),
  kettlebell: (<g {...s}>
    <path d="M22 26 C22 12, 42 12, 42 26" fill="none" strokeWidth={5} />
    <path d="M22 26 C22 12, 42 12, 42 26" fill="none" stroke={MET} strokeWidth={1.5} />
    <ellipse cx="32" cy="40" rx="16" ry="15" fill={W} />
    <line x1="22" y1="55" x2="42" y2="55" />
  </g>),
  bench: (<g {...s}>
    <rect x="8" y="30" width="34" height="7" rx="3" fill={PAD} />
    <rect x="38" y="13" width="7" height="24" rx="3" fill={PAD} transform="rotate(25 41 25)" />
    <path d="M14 37v17M36 37v17M10 54h8M32 54h8" />
  </g>),
  pullupBar: (<g {...s}>
    <line x1="6" y1="16" x2="58" y2="16" strokeWidth={4} />
    <path d="M10 16v-8h6M54 16v-8h-6" />
    <path d="M24 16v6M40 16v6" />
    <circle cx="32" cy="34" r="5" fill={MET} />
    <path d="M24 22l8 7 8-7M32 39v12M27 58l5-7 5 7" />
  </g>),
  dipStation: (<g {...s}>
    <path d="M8 22h22M34 22h22" strokeWidth={4} />
    <path d="M12 22v34M26 22v34M38 22v34M52 22v34M8 56h22M34 56h22" />
    <path d="M12 40h14M38 40h14" />
  </g>),
  band: (<g {...s}>
    <path d="M14 12 C4 30, 4 34, 14 52" fill="none" stroke={PAD} strokeWidth={6} />
    <path d="M50 12 C60 30, 60 34, 50 52" fill="none" stroke={PAD} strokeWidth={6} />
    <path d="M14 12 C26 6, 38 6, 50 12M14 52 C26 58, 38 58, 50 52" fill="none" stroke={PAD} strokeWidth={6} />
    <rect x="25" y="4" width="14" height="6" rx="3" fill={MET} /><rect x="25" y="54" width="14" height="6" rx="3" fill={MET} />
  </g>),
  cable: (<g {...s}>
    <rect x="10" y="6" width="12" height="52" rx="2" fill={MET} />
    <rect x="12" y="34" width="8" height="18" rx="1" fill={W} />
    <circle cx="16" cy="12" r="4" fill={MET} />
    <path d="M20 12 L46 30" />
    <path d="M42 28l8 6-3 4-8-6z" fill={PAD} />
    <line x1="6" y1="58" x2="26" y2="58" />
  </g>),
  latPulldown: (<g {...s}>
    <path d="M12 58V6h40v8" fill="none" />
    <line x1="32" y1="8" x2="32" y2="22" />
    <path d="M14 24 Q32 18 50 24" fill="none" strokeWidth={3.5} />
    <rect x="22" y="44" width="20" height="6" rx="2" fill={PAD} />
    <rect x="24" y="34" width="16" height="5" rx="2" fill={PAD} />
    <path d="M32 50v8M24 58h16" />
    <rect x="46" y="30" width="6" height="16" rx="1" fill={W} />
  </g>),
  legPress: (<g {...s}>
    <path d="M6 54h52" />
    <path d="M10 52 L22 40 L34 52" fill="none" />
    <rect x="10" y="36" width="16" height="6" rx="2" fill={PAD} transform="rotate(-35 18 39)" />
    <path d="M30 40 L50 12" />
    <rect x="44" y="8" width="14" height="10" rx="2" fill={MET} transform="rotate(35 51 13)" />
    <rect x="50" y="22" width="6" height="12" rx="1" fill={W} transform="rotate(35 53 28)" />
  </g>),
  hackSquat: (<g {...s}>
    <path d="M8 58h48" />
    <path d="M14 56 L40 10" />
    <rect x="22" y="14" width="8" height="30" rx="3" fill={PAD} transform="rotate(30 26 29)" />
    <path d="M34 14 l8 3" strokeWidth={4} />
    <rect x="40" y="48" width="18" height="6" rx="1.5" fill={MET} transform="rotate(-20 49 51)" />
  </g>),
  legExtension: (<g {...s}>
    <rect x="12" y="36" width="24" height="7" rx="3" fill={PAD} />
    <rect x="10" y="12" width="7" height="27" rx="3" fill={PAD} />
    <path d="M36 40 L46 48" strokeWidth={3} />
    <rect x="42" y="46" width="12" height="7" rx="3.5" fill={PAD} />
    <path d="M20 43v13M14 56h14" />
    <rect x="50" y="20" width="6" height="14" rx="1" fill={W} />
  </g>),
  legCurl: (<g {...s}>
    <rect x="6" y="30" width="38" height="7" rx="3" fill={PAD} />
    <path d="M44 33 L54 24" strokeWidth={3} />
    <rect x="50" y="18" width="12" height="7" rx="3.5" fill={PAD} />
    <path d="M14 37v17M36 37v17M10 54h8M32 54h8" />
    <rect x="22" y="12" width="6" height="12" rx="1" fill={W} />
  </g>),
  hipMachine: (<g {...s}>
    <rect x="22" y="38" width="20" height="7" rx="3" fill={PAD} />
    <rect x="28" y="12" width="8" height="28" rx="3" fill={PAD} />
    <rect x="8" y="30" width="7" height="16" rx="3" fill={PAD} transform="rotate(-20 11 38)" />
    <rect x="49" y="30" width="7" height="16" rx="3" fill={PAD} transform="rotate(20 52 38)" />
    <path d="M15 40h7M42 40h7M32 45v11M24 56h16" />
  </g>),
  calfMachine: (<g {...s}>
    <path d="M10 58h44" />
    <rect x="20" y="48" width="24" height="8" rx="2" fill={MET} />
    <path d="M14 58V8M50 58V8" />
    <rect x="18" y="12" width="12" height="6" rx="3" fill={PAD} /><rect x="34" y="12" width="12" height="6" rx="3" fill={PAD} />
    <path d="M14 15h4M46 15h4" />
    <rect x="52" y="22" width="6" height="14" rx="1" fill={W} />
  </g>),
  chestPressMachine: (<g {...s}>
    <rect x="8" y="40" width="22" height="7" rx="3" fill={PAD} />
    <rect x="8" y="12" width="8" height="30" rx="3" fill={PAD} />
    <path d="M16 26 H48" strokeWidth={3} /><path d="M48 20v12" strokeWidth={4} />
    <path d="M19 47v9M12 56h14" />
    <rect x="50" y="36" width="8" height="18" rx="1" fill={W} />
  </g>),
  shoulderPressMachine: (<g {...s}>
    <rect x="18" y="42" width="22" height="7" rx="3" fill={PAD} />
    <rect x="18" y="14" width="8" height="30" rx="3" fill={PAD} />
    <path d="M26 16 V8 H44 V16" fill="none" strokeWidth={3} /><path d="M40 16h8" strokeWidth={4} />
    <path d="M29 49v8M22 57h14" />
    <rect x="48" y="34" width="8" height="18" rx="1" fill={W} />
  </g>),
  pecDeck: (<g {...s}>
    <rect x="24" y="42" width="16" height="7" rx="3" fill={PAD} />
    <rect x="28" y="12" width="8" height="32" rx="3" fill={PAD} />
    <path d="M28 18 C16 14, 8 20, 8 30M36 18 C48 14, 56 20, 56 30" fill="none" strokeWidth={3} />
    <rect x="4" y="28" width="8" height="14" rx="3" fill={PAD} /><rect x="52" y="28" width="8" height="14" rx="3" fill={PAD} />
    <path d="M32 49v8M24 57h16" />
  </g>),
  rowMachine: (<g {...s}>
    <rect x="6" y="40" width="20" height="7" rx="3" fill={PAD} />
    <rect x="34" y="18" width="7" height="22" rx="3" fill={PAD} />
    <path d="M26 30 H46" strokeWidth={3} /><path d="M24 24v12" strokeWidth={4} />
    <path d="M16 47v9M10 56h12M41 40v16M36 56h12" />
    <rect x="50" y="22" width="8" height="18" rx="1" fill={W} />
  </g>),
};

export function EquipmentIcon({ id, size = 48 }: { id: Exclude<Equipment, 'bodyweight'>; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      {ICONS[id]}
    </svg>
  );
}
