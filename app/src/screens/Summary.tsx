import { ALL_MUSCLES, EXERCISE_BY_ID, levelFromXp, muscleXp, type Muscle } from '@core';
import { useStore, type Session } from '../store.tsx';
import { MUSCLE_KO } from '../labels.ts';
import { completedSessions, personalRecords, sessionStats } from '../logic.ts';
import { achievements, questsForWeek, sessionXp, sessionXpSets } from '../game.ts';

const FEELINGS: Array<{ v: NonNullable<Session['feeling']>; label: string; emoji: string }> = [
  { v: 'easy', label: '여유', emoji: '😌' },
  { v: 'ok', label: '딱 좋음', emoji: '🙂' },
  { v: 'hard', label: '힘듦', emoji: '🥵' },
];

export function Summary({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const all = completedSessions(data);
  const idx = all.findIndex((s) => s.id === id);
  const s = all[idx];
  if (!s) return null;
  const before = all.slice(0, idx);
  const st = sessionStats(s);
  const prs = personalRecords(s, before);
  const gained = sessionXp(s);

  // 레벨업: 이 세션 전후 부위 레벨 비교
  const xpBefore = muscleXp(before.flatMap(sessionXpSets));
  const levelUps = ALL_MUSCLES
    .map((m) => ({ m, from: levelFromXp(xpBefore[m]).level, to: levelFromXp(xpBefore[m] + gained.byMuscle[m]).level }))
    .filter((x) => x.to > x.from);
  const topMuscles = (Object.entries(gained.byMuscle) as Array<[Muscle, number]>).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // 이번 세션으로 새로 완료된 퀘스트·업적
  const dataBefore = { ...data, sessions: data.sessions.filter((x) => x.id !== id) };
  const qBefore = new Set(questsForWeek(dataBefore).filter((q) => q.done).map((q) => q.id));
  const newQuests = questsForWeek(data).filter((q) => q.done && !qBefore.has(q.id));
  const aBefore = new Set(achievements(dataBefore).filter((a) => a.unlocked).map((a) => a.id));
  const newBadges = achievements(data).filter((a) => a.unlocked && !aBefore.has(a.id));

  return (
    <div className="screen no-tab">
      <div className="stack">
        <div className="card hero" style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ margin: 0, color: 'inherit', opacity: .8 }}>미션 완료</div>
          <div className="title" style={{ marginTop: 4 }}>{s.dayName}</div>
          <div style={{ fontSize: 44, fontWeight: 900, marginTop: 6 }} className="num">+{gained.total} XP</div>
          <div className="small muted num">{st.minutes}분 · {st.sets}세트 · {st.volume.toLocaleString()}kg</div>
        </div>

        {levelUps.length > 0 && (
          <div className="card gold">
            <b>🎉 레벨 업!</b>
            {levelUps.map((l) => (
              <div key={l.m} className="row between" style={{ marginTop: 6 }}>
                <span className="bold">{MUSCLE_KO[l.m]}</span>
                <span className="num bold">Lv.{l.from} → Lv.{l.to}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <b>부위별 획득 XP</b>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {topMuscles.map(([m, v]) => (
              <div key={m}>
                <div className="row between small"><span className="bold">{MUSCLE_KO[m]}</span><span className="num">+{v}</span></div>
                <div className="xp-bar" style={{ height: 8 }}><div style={{ width: `${Math.min(100, (v / topMuscles[0]![1]) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {(newQuests.length > 0 || prs.length > 0 || newBadges.length > 0) && (
          <div className="card">
            {newQuests.map((q) => <div key={q.id} className="row between small" style={{ padding: '4px 0' }}><span>📜 퀘스트 완료: <b>{q.title}</b></span><span className="tag gold">+{q.xp}</span></div>)}
            {prs.map((p) => <div key={p.exerciseId} className="row between small" style={{ padding: '4px 0' }}><span>🏆 개인 기록: <b>{EXERCISE_BY_ID.get(p.exerciseId)!.nameKo}</b></span><span className="num">{p.e1rm}kg</span></div>)}
            {newBadges.map((a) => <div key={a.id} className="small" style={{ padding: '4px 0' }}>{a.emoji} 업적 달성: <b>{a.name}</b> · {a.desc}</div>)}
          </div>
        )}

        <div className="card">
          <b>오늘 강도는?</b>
          <div className="row" style={{ marginTop: 10 }}>
            {FEELINGS.map((f) => (
              <button key={f.v} className={`chip grow ${s.feeling === f.v ? 'on' : ''}`} style={{ textAlign: 'center' }}
                onClick={() => update((d) => ({ ...d, sessions: d.sessions.map((x) => (x.id === id ? { ...x, feeling: f.v } : x)) }))}>
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bottom-cta"><button className="btn primary block" onClick={onClose}>확인</button></div>
    </div>
  );
}
