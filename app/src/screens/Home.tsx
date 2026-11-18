import { useState } from 'react';
import { EXERCISE_BY_ID, estimateSeconds } from '@core';
import { useStore } from '../store.tsx';
import { RecoveryGrid, Sheet } from '../components/ui.tsx';
import { MUSCLE_KO } from '../labels.ts';
import { level, nextDayIndex, recovery, sessionsThisWeek, startSession, streak } from '../logic.ts';

export function Home({ openWorkout, goTab }: { openWorkout: () => void; goTab: (t: 'me') => void }) {
  const { data, update } = useStore();
  const [pickDay, setPickDay] = useState(false);
  const program = data.program!;
  const dayIdx = nextDayIndex(data);
  const day = program.days[dayIdx]!;
  const rec = recovery(data);
  const lv = level(data);
  const week = sessionsThisWeek(data);
  const target = data.profile?.daysPerWeek ?? 3;
  const st = streak(data);
  const minutes = Math.round(day.exercises.reduce((a, e) => a + estimateSeconds(e), 0) / 60);
  const tired = day.focus.filter((m) => rec[m] < 60 && m !== 'forearms');
  const needBackup = data.sessions.length > 0 && (!data.settings.lastBackupAt || Date.now() - data.settings.lastBackupAt > 7 * 864e5);

  const start = (idx: number | null) => {
    update((d) => ({ ...d, active: startSession(d, idx) }));
    setPickDay(false);
    openWorkout();
  };

  return (
    <div className="screen">
      <div className="stack">
        <div className="row between">
          <div>
            <div className="small muted">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
            <div className="title">오늘의 운동</div>
          </div>
          <div className="tag accent">Lv.{lv.level}</div>
        </div>

        {/* 주간 목표와 연속 기록 */}
        <div className="card">
          <div className="row between">
            <div>
              <div className="small muted">이번 주</div>
              <div className="h2 num">{week} / {target}회</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="small muted">연속 달성</div>
              <div className="h2 num">🔥 {st}주</div>
            </div>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 10 }}>
            {Array.from({ length: target }, (_, i) => (
              <div key={i} className="grow" style={{ height: 8, borderRadius: 4, background: i < week ? 'var(--accent)' : 'var(--surface-2)' }} />
            ))}
          </div>
        </div>

        {/* 오늘의 루틴 */}
        {data.active ? (
          <button className="card hero tap" onClick={openWorkout}>
            <span className="tag accent">진행 중</span>
            <div className="h2" style={{ marginTop: 8 }}>{data.active.dayName}</div>
            <div className="small muted">이어서 하기 →</div>
          </button>
        ) : (
          <div className="card hero">
            <div className="row between">
              <span className="tag accent">DAY {dayIdx + 1} / {program.days.length}</span>
              <span className="small muted num">약 {minutes}분 · {day.exercises.length}종목</span>
            </div>
            <div className="h2" style={{ marginTop: 8, fontSize: 22 }}>{day.name}</div>
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {day.exercises.map((e) => {
                const ex = EXERCISE_BY_ID.get(e.exerciseId)!;
                return (
                  <div key={e.exerciseId} className="row between small">
                    <span>{ex.nameKo} {e.caution && <span className="tag warn">가볍게</span>}</span>
                    <span className="muted num">{e.sets}×{e.repMin}-{e.repMax}</span>
                  </div>
                );
              })}
            </div>
            {tired.length > 0 && (
              <div className="small" style={{ marginTop: 10, color: 'var(--warn)' }}>
                {tired.map((m) => `${MUSCLE_KO[m]} ${rec[m]}%`).join(', ')} 회복 중이에요. 무게를 조금 낮춰도 좋아요.
              </div>
            )}
            <button className="btn primary block" style={{ marginTop: 14 }} onClick={() => start(dayIdx)}>운동 시작</button>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn sm grow" onClick={() => setPickDay(true)}>다른 날 하기</button>
              <button className="btn sm grow" onClick={() => start(null)}>자유 운동</button>
            </div>
          </div>
        )}

        {/* 회복도 */}
        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <b>근육 회복도</b>
            <span className="tiny muted">최근 7일 기록으로 추정</span>
          </div>
          <RecoveryGrid values={rec} compact />
        </div>

        {needBackup && (
          <button className="card tap small" onClick={() => goTab('me')}>
            💾 마지막 백업 후 7일이 지났어요. 기록은 이 폰에만 있어서 백업 파일을 저장해 두면 안전해요 →
          </button>
        )}
      </div>

      <Sheet open={pickDay} onClose={() => setPickDay(false)} title="어떤 날을 할까요?">
        <div className="stack">
          {program.days.map((d, i) => (
            <button key={i} className="option" onClick={() => start(i)}>
              <span className="grow">
                <b>{d.name}</b>
                <div className="small muted">{d.exercises.map((e) => EXERCISE_BY_ID.get(e.exerciseId)!.nameKo).join(' · ')}</div>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
