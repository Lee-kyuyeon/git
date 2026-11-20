import { EXERCISES, isAvailable, type Equipment, type Profile } from '@core';
import { EquipmentIcon } from './EquipmentIcon.tsx';
import { EQUIPMENT_GROUPS, EQUIPMENT_INFO, PRESETS } from '../labels.ts';

/** 기구 고르기: 프리셋 + 분류별 그림 카드. 고를 때마다 할 수 있는 종목 수를 바로 보여줌 */
export function EquipmentPicker({ value, onChange, profile }: {
  value: Equipment[]; onChange: (v: Equipment[]) => void; profile: Profile;
}) {
  const sameSet = (a: Equipment[], b: Equipment[]) => a.length === b.length && a.every((x) => b.includes(x));
  const preset = PRESETS.find((x) => sameSet(x.equipment, value))?.id;
  const count = EXERCISES.filter((e) => isAvailable(e, { ...profile, equipment: value })).length;
  const toggle = (q: Equipment) => onChange(value.includes(q) ? value.filter((x) => x !== q) : [...value, q]);

  return (
    <div className="stack">
      <div className="presets">
        {PRESETS.map((x) => (
          <button key={x.id} className={`chip ${preset === x.id ? 'on' : ''}`} aria-pressed={preset === x.id} onClick={() => onChange([...x.equipment])}>
            {x.emoji} {x.name}
          </button>
        ))}
      </div>
      <div className="card flat row between" style={{ padding: '10px 14px' }}>
        <span className="small">고른 기구 <b className="num">{value.length}</b>개</span>
        <span className="small">할 수 있는 운동 <b className="num" style={{ color: 'var(--accent)' }}>{count}</b>개</span>
      </div>
      {EQUIPMENT_GROUPS.map((g) => (
        <div key={g.name}>
          <div className="row between" style={{ margin: '4px 2px 8px' }}>
            <span className="section-label" style={{ margin: 0 }}>{g.name}</span>
            <button className="tiny muted bold" onClick={() => {
              const all = g.items.every((q) => value.includes(q));
              onChange(all ? value.filter((q) => !g.items.includes(q as never)) : [...new Set([...value, ...g.items])]);
            }}>{g.items.every((q) => value.includes(q)) ? '모두 해제' : '모두 선택'}</button>
          </div>
          <div className="equip-grid">
            {g.items.map((q) => {
              const on = value.includes(q);
              return (
                <button key={q} className={`equip-card ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(q)}>
                  {on && <span className="equip-check">✓</span>}
                  <EquipmentIcon id={q} size={52} />
                  <b className="small">{EQUIPMENT_INFO[q].name}</b>
                  <span className="tiny muted">{EQUIPMENT_INFO[q].desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="tiny muted">맨몸 운동은 항상 포함돼요. 나중에 '나' 탭에서 바꿀 수 있어요.</p>
    </div>
  );
}
