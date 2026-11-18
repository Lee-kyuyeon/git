import { useMemo, useState } from 'react';
import { EXERCISE_BY_ID } from '@core';
import { useStore, type Session } from '../store.tsx';
import { LineChart, Sheet } from '../components/ui.tsx';
import { completedSessions, e1rmHistory, fmtDate, fmtKg, sessionStats } from '../logic.ts';

const DOW = ['월', '화', '수', '목', '금', '토', '일'];

export function History() {
  const { data, update } = useStore();
  const sessions = completedSessions(data);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [detail, setDetail] = useState<Session | null>(null);
  const exerciseIds = useMemo(() => [...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)))], [sessions]);
  const [chartEx, setChartEx] = useState<string>('');
  const chartId = chartEx || exerciseIds[0] || '';

  const days = new Set(sessions.map((s) => { const d = new Date(s.startedAt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  const first = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date();

  return (
    <div className="screen">
      <div className="stack">
        <div className="title">기록</div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <button className="icon-btn" aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
            <b>{month.getFullYear()}년 {month.getMonth() + 1}월</b>
            <button className="icon-btn" aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="cal">
            {DOW.map((d) => <div key={d} className="dow">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: count }, (_, i) => {
              const day = i + 1;
              const has = days.has(`${month.getFullYear()}-${month.getMonth()}-${day}`);
              const isToday = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === day;
              return <div key={day} className={`day ${has ? 'has' : ''} ${isToday ? 'today' : ''}`}>{day}</div>;
            })}
          </div>
        </div>

        {exerciseIds.length > 0 && (
          <div className="card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <b>추정 1RM 성장</b>
              <select value={chartId} onChange={(e) => setChartEx(e.target.value)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px 8px', color: 'var(--text)', maxWidth: 180 }}>
                {exerciseIds.map((id) => <option key={id} value={id}>{EXERCISE_BY_ID.get(id)?.nameKo ?? id}</option>)}
              </select>
            </div>
            <LineChart points={e1rmHistory(sessions, chartId)} />
            <p className="tiny muted">10회 이하 세트로만 계산해요 (그 이상은 오차가 커요).</p>
          </div>
        )}

        <div className="section-label">지난 운동</div>
        {sessions.length === 0 && <div className="empty">아직 기록이 없어요. 첫 운동을 시작해 보세요!</div>}
        <div className="card" style={{ padding: '4px 16px' }} hidden={sessions.length === 0}>
          {[...sessions].reverse().map((s) => {
            const st = sessionStats(s);
            return (
              <button key={s.id} className="list-row" onClick={() => setDetail(s)}>
                <span className="grow">
                  <b>{s.dayName}</b>
                  <div className="small muted">{fmtDate(s.startedAt)} · {st.minutes}분 · {st.sets}세트</div>
                </span>
                <span className="small muted num">{st.volume.toLocaleString()}kg</span>
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? `${fmtDate(detail.startedAt)} ${detail.dayName}` : ''}>
        {detail && (
          <div className="stack">
            {detail.exercises.map((e, i) => (
              <div key={i}>
                <b>{EXERCISE_BY_ID.get(e.exerciseId)?.nameKo}</b>
                <div className="small muted num">
                  {e.sets.filter((x) => x.done && !x.isWarmup).map((x) => `${fmtKg(x.weightKg)}×${x.reps}`).join('  ·  ')}
                </div>
              </div>
            ))}
            <button className="btn ghost block" style={{ color: 'var(--bad)' }} onClick={() => {
              if (!confirm('이 기록을 삭제할까요?')) return;
              update((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== detail.id) }));
              setDetail(null);
            }}>기록 삭제</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
