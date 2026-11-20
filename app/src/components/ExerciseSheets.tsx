import { useMemo, useState } from 'react';
import {
  ALL_MUSCLES, DEFAULT_BREATH, EXERCISES, EXERCISE_BY_ID, GUIDES, MUSCLE_INFO, alternativesFor, isAvailable,
  type Muscle, type Profile,
} from '@core';
import { Chips, LineChart, Sheet } from './ui.tsx';
import { Anatomy3D } from './Anatomy3D.tsx';
import { BodyMap } from './BodyMap.tsx';
import { EQUIPMENT_KO, JOINT_KO, LENGTH_KO, MUSCLE_KO } from '../labels.ts';
import { EquipmentIcon } from './EquipmentIcon.tsx';
import { useStore } from '../store.tsx';
import { completedSessions, e1rmHistory, fmtDate, fmtKg, lastTwo } from '../logic.ts';

export function ExercisePicker({ open, onClose, onPick, profile }: {
  open: boolean; onClose: () => void; onPick: (id: string) => void; profile?: Profile;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="종목 추가">
      <ExerciseList profile={profile} onPick={onPick} />
    </Sheet>
  );
}

/** 운동 도감 목록: 검색 + 부위 필터 */
export function ExerciseList({ profile, onPick, action = '＋' }: { profile?: Profile; onPick: (id: string) => void; action?: string }) {
  const [q, setQ] = useState('');
  const [m, setM] = useState<Muscle | 'all'>('all');
  const list = useMemo(() => EXERCISES
    .filter((e) => (m === 'all' || e.primary.includes(m)) && (q === '' || e.nameKo.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(profile ? isAvailable(b, profile) : 1) - Number(profile ? isAvailable(a, profile) : 1)),
  [q, m, profile]);
  return (
    <div className="stack">
      <input placeholder="종목 검색 (예: 스쿼트, row)" value={q} onChange={(e) => setQ(e.target.value)} />
      <Chips value={m} onChange={setM}
        options={[{ value: 'all' as const, label: '전체' }, ...ALL_MUSCLES.map((x) => ({ value: x, label: MUSCLE_KO[x] }))]} />
      <div className="card" style={{ padding: '4px 14px' }}>
        {list.map((e) => {
          const ok = profile ? isAvailable(e, profile) : true;
          return (
            <button key={e.id} className="list-row" onClick={() => onPick(e.id)} style={{ opacity: ok ? 1 : 0.5 }}>
              <span className="grow">
                <b>{e.nameKo}</b>
                <div className="small muted">{e.primary.map((x) => MUSCLE_KO[x]).join(', ')}{ok ? '' : ' · 기구 없음'}</div>
              </span>
              {e.lengthBias === 'lengthened' && <span className="tag">늘어난 위치</span>}
              <span className="muted bold">{action}</span>
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">찾는 종목이 없어요</div>}
      </div>
    </div>
  );
}

/** 종목 상세: 자극 근육 지도, 수행 방법, 내 기록, 대체 종목 */
export function ExerciseDetail({ id, onClose, onSwap, onOpenMuscle }: {
  id: string | null; onClose: () => void; onSwap?: (newId: string) => void; onOpenMuscle?: (m: Muscle) => void;
}) {
  const { data } = useStore();
  const ex = id ? EXERCISE_BY_ID.get(id) : undefined;
  const g = id ? GUIDES[id] : undefined;
  const profile = data.profile;
  const sessions = completedSessions(data);
  const alts = id && profile ? alternativesFor(id, profile).slice(0, 6) : [];
  const hist = id ? e1rmHistory(sessions, id) : [];
  const last = id ? lastTwo(sessions, id)[0] : [];
  const lastSession = id ? [...sessions].reverse().find((s) => s.exercises.some((e) => e.exerciseId === id)) : undefined;
  const conflicts = ex?.stressedJoints.filter((j) => profile?.injuries.includes(j)) ?? [];

  return (
    <Sheet open={!!ex} onClose={onClose}>
      {ex && g && (
        <div className="stack">
          <div>
            <div className="title" style={{ fontSize: 24 }}>{ex.nameKo}</div>
            <div className="small muted">{ex.nameEn} · {ex.mechanic === 'compound' ? '다관절' : '단관절'} · {LENGTH_KO[ex.lengthBias]}</div>
          </div>

          {ex.equipment.some((q) => q !== 'bodyweight') && (
            <div className="row wrap" style={{ gap: 8 }}>
              {ex.equipment.filter((q): q is Exclude<typeof q, 'bodyweight'> => q !== 'bodyweight').map((q) => (
                <span key={q} className="tag" style={{ padding: '2px 8px 2px 2px', gap: 4 }}>
                  <EquipmentIcon id={q} size={22} />{EQUIPMENT_KO[q]}
                </span>
              ))}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="card flat small" style={{ background: '#ffe4bd', color: '#6b3d00' }}>
              ⚠️ {conflicts.map((j) => JOINT_KO[j]).join('·')}에 부담이 갈 수 있어요. 가벼운 무게, 통증 없는 범위로 하세요.
            </div>
          )}

          <div className="card">
            <Anatomy3D src={`exercises3d/${ex.id}.webp`} alt={`${ex.nameKo} 자극 근육 3D`}
              fallback={<BodyMap primary={ex.primary} secondary={ex.secondary} size={170} onTap={onOpenMuscle} />} />
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {ex.primary.map((m) => (
                <button key={m} className="row" style={{ textAlign: 'left' }} onClick={() => onOpenMuscle?.(m)}>
                  <span className="tag accent">주동근</span>
                  <span className="grow small"><b>{MUSCLE_KO[m]}</b> <span className="muted">{MUSCLE_INFO[m].anatomy}</span></span>
                </button>
              ))}
              {ex.secondary.map((m) => (
                <button key={m} className="row" style={{ textAlign: 'left' }} onClick={() => onOpenMuscle?.(m)}>
                  <span className="tag">보조근</span>
                  <span className="grow small"><b>{MUSCLE_KO[m]}</b> <span className="muted">{MUSCLE_INFO[m].anatomy}</span></span>
                </button>
              ))}
            </div>
          </div>

          <a className="btn block" href={youtubeSearch(ex.nameKo)} target="_blank" rel="noopener noreferrer">
            ▶ 유튜브에서 자세 영상 보기
          </a>

          <div className="card gold">
            <b>🎯 여기에 자극이 와야 해요</b>
            <p className="small" style={{ marginTop: 4 }}>{g.feel}</p>
          </div>

          <div className="card">
            <b>준비 자세</b>
            <ul className="bullet small" style={{ marginTop: 6 }}>{g.setup.map((s) => <li key={s}>{s}</li>)}</ul>
            <div className="section-label" style={{ marginTop: 14 }}>동작</div>
            <ol className="steps-list small" style={{ marginTop: 8 }}>{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            {ex.cues.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 14 }}>핵심 포인트</div>
                <ul className="bullet small" style={{ marginTop: 6 }}>{ex.cues.map((c) => <li key={c}>{c}</li>)}</ul>
              </>
            )}
            <div className="section-label" style={{ marginTop: 14 }}>호흡</div>
            <p className="small" style={{ marginTop: 4 }}>{g.breath ?? DEFAULT_BREATH}</p>
          </div>

          <div className="card">
            <b>❌ 흔한 실수</b>
            <ul className="bullet small" style={{ marginTop: 6 }}>{g.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>

          {ex.primary.some((m) => MUSCLE_INFO[m].lengthNote) && (
            <div className="card flat small">
              🔬 {ex.primary.map((m) => MUSCLE_INFO[m].lengthNote).filter(Boolean).join(' / ')}
            </div>
          )}

          <div className="card">
            <b>📈 내 기록</b>
            {last.length ? (
              <>
                <p className="small muted" style={{ marginTop: 4 }}>
                  지난번 ({lastSession ? fmtDate(lastSession.startedAt) : ''}): {last.map((s) => `${fmtKg(s.weightKg)}kg×${s.reps}`).join(' · ')}
                </p>
                <LineChart points={hist} height={120} />
              </>
            ) : <p className="small muted" style={{ marginTop: 4 }}>아직 기록이 없어요</p>}
          </div>

          {alts.length > 0 && (
            <div className="card" style={{ padding: '12px 14px' }}>
              <b>🔁 대신 할 수 있는 종목</b>
              {alts.map((a) => (
                <div key={a.id} className="list-row">
                  <span className="grow">
                    <b className="small">{a.nameKo}</b>
                    <div className="tiny muted">
                      {a.primary.map((m) => MUSCLE_KO[m]).join(', ')}
                      {a.stressedJoints.some((j) => profile?.injuries.includes(j)) ? ' · 불편 부위 주의' : ''}
                    </div>
                  </span>
                  {onSwap && <button className="btn sm primary" onClick={() => onSwap(a.id)}>바꾸기</button>}
                </div>
              ))}
            </div>
          )}
          <p className="tiny muted">
            일반적인 운동 요령이며 의료 조언이 아니에요. 통증이 있으면 멈추세요.
            {ex.source ? ' 동작 설명은 free-exercise-db(퍼블릭 도메인)를 번역·보강했어요.' : ''} 3D 근육: BodyParts3D © DBCLS (CC BY-SA 2.1 JP)
          </p>
        </div>
      )}
    </Sheet>
  );
}

/** 근육 도감: 해부학 정보, 내 레벨, 이 근육을 쓰는 종목 */
export function MuscleDetail({ muscle, onClose, onOpenExercise, level }: {
  muscle: Muscle | null; onClose: () => void; onOpenExercise: (id: string) => void;
  level?: { level: number; into: number; need: number };
}) {
  const info = muscle ? MUSCLE_INFO[muscle] : undefined;
  const exercises = muscle ? EXERCISES.filter((e) => e.primary.includes(muscle))
    .sort((a, b) => Number(b.lengthBias === 'lengthened') - Number(a.lengthBias === 'lengthened')) : [];
  return (
    <Sheet open={!!muscle} onClose={onClose}>
      {muscle && info && (
        <div className="stack">
          <div className="row between">
            <div>
              <div className="title" style={{ fontSize: 24 }}>{MUSCLE_KO[muscle]}</div>
              <div className="small muted">{info.anatomy}</div>
            </div>
            {level && <span className="lv">Lv.{level.level}</span>}
          </div>
          {level && <div className="xp-bar"><div style={{ width: `${(level.into / level.need) * 100}%` }} /></div>}
          <div className="card">
            <Anatomy3D src={`muscles3d/${muscle}.webp`} alt={`${MUSCLE_KO[muscle]} 3D`} fallback={<BodyMap primary={[muscle]} size={150} />} />
            <p className="tiny muted" style={{ textAlign: 'center' }}>3D 모델: BodyParts3D © DBCLS (CC BY-SA 2.1 JP)</p>
          </div>
          <div className="card">
            <b>구성</b>
            <ul className="bullet small" style={{ marginTop: 6 }}>{info.parts.map((p) => <li key={p}>{p}</li>)}</ul>
            <div className="section-label" style={{ marginTop: 12 }}>하는 일</div>
            <ul className="bullet small" style={{ marginTop: 6 }}>{info.actions.map((p) => <li key={p}>{p}</li>)}</ul>
            <div className="section-label" style={{ marginTop: 12 }}>자극 키우는 요령</div>
            <ul className="bullet small" style={{ marginTop: 6 }}>{info.tips.map((p) => <li key={p}>{p}</li>)}</ul>
            {info.lengthNote && <p className="small" style={{ marginTop: 10 }}>🔬 {info.lengthNote}</p>}
          </div>
          <div className="card" style={{ padding: '12px 14px' }}>
            <b>이 근육을 키우는 종목</b>
            {exercises.map((e) => (
              <button key={e.id} className="list-row" onClick={() => onOpenExercise(e.id)}>
                <span className="grow small"><b>{e.nameKo}</b></span>
                {e.lengthBias === 'lengthened' && <span className="tag">늘어난 위치</span>}
                <span className="muted">›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** 유튜브 검색 결과로 연결 (영상을 가져오지 않고 링크만 걸어 저작권·용량 문제 없음) */
function youtubeSearch(nameKo: string): string {
  const q = nameKo.replace(/\s*\(.*?\)\s*/g, ' ').trim() + ' 자세';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
