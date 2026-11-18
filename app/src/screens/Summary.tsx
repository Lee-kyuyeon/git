import { EXERCISE_BY_ID } from '@core';
import { useStore, type Session } from '../store.tsx';
import { personalRecords, sessionStats, streak } from '../logic.ts';

const FEELINGS: Array<{ v: NonNullable<Session['feeling']>; label: string; emoji: string }> = [
  { v: 'easy', label: '여유 있었어요', emoji: '😌' },
  { v: 'ok', label: '딱 좋았어요', emoji: '🙂' },
  { v: 'hard', label: '힘들었어요', emoji: '🥵' },
];

export function Summary({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const idx = data.sessions.findIndex((s) => s.id === id);
  const s = data.sessions[idx];
  if (!s) return null;
  const st = sessionStats(s);
  const prs = personalRecords(s, data.sessions.slice(0, idx));

  return (
    <div className="screen no-tab">
      <div className="stack" style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <div className="title">오늘도 해냈어요</div>
        <div className="muted">{s.dayName} · 연속 {streak(data)}주째</div>
      </div>
      <div className="row" style={{ marginTop: 24, gap: 8 }}>
        {[
          { k: '시간', v: `${st.minutes}분` },
          { k: '세트', v: `${st.sets}` },
          { k: '총 볼륨', v: `${st.volume.toLocaleString()}kg` },
        ].map((x) => (
          <div key={x.k} className="card grow" style={{ textAlign: 'center', padding: 12 }}>
            <div className="small muted">{x.k}</div>
            <div className="h2 num">{x.v}</div>
          </div>
        ))}
      </div>

      {prs.length > 0 && (
        <div className="card hero" style={{ marginTop: 12 }}>
          <b>🏆 개인 최고 기록</b>
          {prs.map((p) => (
            <div key={p.exerciseId} className="row between small" style={{ marginTop: 6 }}>
              <span>{EXERCISE_BY_ID.get(p.exerciseId)!.nameKo}</span>
              <span className="num">추정 1RM {p.e1rm}kg</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-label" style={{ marginTop: 20 }}>오늘 운동 강도는 어땠나요?</div>
      <div className="stack" style={{ marginTop: 8 }}>
        {FEELINGS.map((f) => (
          <button key={f.v} className={`option ${s.feeling === f.v ? 'on' : ''}`}
            onClick={() => update((d) => ({ ...d, sessions: d.sessions.map((x) => (x.id === id ? { ...x, feeling: f.v } : x)) }))}>
            <span className="emoji">{f.emoji}</span><b>{f.label}</b>
          </button>
        ))}
      </div>

      <div className="bottom-cta"><button className="btn primary block" onClick={onClose}>확인</button></div>
    </div>
  );
}
