import { useState } from 'react';
import { EXERCISE_BY_ID, REGIONS, estimateSeconds, rankOf, startOfWeek, weekCleared, type Region } from '@core';
import { useStore } from '../store.tsx';
import { Sheet } from '../components/ui.tsx';
import { useGuide } from '../components/Guide.tsx';
import { MUSCLE_KO } from '../labels.ts';
import { nextDayIndex, recovery, startSession } from '../logic.ts';
import { CLASS_INFO, dayRegionGain, playerProgress, questsForWeek } from '../game.ts';

export function Home({ openWorkout, openRoutine }: { openWorkout: () => void; openRoutine: () => void }) {
  const { data, update } = useStore();
  const [pickDay, setPickDay] = useState(false);
  const [allQuests, setAllQuests] = useState(false);
  const guide = useGuide();
  const program = data.program!;
  const profile = data.profile!;
  const dayIdx = nextDayIndex(data);
  const day = program.days[dayIdx]!;
  const player = playerProgress(data);
  const rank = rankOf(player.level);
  const quests = questsForWeek(data);
  const cleared = weekCleared(quests);
  const daysLeft = 7 - Math.floor((Date.now() - startOfWeek(new Date()).getTime()) / 864e5);
  const rec = recovery(data);
  const tired = day.focus.filter((m) => rec[m] < 60 && m !== 'forearms');
  const gain = dayRegionGain(day.exercises);
  const minutes = Math.round(day.exercises.reduce((a, e) => a + estimateSeconds(e), 0) / 60);
  const needBackup = data.sessions.length > 0 && (!data.settings.lastBackupAt || Date.now() - data.settings.lastBackupAt > 7 * 864e5);

  const start = (idx: number | null) => {
    update((d) => ({ ...d, active: startSession(d, idx) }));
    setPickDay(false);
    openWorkout();
  };

  return (
    <div className="screen">
      <div className="stack">
        {/* 플레이어 카드 */}
        <div className="card hero">
          <div className="row between">
            <div className="row">
              <span style={{ fontSize: 40 }}>{CLASS_INFO[profile.goal].emoji}</span>
              <div>
                <div className="h2">{CLASS_INFO[profile.goal].name}</div>
                <div className="small muted">{rank.name} · 최고 연속 {player.bestStreak}주</div>
              </div>
            </div>
            <span className={`lv rank-${rank.color}`}>Lv.{player.level}</span>
          </div>
          <div className="xp-bar" style={{ marginTop: 12 }}><div style={{ width: `${(player.into / player.need) * 100}%` }} /></div>
          <div className="tiny muted num" style={{ marginTop: 4 }}>{player.into} / {player.need} XP</div>
        </div>

        {/* 오늘의 미션 */}
        {data.active ? (
          <button className="card gold tap" onClick={openWorkout}>
            <span className="tag">진행 중</span>
            <div className="h2" style={{ marginTop: 6 }}>{data.active.dayName}</div>
            <div className="small">이어서 하기 →</div>
          </button>
        ) : (
          <div className="card">
            <div className="row between">
              <b>⚔️ 오늘의 미션</b>
              <span className="tiny muted num">약 {minutes}분 · {day.exercises.length}종목</span>
            </div>
            <div className="h2" style={{ marginTop: 6, fontSize: 22 }}>{day.name}</div>
            <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
              {(Object.keys(gain) as Region[]).filter((r) => (gain[r] ?? 0) >= 1).map((r) => (
                <span key={r} className="tag accent">{REGIONS[r].name} +{Math.round(gain[r]!)}</span>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              {day.exercises.slice(0, 4).map((e) => (
                <button key={e.exerciseId} className="list-row" style={{ padding: '8px 0' }} onClick={() => guide.openExercise(e.exerciseId)}>
                  <span className="grow small">{EXERCISE_BY_ID.get(e.exerciseId)!.nameKo} {e.caution && <span className="tag warn">가볍게</span>}</span>
                  <span className="tiny muted num">{e.sets}×{e.repMin}-{e.repMax}</span>
                  <span className="muted small">ⓘ</span>
                </button>
              ))}
              {day.exercises.length > 4 && (
                <div className="small muted" style={{ padding: '8px 0 0' }}>외 {day.exercises.length - 4}종목 · 시작하면 미리보기에서 전부 보고 바꿀 수 있어요</div>
              )}
            </div>
            {tired.length > 0 && (
              <p className="small" style={{ marginTop: 8, color: 'var(--warn)', fontWeight: 700 }}>
                {tired.map((m) => `${MUSCLE_KO[m]} 회복 ${rec[m]}%`).join(', ')} · 무게를 조금 낮춰도 좋아요
              </p>
            )}
            <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => start(dayIdx)}>미션 시작</button>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn sm grow" onClick={() => setPickDay(true)}>다른 미션</button>
              <button className="btn sm grow" onClick={() => start(null)}>자유 훈련</button>
              <button className="btn sm grow" onClick={openRoutine}>전체 루틴</button>
            </div>
          </div>
        )}

        {/* 주간 퀘스트 */}
        <div className="card">
          <div className="row between">
            <b>📜 이번 주 퀘스트 <span className="muted num">{quests.filter((q) => q.done).length}/{quests.length}</span></b>
            <span className={`tag ${cleared ? 'good' : ''}`}>{cleared ? '클리어!' : `${daysLeft}일 남음`}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {/* 기본은 남은 퀘스트 중 진행률 높은 3개만 (홈을 짧게) */}
            {(allQuests ? quests : quests.filter((q) => !q.done).sort((a, b) => b.progress / b.target - a.progress / a.target).slice(0, 3)).map((q) => (
              <div key={q.id} className={`quest ${q.done ? 'done' : ''}`}>
                <span className="box">{q.done ? '✓' : ''}</span>
                <div className="grow">
                  <div className="row between">
                    <span className="small bold q-title">{q.title}</span>
                    <span className="tiny muted num">{Math.min(q.progress, q.target)}/{q.target}</span>
                  </div>
                  {!q.done && <div className="xp-bar accent" style={{ height: 8, marginTop: 4 }}><div style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} /></div>}
                </div>
                <span className="tag gold">+{q.xp}</span>
              </div>
            ))}
          </div>
          <button className="btn ghost sm block" style={{ marginTop: 4 }} onClick={() => setAllQuests((v) => !v)}>
            {allQuests ? '접기 ▲' : `전체 퀘스트 보기 (${quests.length}) ▼`}
          </button>
          {allQuests && <p className="tiny muted">출석 + 부위 퀘스트 4개를 깨면 주간 클리어 (+200XP)</p>}
        </div>

        {needBackup && (
          <div className="card flat small">
            💾 마지막 백업 후 7일이 지났어요. '나' 탭에서 백업 파일을 저장해 두세요.
          </div>
        )}
      </div>

      <Sheet open={pickDay} onClose={() => setPickDay(false)} title="어떤 미션을 할까요?">
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
      {guide.layer}
    </div>
  );
}
