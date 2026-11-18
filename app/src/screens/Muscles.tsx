import { useState } from 'react';
import { ALL_MUSCLES, MUSCLE_INFO, rankOf, type Muscle } from '@core';
import { useStore } from '../store.tsx';
import { BodyMap } from '../components/BodyMap.tsx';
import { ExerciseList } from '../components/ExerciseSheets.tsx';
import { useGuide } from '../components/Guide.tsx';
import { MUSCLE_KO } from '../labels.ts';
import { completedSessions, recovery } from '../logic.ts';
import { muscleLevels } from '../game.ts';

/** 근육 탭: 부위별 레벨·회복도 + 근육/운동 도감 */
export function Muscles() {
  const { data } = useStore();
  const [view, setView] = useState<'level' | 'recovery'>('level');
  const [tab, setTab] = useState<'muscle' | 'exercise'>('muscle');
  const guide = useGuide();
  const levels = muscleLevels(completedSessions(data));
  const rec = recovery(data);
  const maxLv = Math.max(2, ...ALL_MUSCLES.map((m) => levels[m].level));
  const heat = Object.fromEntries(ALL_MUSCLES.map((m) => [m,
    view === 'level' ? (levels[m].xp === 0 ? 0 : levels[m].level / maxLv) : (100 - rec[m]) / 100,
  ])) as Record<Muscle, number>;

  return (
    <div className="screen">
      <div className="stack">
        <div className="title">근육</div>

        <div className="card">
          <div className="seg" style={{ marginBottom: 12 }}>
            <button className={view === 'level' ? 'on' : ''} onClick={() => setView('level')}>성장 레벨</button>
            <button className={view === 'recovery' ? 'on' : ''} onClick={() => setView('recovery')}>피로도</button>
          </div>
          <BodyMap heat={heat} onTap={guide.openMuscle} size={290} />
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 6 }}>
            {view === 'level' ? '진할수록 많이 키운 부위' : '진할수록 아직 회복 중 (최근 7일 기록으로 추정)'} · 부위를 누르면 도감
          </p>
        </div>

        <div className="seg">
          <button className={tab === 'muscle' ? 'on' : ''} onClick={() => setTab('muscle')}>근육 도감</button>
          <button className={tab === 'exercise' ? 'on' : ''} onClick={() => setTab('exercise')}>운동 도감</button>
        </div>

        {tab === 'muscle' ? (
          <div className="muscle-tiles">
            {ALL_MUSCLES.map((m) => {
              const l = levels[m];
              const r = rankOf(l.level);
              return (
                <button key={m} className="muscle-tile" onClick={() => guide.openMuscle(m)}>
                  <div className="row between">
                    <b>{MUSCLE_KO[m]}</b>
                    <span className={`lv rank-${r.color}`} style={{ minWidth: 36, height: 22, fontSize: 12 }}>{l.level}</span>
                  </div>
                  <div className="tiny muted" style={{ margin: '2px 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {MUSCLE_INFO[m].anatomy.split(' · ')[0]}
                  </div>
                  <div className="xp-bar" style={{ height: 8 }}><div style={{ width: `${(l.into / l.need) * 100}%` }} /></div>
                  <div className="row between tiny muted" style={{ marginTop: 4 }}>
                    <span className="num">{l.into}/{l.need}</span>
                    <span><span className="dot" style={{ background: rec[m] >= 80 ? 'var(--good)' : rec[m] >= 50 ? 'var(--warn)' : 'var(--bad)' }} /> {rec[m]}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <ExerciseList profile={data.profile} onPick={guide.openExercise} action="›" />
        )}
      </div>
      {guide.layer}
    </div>
  );
}
