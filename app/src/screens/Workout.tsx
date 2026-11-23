import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  EXERCISE_BY_ID, estimateSeconds, incrementFor, isBodyweightExercise, setXp, weightUnitLabel,
  type Exercise, type Muscle,
} from '@core';
import { useStore, type LoggedSet, type Session, type SessionExercise } from '../store.tsx';
import { NumInput, Sheet, Stepper } from '../components/ui.tsx';
import { sessionXp } from '../game.ts';
import { JOINT_KO, MUSCLE_KO, RPE_OPTIONS } from '../labels.ts';
import { buildExercise, completedSessions, fmtKg, freePlan, lastTwo } from '../logic.ts';
import { beep, speak, unlockAudio, useNow, useWakeLock } from '../hooks.ts';

const InlineGuide = lazy(() => import('../components/ExerciseSheets.tsx').then((m) => ({ default: m.InlineGuide })));
const ExerciseDetail = lazy(() => import('../components/ExerciseSheets.tsx').then((m) => ({ default: m.ExerciseDetail })));
const ExercisePicker = lazy(() => import('../components/ExerciseSheets.tsx').then((m) => ({ default: m.ExercisePicker })));

const img3d = (id: string) => `${import.meta.env.BASE_URL}exercises3d/${id}.webp`;

/*
 * 운동 화면 3단계 (역설계 앱 참고)
 * 1) 미리보기: 오늘 할 종목·예상 시간·추천 무게를 보고 바꾸기/빼기 후 시작 (플랜핏)
 * 2) 한 종목씩 보기(기본): 지금 할 세트만 크게, +/− 로 무게·횟수, 세트 완료 → 휴식 중 난이도 기록 (플랜핏·짐워크)
 * 3) 전체 목록 보기: 표 형태로 빠르게 기록 (플릭)
 */
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
  const [howOpen, setHowOpen] = useState<Set<number>>(() => new Set(done.length === 0 ? [0] : []));
  const [pop, setPop] = useState<{ k: number; text: string } | null>(null);
  const view = data.settings.workoutView ?? 'focus';
  const xpNow = sessionXp(s).total;
  const alerted = useRef<number | undefined>(undefined);
  useWakeLock(s.begun !== false);

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
  // 운동을 시작하거나 다른 종목으로 넘어가면 맨 위부터 보이게 (미리보기의 스크롤 위치가 남지 않도록)
  useEffect(() => { window.scrollTo(0, 0); }, [s.begun, s.focusIndex, data.settings.workoutView]);

  const toggleHow = (ei: number) => setHowOpen((o) => { const n = new Set(o); if (n.has(ei)) n.delete(ei); else n.add(ei); return n; });

  // 휴식 종료 알림 (종료 시각 기준이라 화면을 껐다 켜도 정확)
  const restLeft = s.restEndsAt ? Math.ceil((s.restEndsAt - now) / 1000) : 0;
  const resting = !!s.restEndsAt && restLeft > 0;
  useEffect(() => {
    if (!s.restEndsAt || restLeft > 0 || alerted.current === s.restEndsAt) return;
    alerted.current = s.restEndsAt;
    if (data.settings.sound) beep(3);
    if (data.settings.voice) speak('휴식 끝. 다음 세트 시작하세요');
    patch((x) => ({ ...x, restEndsAt: undefined }));
  }, [restLeft, s.restEndsAt]);

  const complete = (ei: number, si: number, rpe?: number) => {
    unlockAudio();
    const e = s.exercises[ei]!;
    const st = e.sets[si]!;
    if (st.done && rpe === undefined) { patchSet(ei, si, { done: false, rpe: undefined }); return; }
    const finalRpe = rpe ?? st.rpe ?? 8;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (ex && !st.isWarmup && !st.done) {
      const gained = setXp({ exercise: ex, rpe: finalRpe });
      const total = Object.values(gained).reduce((a, b) => a + (b ?? 0), 0);
      const k = Date.now();
      setPop({ k, text: `+${total} XP · ${ex.primary.map((m) => MUSCLE_KO[m]).join('·')}` });
      window.setTimeout(() => setPop((p) => (p?.k === k ? null : p)), 900);
    }
    if (st.done) { patchSet(ei, si, { rpe: finalRpe }); return; } // 이미 한 세트의 난이도만 바꿈
    const lastOfEx = e.sets.every((x, j) => j === si || x.done);
    const isLastEx = ei === s.exercises.length - 1;
    const rest = st.isWarmup ? 60 : e.plan.restSec;
    patch((x) => ({
      ...x,
      exercises: x.exercises.map((y, i) => i !== ei ? y : { ...y, sets: y.sets.map((z, j) => j !== si ? z : { ...z, done: true, rpe: finalRpe }) }),
      lastDone: { ei, si },
      // 이 종목의 마지막 세트면 다음 종목으로 넘어감 (휴식은 그대로 진행)
      focusIndex: lastOfEx && !isLastEx ? ei + 1 : x.focusIndex,
      restEndsAt: lastOfEx && isLastEx ? undefined : Date.now() + rest * 1000,
      restTotal: rest,
    }));
  };

  // 목록 보기: ✓ 길게 누르면 난이도 선택
  const press = useRef<{ t?: number; longAt: number }>({ longAt: 0 });
  const onDown = (ei: number, si: number) => {
    press.current.t = window.setTimeout(() => { press.current.longAt = Date.now(); setRpeFor({ ei, si }); navigator.vibrate?.(15); }, 450);
  };
  const onCancel = () => window.clearTimeout(press.current.t);
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

  const swapExercise = (ei: number, newId: string) => patch((x) => ({
    ...x, exercises: x.exercises.flatMap((y, i) => {
      if (i !== ei) return [y];
      const doneSets = y.sets.filter((st) => st.done);
      const remaining = Math.max(1, y.sets.filter((st) => !st.done && !st.isWarmup).length);
      const next = buildExercise({ ...freePlan(newId, data.profile), sets: remaining, repMin: y.plan.repMin, repMax: y.plan.repMax, restSec: y.plan.restSec }, done, data.profile);
      // 이미 끝낸 세트는 원래 종목에 남기고, 남은 세트만 새 종목으로 (기록 손실 방지)
      return doneSets.length ? [{ ...y, sets: doneSets }, next] : [next];
    }),
  }));
  const addSet = (ei: number) => patch((x) => ({
    ...x, exercises: x.exercises.map((y, i) => {
      if (i !== ei) return y;
      const lastSet = y.sets[y.sets.length - 1];
      return { ...y, sets: [...y.sets, { weightKg: lastSet?.weightKg ?? 0, reps: lastSet?.reps ?? y.plan.repMin, done: false }] };
    }),
  }));

  const sheets = (
    <>
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
      {pop && <div key={pop.k} className="xp-pop">{pop.text}</div>}
      <Suspense fallback={null}>
        <ExerciseDetail id={infoFor?.id ?? null} onClose={() => setInfoFor(null)}
          onSwap={(newId) => { swapExercise(infoFor!.ei, newId); setInfoFor(null); }} />
        <ExercisePicker open={picker} profile={data.profile} onClose={() => setPicker(false)} onPick={(id) => {
          patch((x) => ({ ...x, exercises: [...x.exercises, buildExercise(freePlan(id, data.profile), done, data.profile)] }));
          setPicker(false);
        }} />
      </Suspense>
      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title={doneWork < totalWork ? `${totalWork - doneWork}세트가 남았어요` : '운동을 마칠까요?'}>
        <div className="stack">
          <button className="btn primary block" disabled={doneWork === 0} onClick={finish}>운동 완료</button>
          <button className="btn block" onClick={() => setConfirmEnd(false)}>계속하기</button>
          <button className="btn ghost block" onClick={cancel}>기록하지 않고 종료</button>
        </div>
      </Sheet>
    </>
  );

  // ── 1) 미리보기 ─────────────────────────────────────────
  if (s.begun === false) {
    const minutes = Math.round(s.exercises.reduce((a, e) => a + estimateSeconds(e.plan), 0) / 60);
    const muscles = [...new Set(s.exercises.flatMap((e) => EXERCISE_BY_ID.get(e.exerciseId)?.primary ?? []))] as Muscle[];
    return (
      <div className="screen no-tab">
        <div className="row between">
          <button className="icon-btn" aria-label="닫기" onClick={cancel}>✕</button>
          <span className="tag accent">미리보기</span>
        </div>
        <div className="title" style={{ marginTop: 12 }}>{s.dayName}</div>
        <div className="small muted num">약 {minutes}분 · {s.exercises.length}종목 · {totalWork}세트</div>
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          {muscles.map((m) => <span key={m} className="tag">{MUSCLE_KO[m]}</span>)}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>시작 전에 종목을 바꾸거나 뺄 수 있어요. 무게는 추천값이 들어가 있어요.</p>
        <div className="stack" style={{ marginTop: 12, gap: 10 }}>
          {s.exercises.map((e, ei) => {
            const ex = EXERCISE_BY_ID.get(e.exerciseId)!;
            const work = e.sets.filter((x) => !x.isWarmup);
            const w = work[0]?.weightKg ?? 0;
            return (
              <div key={`${e.exerciseId}-${ei}`} className="card preview-row">
                <img src={img3d(ex.id)} alt="" loading="lazy" className="thumb" />
                <div className="grow">
                  <button className="bold" style={{ textAlign: 'left' }} onClick={() => setInfoFor({ ei, id: ex.id })}>{ex.nameKo} <span className="muted small">ⓘ</span></button>
                  <div className="tiny muted">{ex.primary.map((m) => MUSCLE_KO[m]).join('·')}</div>
                  <div className="small num" style={{ marginTop: 2 }}>
                    {work.length}세트 × {e.plan.repMin}-{e.plan.repMax}회 · {isBodyweightExercise(ex) ? '맨몸' : `${fmtKg(w)}${weightUnitLabel(ex)}`}
                  </div>
                  {e.plan.caution && <span className="tag warn" style={{ marginTop: 4 }}>가볍게</span>}
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <button className="btn sm" onClick={() => setInfoFor({ ei, id: ex.id })}>교체</button>
                  <button className="btn sm ghost" style={{ color: 'var(--bad)' }} onClick={() => patch((x) => ({ ...x, exercises: x.exercises.filter((_, i) => i !== ei) }))}>빼기</button>
                </div>
              </div>
            );
          })}
          <button className="btn block" onClick={() => setPicker(true)}>＋ 종목 추가</button>
        </div>
        <div className="bottom-cta">
          <button className="btn primary block" disabled={s.exercises.length === 0}
            onClick={() => { unlockAudio(); patch((x) => ({ ...x, begun: true, startedAt: Date.now(), focusIndex: 0 })); }}>
            🔥 운동 시작
          </button>
        </div>
        {sheets}
      </div>
    );
  }

  const top = (
    <div className="player-top">
      <div className="row between">
        <button className="icon-btn" aria-label="최소화" onClick={onMinimize}>⌄</button>
        <div style={{ textAlign: 'center' }}>
          <div className="bold">{s.dayName}</div>
          <div className="small muted num">{mmss(elapsed)} · {doneWork}/{totalWork}세트 · <b style={{ color: 'var(--gold)' }}>+{xpNow} XP</b></div>
        </div>
        <button className="btn sm primary" onClick={() => setConfirmEnd(true)}>완료</button>
      </div>
      <div className="bar" style={{ marginTop: 10, height: 4 }}><div style={{ width: `${totalWork ? (doneWork / totalWork) * 100 : 0}%` }} /></div>
      <div className="seg" style={{ marginTop: 10 }}>
        <button className={view === 'focus' ? 'on' : ''} onClick={() => update((d) => ({ ...d, settings: { ...d.settings, workoutView: 'focus' } }))}>한 종목씩</button>
        <button className={view === 'list' ? 'on' : ''} onClick={() => update((d) => ({ ...d, settings: { ...d.settings, workoutView: 'list' } }))}>전체 목록</button>
      </div>
    </div>
  );

  const coach = done.length === 0 && !data.settings.coachSeen && (
    <div className="card coach small">
      <b>👋 첫 운동 사용법</b>
      {view === 'focus' ? (
        <ol>
          <li>무게·횟수는 추천값이 들어가 있어요. <b>＋ −</b>로 맞추세요</li>
          <li>한 세트를 끝내면 <b>✓ 세트 완료</b> → 휴식 타이머가 시작돼요</li>
          <li>쉬는 동안 <b>방금 세트가 어땠는지</b> 눌러 주세요. 다음 무게에 반영돼요</li>
          <li>동작을 모르면 <b>❓ 어떻게 해요?</b>, 그림·영상은 <b>🧍 자세히</b></li>
        </ol>
      ) : (
        <ol>
          <li><b>무게·횟수</b>는 추천값이 들어가 있어요. 숫자를 눌러 바꾸세요</li>
          <li>한 세트를 끝내면 오른쪽 <b>✓</b> → 휴식 타이머 시작</li>
          <li>✓를 <b>길게</b> 누르면 쉬웠는지·힘들었는지 기록돼요</li>
        </ol>
      )}
      <button className="btn sm" style={{ marginTop: 10 }} onClick={() => update((d) => ({ ...d, settings: { ...d.settings, coachSeen: true } }))}>알겠어요</button>
    </div>
  );

  const exTitle = (e: SessionExercise, ei: number, ex: Exercise) => (
    <div className="ex-head">
      <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <button onClick={() => setInfoFor({ ei, id: ex.id })} aria-label={`${ex.nameKo} 자세히`}>
          <img src={img3d(ex.id)} alt="" loading="lazy" className="thumb" />
        </button>
        <div className="grow">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <button className="h2" style={{ textAlign: 'left' }} onClick={() => setInfoFor({ ei, id: ex.id })}>{ex.nameKo}</button>
            <span className="tag num" style={{ flexShrink: 0 }}>{e.plan.repMin}-{e.plan.repMax}회</span>
          </div>
          <div className="small" style={{ marginTop: 2 }}>
            🎯 <b>{ex.primary.map((m) => MUSCLE_KO[m]).join('·')}</b>
            {ex.secondary.length > 0 && <span className="muted"> · 보조 {ex.secondary.map((m) => MUSCLE_KO[m]).join('·')}</span>}
          </div>
          <div className="small muted">💪 {effortText(e.plan.targetRpe)}</div>
        </div>
      </div>
      {e.plan.caution && <div style={{ marginTop: 6 }}><span className="tag warn">{e.plan.caution.map((j) => JOINT_KO[j]).join('·')} 주의 · 통증 없는 범위로</span></div>}
      {e.reason && <div className="small" style={{ marginTop: 6, color: 'var(--accent)', fontWeight: 700 }}>{e.reason}</div>}
    </div>
  );

  const exHelp = (ei: number, ex: Exercise) => (
    <div className="ex-help">
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm grow" aria-expanded={howOpen.has(ei)} onClick={() => toggleHow(ei)}>{howOpen.has(ei) ? '▲ 접기' : '❓ 어떻게 해요?'}</button>
        <button className="btn sm grow" onClick={() => setInfoFor({ ei, id: ex.id })}>🧍 자세히 (3D·영상)</button>
      </div>
      {howOpen.has(ei) && (
        <Suspense fallback={<div className="small muted" style={{ marginTop: 8 }}>불러오는 중…</div>}>
          <InlineGuide id={ex.id} />
        </Suspense>
      )}
      {data.notes[ex.id] && <div className="note" style={{ margin: '8px 0 0' }}>📝 {data.notes[ex.id]}</div>}
    </div>
  );

  // ── 2) 한 종목씩 보기 ────────────────────────────────────
  if (view === 'focus') {
    const firstOpen = s.exercises.findIndex((e) => e.sets.some((x) => !x.done));
    const fi = Math.min(Math.max(0, s.focusIndex ?? (firstOpen < 0 ? 0 : firstOpen)), Math.max(0, s.exercises.length - 1));
    const e = s.exercises[fi];
    const ex = e ? EXERCISE_BY_ID.get(e.exerciseId) : undefined;
    const ci = e ? e.sets.findIndex((x) => !x.done) : -1;
    const cur = e && ci >= 0 ? e.sets[ci] : undefined;
    const prev = e ? prevByEx.get(e.exerciseId) ?? [] : [];
    const workIndex = (si: number) => e!.sets.slice(0, si + 1).filter((x) => !x.isWarmup).length;
    const workCount = e ? e.sets.filter((x) => !x.isWarmup).length : 0;
    const prevSame = cur && !cur.isWarmup ? prev[workIndex(ci) - 1] : undefined;
    const last = s.lastDone ? s.exercises[s.lastDone.ei]?.sets[s.lastDone.si] : undefined;
    // 휴식 뒤에 할 것: 지금 보고 있는 종목의 다음 세트
    const nextInfo = cur && ex
      ? `${ex.nameKo} · ${cur.isWarmup ? '워밍업' : `${workIndex(ci)}세트`} · ${isBodyweightExercise(ex) && !cur.weightKg ? '' : `${fmtKg(cur.weightKg)}kg × `}${cur.reps}회`
      : null;
    const go = (i: number) => patch((x) => ({ ...x, focusIndex: Math.max(0, Math.min(x.exercises.length - 1, i)) }));

    return (
      <div className="screen no-tab">
        {top}
        <div className="stack">
          {coach}
          <div className="ex-dots" role="tablist" aria-label="종목">
            {s.exercises.map((y, i) => {
              const all = y.sets.every((z) => z.done);
              return <button key={i} role="tab" aria-selected={i === fi} aria-label={`${i + 1}번째 종목 ${EXERCISE_BY_ID.get(y.exerciseId)?.nameKo ?? ''}${all ? ' 완료' : ''}`}
                className={`dot-btn ${i === fi ? 'on' : ''} ${all ? 'done' : ''}`} onClick={() => go(i)}>{all ? '✓' : i + 1}</button>;
            })}
          </div>

          {e && ex ? (
            <div className="ex-card">
              {exTitle(e, fi, ex)}

              {resting ? (
                <div className="focus-box rest-box" role="timer">
                  <div className="tiny muted bold">휴식</div>
                  <div className="big-time num">{mmss(restLeft)}</div>
                  <div className="rest-bar"><div style={{ width: `${Math.max(0, Math.min(100, (restLeft / (s.restTotal || 1)) * 100))}%` }} /></div>
                  <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
                    <button className="btn sm" onClick={() => patch((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) - 15000 }))}>−15초</button>
                    <button className="btn sm" onClick={() => patch((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) + 15000, restTotal: (x.restTotal ?? 0) + 15 }))}>+15초</button>
                    <button className="btn sm primary" onClick={() => patch((x) => ({ ...x, restEndsAt: undefined }))}>바로 시작</button>
                  </div>
                  {last && s.lastDone && !last.isWarmup && (
                    <>
                      <div className="small bold" style={{ marginTop: 14 }}>방금 세트 어땠어요?</div>
                      <div className="row" style={{ marginTop: 6, gap: 6 }}>
                        {RPE_OPTIONS.map((o) => (
                          <button key={o.rpe} className={`chip grow ${last.rpe === o.rpe ? 'on' : ''}`} style={{ padding: '8px 4px', textAlign: 'center' }}
                            onClick={() => patchSet(s.lastDone!.ei, s.lastDone!.si, { rpe: o.rpe })}>{o.label}</button>
                        ))}
                      </div>
                      <div className="tiny muted" style={{ marginTop: 4 }}>다음 운동의 추천 무게에 반영돼요</div>
                    </>
                  )}
                  {nextInfo && <div className="small" style={{ marginTop: 12 }}>다음 ▶ <b>{nextInfo}</b></div>}
                </div>
              ) : cur ? (
                <div className="focus-box">
                  <div className="row between">
                    <b className="h2">{cur.isWarmup ? '워밍업' : `세트 ${workIndex(ci)} / ${workCount}`}</b>
                    {prevSame && <span className="small muted num">지난번 {fmtKg(prevSame.weightKg)}kg × {prevSame.reps}</span>}
                  </div>
                  {cur.isWarmup && <div className="tiny muted">본 세트 전에 가볍게 몸을 데우는 세트예요</div>}
                  <div className="stack" style={{ gap: 10, marginTop: 12 }}>
                    <Stepper label="무게" unit={weightUnitLabel(ex)} decimal step={isBodyweightExercise(ex) ? 2.5 : incrementFor(ex)}
                      value={cur.weightKg} placeholder={isBodyweightExercise(ex) ? '맨몸' : '0'} onChange={(n) => editValue(fi, ci, 'weightKg', n)} />
                    <Stepper label="횟수" unit="회" step={1} min={1} value={cur.reps} onChange={(n) => editValue(fi, ci, 'reps', Math.round(n))} />
                  </div>
                  <button className="btn primary block big-done" onClick={() => complete(fi, ci)}>✓ 세트 완료</button>
                </div>
              ) : (
                <div className="focus-box" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36 }}>✅</div>
                  <b>{ex.nameKo} 완료!</b>
                  {fi < s.exercises.length - 1
                    ? <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => go(fi + 1)}>다음 종목 ▶</button>
                    : <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => setConfirmEnd(true)}>🎉 운동 마치기</button>}
                </div>
              )}

              {exHelp(fi, ex)}
              <div className="mini-sets">
                {e.sets.map((x, si) => (
                  <button key={si} className={`mini-set ${x.done ? 'done' : ''} ${si === ci && !resting ? 'cur' : ''}`}
                    aria-label={`${x.isWarmup ? '워밍업' : `${workIndex(si)}세트`}${x.done ? ' 완료, 누르면 취소' : ''}`}
                    onClick={() => (x.done ? complete(fi, si) : undefined)}>
                    <span className="bold">{x.isWarmup ? 'W' : workIndex(si)}</span>
                    <span className="num">{isBodyweightExercise(ex) && !x.weightKg ? '' : `${fmtKg(x.weightKg)}×`}{x.reps}</span>
                    <span>{x.done ? (x.isWarmup ? '✓' : RPE_OPTIONS.find((o) => o.rpe === x.rpe)?.label ?? '✓') : ''}</span>
                  </button>
                ))}
              </div>
              <div className="ex-foot">
                <button className="btn sm grow" onClick={() => addSet(fi)}>＋ 세트</button>
                <button className="btn sm grow" onClick={() => setInfoFor({ ei: fi, id: ex.id })}>교체</button>
                <button className="btn sm grow" onClick={() => { setNoteFor(ex.id); setNoteText(data.notes[ex.id] ?? ''); }}>메모</button>
              </div>
            </div>
          ) : <div className="empty">아래 버튼으로 종목을 추가하세요</div>}

          <div className="row" style={{ gap: 8 }}>
            <button className="btn grow" disabled={fi === 0} onClick={() => go(fi - 1)}>◀ 이전 종목</button>
            <button className="btn grow" disabled={fi >= s.exercises.length - 1} onClick={() => go(fi + 1)}>다음 종목 ▶</button>
          </div>
          <button className="btn ghost block" onClick={() => setPicker(true)}>＋ 종목 추가</button>
        </div>
        {sheets}
      </div>
    );
  }

  // ── 3) 전체 목록 보기 ────────────────────────────────────
  return (
    <div className="screen no-tab">
      {top}
      <div className="stack">
        {coach}
        {s.exercises.length === 0 && <div className="empty">아래 버튼으로 종목을 추가하세요</div>}
        {s.exercises.map((e, ei) => {
          const ex = EXERCISE_BY_ID.get(e.exerciseId)!;
          const prev = prevByEx.get(e.exerciseId) ?? [];
          let workNo = 0;
          return (
            <div key={`${e.exerciseId}-${ei}`} className="ex-card">
              {exTitle(e, ei, ex)}
              {exHelp(ei, ex)}
              <div className="set-grid head"><span>세트</span><span>지난번</span><span style={{ textAlign: 'center' }}>{weightUnitLabel(ex)}</span><span style={{ textAlign: 'center' }}>회</span><span /></div>
              {e.sets.map((st, si) => {
                const no = st.isWarmup ? 'W' : String(++workNo);
                const p = st.isWarmup ? undefined : prev[workNo - 1];
                return (
                  <div key={si} className={`set-grid ${st.done ? 'done' : ''} ${st.isWarmup ? 'warm' : ''}`}>
                    <span className="set-no">{no}</span>
                    <span className="prev">{p ? `${fmtKg(p.weightKg)}×${p.reps}` : st.isWarmup ? '웜업' : '-'}</span>
                    <NumInput decimal label={`${no}세트 무게`} value={st.weightKg} placeholder={isBodyweightExercise(ex) ? '맨몸' : '0'} onChange={(n) => editValue(ei, si, 'weightKg', n)} />
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
                <button className="btn sm grow" onClick={() => addSet(ei)}>＋ 세트</button>
                <button className="btn sm grow" onClick={() => setInfoFor({ ei, id: e.exerciseId })}>교체</button>
                <button className="btn sm grow" onClick={() => { setNoteFor(e.exerciseId); setNoteText(data.notes[e.exerciseId] ?? ''); }}>메모</button>
              </div>
            </div>
          );
        })}
        <button className="btn block" onClick={() => setPicker(true)}>＋ 종목 추가</button>
        <p className="tiny muted" style={{ textAlign: 'center' }}>✓를 길게 누르면 난이도(쉬움·적당·힘듦·실패)를 고를 수 있어요</p>
      </div>

      {resting && (
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
      {sheets}
    </div>
  );
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** RPE를 쉬운 말로 */
function effortText(rpe: number): string {
  if (rpe >= 9) return '1회 정도 더 할 수 있을 만큼 힘들게';
  if (rpe >= 8) return '2회 정도 더 할 수 있을 만큼 (마지막 2회가 힘들게)';
  return '3회 이상 여유 있게, 자세에 집중';
}
