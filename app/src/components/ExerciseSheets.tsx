import { useMemo, useState } from 'react';
import { ALL_MUSCLES, EXERCISES, EXERCISE_BY_ID, alternativesFor, isAvailable, type Muscle, type Profile } from '@core';
import { Chips, Sheet } from './ui.tsx';
import { JOINT_KO, LENGTH_KO, MUSCLE_KO } from '../labels.ts';

export function ExercisePicker({ open, onClose, onPick, profile }: {
  open: boolean; onClose: () => void; onPick: (id: string) => void; profile?: Profile;
}) {
  const [q, setQ] = useState('');
  const [m, setM] = useState<Muscle | 'all'>('all');
  const list = useMemo(() => EXERCISES
    .filter((e) => (m === 'all' || e.primary.includes(m)) && (q === '' || e.nameKo.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(profile ? isAvailable(b, profile) : 1) - Number(profile ? isAvailable(a, profile) : 1)),
  [q, m, profile]);
  return (
    <Sheet open={open} onClose={onClose} title="종목 추가">
      <div className="stack">
        <input placeholder="종목 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ overflowX: 'auto' }}>
          <Chips value={m} onChange={setM}
            options={[{ value: 'all' as const, label: '전체' }, ...ALL_MUSCLES.map((x) => ({ value: x, label: MUSCLE_KO[x] }))]} />
        </div>
        <div>
          {list.map((e) => {
            const ok = profile ? isAvailable(e, profile) : true;
            return (
              <button key={e.id} className="list-row" onClick={() => onPick(e.id)} style={{ opacity: ok ? 1 : 0.5 }}>
                <span className="grow">
                  <b>{e.nameKo}</b>
                  <div className="small muted">{e.primary.map((x) => MUSCLE_KO[x]).join(', ')}{ok ? '' : ' · 기구 없음'}</div>
                </span>
                <span className="muted">＋</span>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

export function ExerciseInfo({ id, onClose, onSwap, profile }: {
  id: string | null; onClose: () => void; onSwap?: (newId: string) => void; profile?: Profile;
}) {
  const ex = id ? EXERCISE_BY_ID.get(id) : undefined;
  const alts = id && profile ? alternativesFor(id, profile).slice(0, 6) : [];
  return (
    <Sheet open={!!ex} onClose={onClose} title={ex?.nameKo}>
      {ex && (
        <div className="stack">
          <div className="row wrap">
            {ex.primary.map((m) => <span key={m} className="tag accent">{MUSCLE_KO[m]}</span>)}
            {ex.secondary.map((m) => <span key={m} className="tag">{MUSCLE_KO[m]}</span>)}
            <span className="tag">{LENGTH_KO[ex.lengthBias]}</span>
          </div>
          {ex.cues.length > 0 && (
            <div className="card">
              <b>동작 포인트</b>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{ex.cues.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          {ex.stressedJoints.length > 0 && (
            <div className="small muted">부담이 가는 관절: {ex.stressedJoints.map((j) => JOINT_KO[j]).join(', ')}</div>
          )}
          {onSwap && alts.length > 0 && (
            <>
              <div className="section-label">대신 할 수 있는 종목</div>
              <div>
                {alts.map((a) => (
                  <button key={a.id} className="list-row" onClick={() => onSwap(a.id)}>
                    <span className="grow">
                      <b>{a.nameKo}</b>
                      <div className="small muted">
                        {a.primary.map((m) => MUSCLE_KO[m]).join(', ')}
                        {a.stressedJoints.some((j) => profile?.injuries.includes(j)) ? ' · 불편 부위 주의' : ''}
                      </div>
                    </span>
                    <span className="small" style={{ color: 'var(--accent)' }}>바꾸기</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
