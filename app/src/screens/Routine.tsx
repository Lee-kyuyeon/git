import { ALL_MUSCLES, EXERCISE_BY_ID, estimateSeconds } from '@core';
import { useStore } from '../store.tsx';
import { useGuide } from '../components/Guide.tsx';
import { GOAL_KO, MUSCLE_KO } from '../labels.ts';
import { startSession, thisWeekVolume, underCovered } from '../logic.ts';

export function Routine({ openWorkout, editProfile, onBack }: { openWorkout: () => void; editProfile: () => void; onBack: () => void }) {
  const { data, update } = useStore();
  const guide = useGuide();
  const program = data.program!;
  const profile = data.profile!;
  const week = thisWeekVolume(data);
  const lacking = underCovered(program);

  return (
    <div className="screen">
      <div className="stack">
        <div className="row between">
          <div className="row"><button className="icon-btn" aria-label="뒤로" onClick={onBack}>‹</button><div className="title">전체 루틴</div></div>
          <button className="btn sm" onClick={editProfile}>다시 짜기</button>
        </div>
        <div className="small muted">
          {GOAL_KO[profile.goal].label} · 주 {profile.daysPerWeek}회 · {profile.minutesPerSession}분
        </div>
        {lacking.length > 0 && (
          <div className="card small">⏱️ 시간이 빠듯해 {lacking.map((m) => MUSCLE_KO[m]).join(', ')} 운동량이 목표보다 적어요.</div>
        )}

        {program.days.map((d, i) => (
          <div key={i} className="card">
            <div className="row between">
              <div>
                <b>{d.name}</b>
                <div className="tiny muted num">약 {Math.round(d.exercises.reduce((a, e) => a + estimateSeconds(e), 0) / 60)}분</div>
              </div>
              <button className="btn sm primary" disabled={!!data.active} onClick={() => {
                update((x) => ({ ...x, active: startSession(x, i) }));
                openWorkout();
              }}>시작</button>
            </div>
            <div style={{ marginTop: 6 }}>
              {d.exercises.map((e) => {
                const ex = EXERCISE_BY_ID.get(e.exerciseId)!;
                return (
                  <button key={e.exerciseId} className="list-row" style={{ padding: '8px 0' }} onClick={() => guide.openExercise(e.exerciseId)}>
                    <span className="grow">{ex.nameKo} <span className="muted small">ⓘ</span> {e.caution && <span className="tag warn">가볍게</span>}</span>
                    <span className="small muted num">{e.sets}세트 · {e.repMin}-{e.repMax}회</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <b>이번 주 부위별 운동량</b>
            <span className="tiny muted">세트 / 목표</span>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {ALL_MUSCLES.filter((m) => program.weeklyTargets[m] > 0).map((m) => {
              const t = program.weeklyTargets[m];
              const v = week[m];
              const pct = Math.min(100, (v / t) * 100);
              return (
                <div key={m}>
                  <div className="row between small"><span>{MUSCLE_KO[m]}</span><span className="muted num">{v} / {t}</span></div>
                  <div className={`bar ${pct >= 100 ? 'good' : ''}`}><div style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>보조로 쓰인 부위는 0.5세트로 세요. 근육 성장에는 부위별 주간 세트 수가 가장 중요해요.</p>
        </div>
      </div>
      {guide.layer}
    </div>
  );
}
