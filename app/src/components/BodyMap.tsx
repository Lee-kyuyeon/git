import type { Muscle } from '@core';
import { MUSCLE_KO } from '../labels.ts';

/*
 * 단순화한 인체 근육 지도 (앞/뒤). 해부학 도해가 아니라 위치를 알려주는 아이콘 수준.
 * mode 'target': 주동근 진하게, 보조근 연하게 / mode 'heat': 0~1 값으로 색 농도
 */

type Shape = { m: Muscle; d: string };

const e = (cx: number, cy: number, rx: number, ry: number, rot = 0) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0` + (rot ? '' : '');
const mirror = (m: Muscle, cx: number, cy: number, rx: number, ry: number): Shape[] => [
  { m, d: e(cx, cy, rx, ry) }, { m, d: e(100 - cx, cy, rx, ry) },
];

const FRONT: Shape[] = [
  ...mirror('traps', 41, 31, 5, 3),
  ...mirror('sideDelts', 26, 40, 4, 6),
  ...mirror('frontDelts', 31, 39, 5, 6),
  { m: 'chest', d: 'M 36 44 Q 36 40 49 41 L 49 56 Q 40 59 35 54 Z' },
  { m: 'chest', d: 'M 64 44 Q 64 40 51 41 L 51 56 Q 60 59 65 54 Z' },
  ...mirror('biceps', 26, 58, 4, 8),
  ...mirror('forearms', 23, 80, 3.5, 10),
  { m: 'core', d: 'M 41 60 L 59 60 L 58 92 Q 50 96 42 92 Z' },
  ...mirror('quads', 42, 122, 6.5, 17),
  ...mirror('adductors', 48, 112, 2.5, 9),
  ...mirror('calves', 42, 162, 3.5, 11),
];

const BACK: Shape[] = [
  { m: 'traps', d: 'M 50 27 L 62 36 L 50 50 L 38 36 Z' },
  ...mirror('sideDelts', 26, 40, 4, 6),
  ...mirror('rearDelts', 31, 40, 5, 5.5),
  ...mirror('upperBack', 43, 48, 5, 6),
  { m: 'lats', d: 'M 36 50 Q 34 64 44 80 L 48 70 L 46 54 Z' },
  { m: 'lats', d: 'M 64 50 Q 66 64 56 80 L 52 70 L 54 54 Z' },
  ...mirror('triceps', 26, 58, 4, 8),
  ...mirror('forearms', 23, 80, 3.5, 10),
  ...mirror('glutes', 43, 101, 7, 8),
  ...mirror('hamstrings', 43, 126, 6, 15),
  ...mirror('calves', 43, 160, 4.5, 11),
];

const SILHOUETTE = [
  'M 50 4 a 8 9 0 1 0 0.01 0 Z', // 머리
  'M 44 24 L 56 24 L 57 30 Q 70 32 74 38 L 80 70 L 82 92 L 76 94 L 72 72 L 66 52 L 64 92 L 62 98 L 57 150 L 56 178 L 47 178 L 47 150 L 50 112 L 53 150 L 53 178 L 44 178 L 43 150 L 38 98 L 36 92 L 34 52 L 28 72 L 24 94 L 18 92 L 20 70 L 26 38 Q 30 32 43 30 Z',
];

export function BodyMap({ primary = [], secondary = [], heat, onTap, size = 150 }: {
  primary?: Muscle[];
  secondary?: Muscle[];
  heat?: Partial<Record<Muscle, number>>;
  onTap?: (m: Muscle) => void;
  size?: number;
}) {
  const fill = (m: Muscle) => {
    if (heat) {
      const v = Math.max(0, Math.min(1, heat[m] ?? 0));
      return v === 0 ? 'var(--muscle-off)' : `color-mix(in srgb, var(--accent) ${Math.round(25 + v * 75)}%, var(--muscle-off))`;
    }
    if (primary.includes(m)) return 'var(--accent)';
    if (secondary.includes(m)) return 'color-mix(in srgb, var(--accent) 40%, var(--muscle-off))';
    return 'var(--muscle-off)';
  };
  const view = (shapes: Shape[], label: string) => (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg viewBox="0 0 100 184" width={size * 0.55} height={size} role="img" aria-label={`${label} 근육 지도`}>
        {SILHOUETTE.map((d, i) => <path key={i} d={d} fill="var(--body)" stroke="var(--ink)" strokeWidth={1.2} strokeLinejoin="round" />)}
        {shapes.map((s, i) => (
          <path key={i} d={s.d} fill={fill(s.m)} stroke="var(--ink)" strokeWidth={0.8}
            style={onTap ? { cursor: 'pointer' } : undefined} onClick={onTap ? () => onTap(s.m) : undefined}>
            <title>{MUSCLE_KO[s.m]}</title>
          </path>
        ))}
      </svg>
      <figcaption className="tiny muted">{label}</figcaption>
    </figure>
  );
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
      {view(FRONT, '앞')}
      {view(BACK, '뒤')}
    </div>
  );
}
