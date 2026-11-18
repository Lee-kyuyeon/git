import { useEffect, useState, type ReactNode } from 'react';
import { ALL_MUSCLES, type Muscle } from '@core';
import { MUSCLE_KO } from '../labels.ts';

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {title && <div className="h2" style={{ marginBottom: 12 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, multi }: {
  options: Array<{ value: T; label: string }>;
  value: T | T[];
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const sel = Array.isArray(value) ? value : [value];
  return (
    <div className="chips">
      {options.map((o) => {
        const on = sel.includes(o.value);
        return (
          <button key={String(o.value)} className={`chip ${on ? 'on' : ''}`} aria-pressed={on}
            onClick={() => {
              if (!multi) return onChange(o.value);
              onChange(on ? sel.filter((x) => x !== o.value) : [...sel, o.value]);
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

/** 회복도 색: 낮을수록 빨강 → 노랑 → 초록 */
function recoveryColor(p: number): string {
  const c = p >= 80 ? 'var(--good)' : p >= 50 ? 'var(--warn)' : 'var(--bad)';
  return `color-mix(in srgb, ${c} ${p >= 80 ? 16 : 24}%, transparent)`;
}

export function RecoveryGrid({ values, compact }: { values: Record<Muscle, number>; compact?: boolean }) {
  const muscles = compact ? ALL_MUSCLES.filter((m) => m !== 'forearms' && m !== 'adductors' && m !== 'traps' && m !== 'frontDelts') : ALL_MUSCLES;
  return (
    <div className="muscle-grid">
      {muscles.map((m) => (
        <div key={m} className="muscle-cell" style={{ background: recoveryColor(values[m]) }}>
          <span className="pct">{values[m]}%</span>
          {MUSCLE_KO[m]}
        </div>
      ))}
    </div>
  );
}

export function LineChart({ points, height = 140 }: { points: Array<{ t: number; v: number }>; height?: number }) {
  if (points.length < 2) return <div className="empty small">기록이 2회 이상 쌓이면 그래프가 보여요</div>;
  const w = 320;
  const pad = 24;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" role="img" aria-label="추정 1RM 추이">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.v)} r={3.5} fill="var(--accent)" />)}
      <text x={pad} y={14} fontSize={11} fill="var(--muted)">{max.toFixed(1)}kg</text>
      <text x={pad} y={height - 6} fontSize={11} fill="var(--muted)">{min.toFixed(1)}kg</text>
    </svg>
  );
}

/** 숫자 입력. "62." 처럼 입력 중인 소수점을 잃지 않도록 문자열 상태를 따로 둠 */
export function NumInput({ value, onChange, decimal, label }: { value: number; onChange: (n: number) => void; decimal?: boolean; label: string }) {
  const [txt, setTxt] = useState(value ? String(value) : '');
  useEffect(() => {
    if ((Number(txt.replace(',', '.')) || 0) !== value) setTxt(value ? String(value) : '');
  }, [value]);
  return (
    <input className="num-in" inputMode={decimal ? 'decimal' : 'numeric'} aria-label={label} value={txt} placeholder="0"
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.,]/g, '');
        setTxt(t);
        const n = Number(t.replace(',', '.'));
        if (!Number.isNaN(n)) onChange(n);
      }} />
  );
}
