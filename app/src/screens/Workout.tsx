import { useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISE_BY_ID } from '@core';
import { useStore, type LoggedSet, type Session } from '../store.tsx';
import { NumInput, Sheet } from '../components/ui.tsx';
import { ExerciseInfo, ExercisePicker } from '../components/ExerciseSheets.tsx';
import { JOINT_KO, RPE_OPTIONS } from '../labels.ts';
import { buildExercise, completedSessions, fmtKg, freePlan, lastTwo } from '../logic.ts';
import { beep, speak, unlockAudio, useNow, useWakeLock } from '../hooks.ts';

export function Workout({ onMinimize, onFinished }: { onMinimize: () => void; onFinished: (id: string) => void }) {
  const { data, update } = useStore();
  const s = data.active!;
  const now = useNow(250);
  // useNow(250)로 초당 4번 다시 그려지므로 전체 기록을 훑는 계산은 기록이 바뀔 때만
  const done = useMemo(() => completedSessions(data), [data.sessions]);
  const exIds = s.exercises.map((e) => e.exerciseId).join(',');
  const prevByEx = useMemo(() => new Map(exIds.split(',').map((id) => [id, lastTwo(done, id)[0]])), [done, exIds]);
  const [rpeFor, setRpeFor] = useState<{ ei: number; si: number } | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [infoFor, setInfoFor] = useState<{ ei: number; id: string } | null>(null);
  const [picker, setPicker] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const alerted = useRef<number | undefined>(undefined);
  useWakeLock(true);

  const patch = (fn: (s: Session) => Session) => update((d) => (d.active ? { ...d, active: fn(d.active) } : d));
  const patchSet = (ei: number, si: number, p: Partial<LoggedSet>) => patch((x) => ({
    ...x, exercises: x.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((st, j) => j !== si ? st : { ...st, ...p }) }),
  }));
  /** 본세트 값을 바꾸면, 아직 안 한 뒤 세트 중 같은 값이던 세트에도 반영 (한 번 입력으로 끝) */
  const editValue = (ei: number, si: number, field: 'weightKg' | 'reps', value: number) => patch((x) => ({
    ...x, exercises: x.exercises.map((e, i) => {
      if (i !== ei) return e;
      const src = e.sets[si]!;
      const old = src[field];
      return {
        ...e, sets: e.sets.map((st, j) => {
          if (j === si) return { ...st, [field]: value };
          if (j > si && !src.isWarmup && !st.isWarmup && !st.done && st[field] === old) return { ...st, [field]: value };
          return st;
        }),
      };
    }),
  }));

  // 휴식 종료 알림 (종료 시각 기준이라 화면을 껐다 켜도 정확)
  const restLeft = s.restEndsAt ? Math.ceil((s.restEndsAt - now) / 1000) : 0;
  useEffect(() => {
    if (!s.restEndsAt || restLeft > 0 || alerted.current === s.restEndsAt) return;
    alerted.current = s.restEndsAt;
    if (data.settings.sound) beep(3);
    if (data.settings.voice) speak('휴식 끝. 다음 세트 시작하세요');
    patch((x) => ({ ...x, restEndsAt: undefined }));
  }, [restLeft, s.restEndsAt]);

  const startRest = (sec: number) => patch((x) => ({ ...x, restEndsAt: Date.now() + sec * 1000, restTotal: sec }));

  const complete = (ei: number, si: number, rpe?: number) => {
    unlockAudio();
    const e = s.exercises[ei]!;
    const st = e.sets[si]!;
    if (st.done && rpe === undefined) { patchSet(ei, si, { done: false, rpe: undefined }); return; }
    patchSet(ei, si, { done: true, rpe: rpe ?? st.rpe ?? 8 });
    const isLast = si === e.sets.length - 1 && ei === s.exercises.length - 1;
    if (!isLast) startRest(st.isWarmup ? 60 : e.plan.restSec);
  };

  // 길게 누르면 난이도 선택
  const press = useRef<{ t?: number; longAt: number }>({ longAt: 0 });
  const onDown = (ei: number, si: number) => {
    press.current.t = window.setTimeout(() => { press.current.longAt = Date.now(); setRpeFor({ ei, si }); navigator.vibrate?.(15); }, 450);
  };
  const onCancel = () => window.clearTimeout(press.current.t);
  // 완료는 click으로 처리해야 키보드·스위치 접근에서도 동작.
  // 길게 누른 직후의 click만 무시 (시트 위에서 손을 떼면 click이 안 올 수 있어 플래그 대신 시각으로 판단)
  const onClick = (ei: number, si: number) => {
    window.clearTimeout(press.current.t);
    if (Date.now() - press.current.longAt < 1000) return;
    complete(ei, si);
  };

  const elapsed = Math.floor((now - s.startedAt) / 1000);
  const totalWork = s.exercises.reduce((a, e) => a + e.sets.filter((x) => !x.isWarmup).length, 0);
  const doneWork = s.exercises.reduce((a, e) => a + e.sets.filter((x) => !x.isWarmup && x.done).length, 0);

  const finish = () => {
    const id = s.id;
    update((d) => d.active ? {
      ...d,
      active: undefined,
      sessions: [...d.sessions, {
        ...d.active, endedAt: Date.now(), restEndsAt: undefined,
        exercises: d.active.exercises.filter((e) => e.sets.some((x) => x.done)),
      }],
    } : d);
    onFinished(id);
  };

  const cancel = () => { update((d) => ({ ...d, active: undefined })); onMinimize(); };

  return (
    <div className="screen no-tab">
      <div className="player-top">
        <div className="row between">
          <button className="icon-btn" aria-label="최소화" onClick={onMinimize}>⌄</button>
          <div style={{ textAlign: 'center' }}>
            <div className="bold">{s.dayName}</div>
            <div className="small muted num">{mmss(elapsed)} · {doneWork}/{totalWork}세트</div>
          </div>
          <button className="btn sm primary" onClick={() => setConfirmEnd(true)}>완료</button>
        </div>
        <div className="bar" style={{ marginTop: 10, height: 4 }}><div style={{ width: `${totalWork ? (doneWork / totalWork) * 100 : 0}%` }} /></div>
      </div>

      <div className="stack">
        {s.exercises.length === 0 && <div className="empty">아래 버튼으로 종목을 추가하세요</div>}
        {s.exercises.map((e, ei) => {
          const ex = EXERCISE_BY_ID.get(e.exerciseId)!;
          const prev = prevByEx.get(e.exerciseId) ?? [];
          let workNo = 0;
          return (
            <div key={`${e.exerciseId}-${ei}`} className="ex-card">
              <div className="ex-head">
                <div className="row between">
                  <button className="h2" style={{ textAlign: 'left' }} onClick={() => setInfoFor({ ei, id: e.exerciseId })}>{ex.nameKo} <span className="muted small">ⓘ</span></button>
                  <span className="small muted num">{e.plan.repMin}-{e.plan.repMax}회 · RPE {e.plan.targetRpe}</span>
                </div>
                <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                  {e.plan.caution && <span className="tag warn">{e.plan.caution.map((j) => JOINT_KO[j]).join('·')} 주의 · 통증 없는 범위로</span>}
                  {e.reason && <span className="small muted">{e.reason}</span>}
                </div>
              </div>
              {data.notes[e.exerciseId] && <div className="note">📝 {data.notes[e.exerciseId]}</div>}
              <div className="set-grid head"><span>세트</span><span>지난번</span><span style={{ textAlign: 'center' }}>kg</span><span style={{ textAlign: 'center' }}>회</span><span /></div>
              {e.sets.map((st, si) => {
                const no = st.isWarmup ? 'W' : String(++workNo);
                const p = st.isWarmup ? undefined : prev[workNo - 1];
                return (
                  <div key={si} className={`set-grid ${st.done ? 'done' : ''} ${st.isWarmup ? 'warm' : ''}`}>
                    <span className="set-no">{no}</span>
                    <span className="prev">{p ? `${fmtKg(p.weightKg)}×${p.reps}` : st.isWarmup ? '웜업' : '-'}</span>
                    <NumInput decimal label={`${no}세트 무게`} value={st.weightKg} onChange={(n) => editValue(ei, si, 'weightKg', n)} />
                    <NumInput label={`${no}세트 횟수`} value={st.reps} onChange={(n) => editValue(ei, si, 'reps', Math.round(n))} />
                    <button className={`check ${st.done ? 'on' : ''}`} aria-label={`${no}세트 완료`} aria-pressed={st.done}
                      onPointerDown={() => onDown(ei, si)} onPointerUp={onCancel} onPointerLeave={onCancel} onPointerCancel={onCancel}
                      onClick={() => onClick(ei, si)}
                      onContextMenu={(ev) => ev.preventDefault()}>
                      ✓{st.done && st.rpe && !st.isWarmup && <span className="rpe-badge">{RPE_OPTIONS.find((o) => o.rpe === st.rpe)?.label}</span>}
                    </button>
                  </div>
                );
              })}
              <div className="ex-foot">
                <button className="btn sm grow" onClick={() => patch((x) => ({
                  ...x, exercises: x.exercises.map((y, i) => {
                    if (i !== ei) return y;
                    const lastSet = y.sets[y.sets.length - 1];
                    return { ...y, sets: [...y.sets, { weightKg: lastSet?.weightKg ?? 0, reps: lastSet?.reps ?? y.plan.repMin, done: false }] };
                  }),
                }))}>＋ 세트</button>
                <button className="btn sm grow" onClick={() => setInfoFor({ ei, id: e.exerciseId })}>교체</button>
                <button className="btn sm grow" onClick={() => { setNoteFor(e.exerciseId); setNoteText(data.notes[e.exerciseId] ?? ''); }}>메모</button>
              </div>
            </div>
          );
        })}
        <button className="btn block" onClick={() => setPicker(true)}>＋ 종목 추가</button>
        <p className="tiny muted" style={{ textAlign: 'center' }}>✓를 길게 누르면 난이도(쉬움·적당·힘듦·실패)를 고를 수 있어요</p>
      </div>

      {s.restEndsAt && restLeft > 0 && (
        <div className="rest" role="timer" aria-live="off">
          <div className="row between">
            <div>
              <div className="tiny muted">휴식</div>
              <div className="rest-time">{mmss(restLeft)}</div>
            </div>
            <div className="row">
              <button className="btn sm" onClick={() => patch((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) - 15000 }))}>−15</button>
              <button className="btn sm" onClick={() => patch((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) + 15000, restTotal: (x.restTotal ?? 0) + 15 }))}>+15</button>
              <button className="btn sm primary" onClick={() => patch((x) => ({ ...x, restEndsAt: undefined }))}>건너뛰기</button>
            </div>
          </div>
          <div className="rest-bar"><div style={{ width: `${Math.max(0, Math.min(100, (restLeft / (s.restTotal || 1)) * 100))}%` }} /></div>
        </div>
      )}

      <Sheet open={!!rpeFor} onClose={() => setRpeFor(null)} title="이번 세트 어땠어요?">
        <div className="stack">
          {RPE_OPTIONS.map((o) => (
            <button key={o.rpe} className="option" onClick={() => { if (rpeFor) complete(rpeFor.ei, rpeFor.si, o.rpe); setRpeFor(null); }}>
              <span className="grow"><b>{o.label}</b><div className="small muted">{o.hint}</div></span>
            </button>
          ))}
          <p className="small muted">기록한 난이도로 다음 무게를 정해요.</p>
        </div>
      </Sheet>

      <Sheet open={!!noteFor} onClose={() => setNoteFor(null)} title="종목 메모">
        <div className="stack">
          <textarea rows={4} value={noteText} onChange={(ev) => setNoteText(ev.target.value)} placeholder="예: 팔꿈치 45도, 의자 높이 4번" />
          <p className="small muted">다음에 이 종목을 할 때 맨 위에 보여요.</p>
          <button className="btn primary block" onClick={() => {
            const id = noteFor!;
            update((d) => ({ ...d, notes: { ...d.notes, [id]: noteText.trim() } }));
            setNoteFor(null);
          }}>저장</button>
        </div>
      </Sheet>

      <ExerciseInfo id={infoFor?.id ?? null} profile={data.profile} onClose={() => setInfoFor(null)}
        onSwap={(newId) => {
          const ei = infoFor!.ei;
          patch((x) => ({
            ...x, exercises: x.exercises.flatMap((y, i) => {
              if (i !== ei) return [y];
              const doneSets = y.sets.filter((st) => st.done);
              const remaining = Math.max(1, y.sets.filter((st) => !st.done && !st.isWarmup).length);
              const next = buildExercise({ ...freePlan(newId, data.profile), sets: remaining, repMin: y.plan.repMin, repMax: y.plan.repMax, restSec: y.plan.restSec }, done);
              // 이미 끝낸 세트는 원래 종목에 남기고, 남은 세트만 새 종목으로 (기록 손실 방지)
              return doneSets.length ? [{ ...y, sets: doneSets }, next] : [next];
            }),
          }));
          setInfoFor(null);
        }} />

      <ExercisePicker open={picker} profile={data.profile} onClose={() => setPicker(false)} onPick={(id) => {
        patch((x) => ({ ...x, exercises: [...x.exercises, buildExercise(freePlan(id, data.profile), done)] }));
        setPicker(false);
      }} />

      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title={doneWork < totalWork ? `${totalWork - doneWork}세트가 남았어요` : '운동을 마칠까요?'}>
        <div className="stack">
          <button className="btn primary block" disabled={doneWork === 0} onClick={finish}>운동 완료</button>
          <button className="btn block" onClick={() => setConfirmEnd(false)}>계속하기</button>
          <button className="btn ghost block" onClick={cancel}>기록하지 않고 종료</button>
        </div>
      </Sheet>
    </div>
  );
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
