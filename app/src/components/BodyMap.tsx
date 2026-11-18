import type { Muscle } from '@core';
import { MUSCLE_KO } from '../labels.ts';
import { useStore } from '../store.tsx';
import { BODY, type BodySide } from './bodyPaths.ts';

/*
 * 인체 근육 지도 (앞/뒤). 경로 데이터는 react-native-body-highlighter (MIT).
 * mode 'target': 주동근 진하게, 보조근 연하게 / mode 'heat': 0~1 값으로 색 농도
 * 성별을 '여성'으로 고르면 여성 체형 그림을 씀 (표시용일 뿐, 루틴에는 영향 없음)
 */
export function BodyMap({ primary = [], secondary = [], heat, onTap, size = 150 }: {
  primary?: Muscle[];
  secondary?: Muscle[];
  heat?: Partial<Record<Muscle, number>>;
  onTap?: (m: Muscle) => void;
  size?: number;
}) {
  const { data } = useStore();
  const body = BODY[data.profile?.sex === 'female' ? 'female' : 'male'];

  const fill = (ms: Muscle[]) => {
    if (!ms.length) return 'var(--body)';
    if (heat) {
      const v = Math.max(0, Math.min(1, Math.max(...ms.map((m) => heat[m] ?? 0))));
      return v === 0 ? 'var(--muscle-off)' : `color-mix(in srgb, var(--accent) ${Math.round(25 + v * 75)}%, var(--muscle-off))`;
    }
    if (ms.some((m) => primary.includes(m))) return 'var(--accent)';
    if (ms.some((m) => secondary.includes(m))) return 'color-mix(in srgb, var(--accent) 40%, var(--muscle-off))';
    return 'var(--muscle-off)';
  };
  // 겹친 부위(어깨 = 전면/측면 등)를 누르면 강조된 쪽 우선
  const pick = (ms: Muscle[]) => ms.find((m) => primary.includes(m)) ?? ms.find((m) => secondary.includes(m)) ?? ms[0];

  const view = (side: BodySide, label: string) => (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg viewBox={side.viewBox} width={size * 0.5} height={size} role="img" aria-label={`${label} 근육 지도`}>
        {side.shapes.map((s, i) => (
          <path key={i} d={s.d} fill={fill(s.m)} stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round"
            style={onTap && s.m.length ? { cursor: 'pointer' } : undefined}
            onClick={onTap && s.m.length ? () => onTap(pick(s.m)!) : undefined}>
            {s.m.length > 0 && <title>{s.m.map((m) => MUSCLE_KO[m]).join(' · ')}</title>}
          </path>
        ))}
      </svg>
      <figcaption className="tiny muted">{label}</figcaption>
    </figure>
  );
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      {view(body.front, '앞')}
      {view(body.back, '뒤')}
    </div>
  );
}
