import { useMemo, useState } from 'react';
import {
  ALL_MUSCLES, EXERCISE_BY_ID, PAIN_DISCLAIMER, generateProgram,
  type Equipment, type Experience, type Goal, type Joint, type Muscle, type Profile, type WorkActivity,
} from '@core';
import { useStore } from '../store.tsx';
import { Chips } from '../components/ui.tsx';
import {
  EQUIPMENT_KO, EXPERIENCE_KO, GOAL_KO, GYM_PRESET, HOME_PRESET, JOINT_KO, MUSCLE_KO, WORK_KO,
} from '../labels.ts';
import { underCovered } from '../logic.ts';

const SPLIT_KO = { fullBody: '전신 분할', upperLower: '상체/하체 분할', upperLowerPpl: '상·하체 + 밀기·당기기 분할', pushPullLegs: '밀기/당기기/하체 분할' };

const DEFAULT: Profile = {
  goal: 'hypertrophy', experience: 'beginner', daysPerWeek: 3, minutesPerSession: 60,
  equipment: GYM_PRESET, injuries: [], workActivity: 'sedentary', shiftWork: false, focusMuscles: [],
};

export function Onboarding({ onDone, editing }: { onDone: () => void; editing?: boolean }) {
  const { data, update } = useStore();
  const [p, setP] = useState<Profile>(data.profile ?? DEFAULT);
  const [step, setStep] = useState(0);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const place = sameSet(p.equipment, GYM_PRESET) ? 'gym' : sameSet(p.equipment, HOME_PRESET) ? 'home' : 'custom';

  const preview = useMemo(() => (step === 7 ? generateProgram(p) : null), [step, p]);

  const steps = [
    {
      title: '어떤 몸을 만들고 싶나요?',
      body: (
        <div className="stack">
          {(Object.keys(GOAL_KO) as Goal[]).map((g) => (
            <button key={g} className={`option ${p.goal === g ? 'on' : ''}`} onClick={() => set('goal', g)}>
              <span className="emoji">{GOAL_KO[g].emoji}</span>
              <span className="grow"><b>{GOAL_KO[g].label}</b><div className="small muted">{GOAL_KO[g].desc}</div></span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: '운동 경력은요?',
      body: (
        <div className="stack">
          {(Object.keys(EXPERIENCE_KO) as Experience[]).map((e) => (
            <button key={e} className={`option ${p.experience === e ? 'on' : ''}`} onClick={() => set('experience', e)}>
              <span className="grow"><b>{EXPERIENCE_KO[e].label}</b><div className="small muted">{EXPERIENCE_KO[e].desc}</div></span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: '얼마나 자주, 얼마나 길게?',
      body: (
        <div className="stack">
          <div className="section-label">일주일에</div>
          <Chips value={p.daysPerWeek} onChange={(v) => set('daysPerWeek', v)}
            options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}회` }))} />
          <div className="section-label">한 번에</div>
          <Chips value={p.minutesPerSession} onChange={(v) => set('minutesPerSession', v)}
            options={[30, 45, 60, 75, 90].map((n) => ({ value: n, label: `${n}분` }))} />
        </div>
      ),
    },
    {
      title: '어디서 운동하나요?',
      body: (
        <div className="stack">
          <button className={`option ${place === 'gym' ? 'on' : ''}`} onClick={() => set('equipment', GYM_PRESET)}>
            <span className="emoji">🏢</span><span className="grow"><b>헬스장</b><div className="small muted">바벨, 덤벨, 머신, 케이블</div></span>
          </button>
          <button className={`option ${place === 'home' ? 'on' : ''}`} onClick={() => set('equipment', HOME_PRESET)}>
            <span className="emoji">🏠</span><span className="grow"><b>집</b><div className="small muted">덤벨, 밴드, 맨몸</div></span>
          </button>
          <div className="section-label">가진 기구 직접 고르기</div>
          <Chips multi value={p.equipment} onChange={(v: Equipment[]) => set('equipment', v)}
            options={(Object.keys(EQUIPMENT_KO) as Array<keyof typeof EQUIPMENT_KO>).map((k) => ({ value: k, label: EQUIPMENT_KO[k] }))} />
          <p className="small muted">맨몸 운동은 항상 포함돼요.</p>
        </div>
      ),
    },
    {
      title: '불편한 곳이 있나요?',
      body: (
        <div className="stack">
          <Chips multi value={p.injuries} onChange={(v: Joint[]) => set('injuries', v)}
            options={(Object.keys(JOINT_KO) as Joint[]).map((j) => ({ value: j, label: JOINT_KO[j] }))} />
          <div className="card small muted">
            고른 부위에 부담이 큰 종목은 뒤로 미루고, 꼭 필요하면 <b>가볍게</b> 시작하게 해요.
            운동을 빼지는 않아요. 관절 주변 근육을 키우는 게 대부분 도움이 되기 때문이에요.
            <div style={{ marginTop: 8 }}>{PAIN_DISCLAIMER}</div>
          </div>
        </div>
      ),
    },
    {
      title: '평소에 어떻게 일하나요?',
      body: (
        <div className="stack">
          {(Object.keys(WORK_KO) as WorkActivity[]).map((w) => (
            <button key={w} className={`option ${p.workActivity === w ? 'on' : ''}`} onClick={() => set('workActivity', w)}>
              <span className="grow"><b>{WORK_KO[w].label}</b><div className="small muted">{WORK_KO[w].desc}</div></span>
            </button>
          ))}
          <button className={`option ${p.shiftWork ? 'on' : ''}`} onClick={() => set('shiftWork', !p.shiftWork)}>
            <span className="grow"><b>교대·야간 근무를 해요</b><div className="small muted">회복을 고려해 양을 조금 줄여요</div></span>
          </button>
          <p className="small muted">앉아서 일하면 목·어깨에 좋은 등 위쪽·어깨 뒤쪽 운동을 늘려요.</p>
        </div>
      ),
    },
    {
      title: '더 키우고 싶은 부위가 있나요?',
      body: (
        <div className="stack">
          <Chips multi value={p.focusMuscles ?? []} onChange={(v: Muscle[]) => set('focusMuscles', v)}
            options={ALL_MUSCLES.filter((m) => m !== 'forearms').map((m) => ({ value: m, label: MUSCLE_KO[m] }))} />
          <p className="small muted">고르지 않으면 고르게 짜요.</p>
          <div className="section-label">성별 (선택)</div>
          <Chips value={p.sex ?? 'unspecified'} onChange={(v) => set('sex', v)}
            options={[{ value: 'female', label: '여성' }, { value: 'male', label: '남성' }, { value: 'unspecified', label: '밝히지 않음' }]} />
          <p className="small muted">같은 운동에 대한 성장률은 남녀가 비슷해서 루틴은 똑같이 짜요. 통계에만 써요.</p>
        </div>
      ),
    },
    {
      title: '이렇게 짜 봤어요',
      body: preview && (
        <div className="stack">
          <div className="card hero">
            <div className="small muted">주 {p.daysPerWeek}회 · {p.minutesPerSession}분</div>
            <div className="h2">{SPLIT_KO[preview.split]}</div>
          </div>
          {underCovered(preview).length > 0 && (
            <div className="card small">
              ⏱️ 시간이 빠듯해서 {underCovered(preview).map((m) => MUSCLE_KO[m]).join(', ')} 운동량이 목표보다 적어요.
              시간을 늘리거나 횟수를 늘리면 더 좋아요.
            </div>
          )}
          {preview.days.map((d, i) => (
            <div key={i} className="card">
              <div className="row between"><b>{d.name}</b><span className="small muted">{d.exercises.length}종목</span></div>
              <div className="small muted" style={{ marginTop: 6 }}>
                {d.exercises.map((e) => EXERCISE_BY_ID.get(e.exerciseId)!.nameKo).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;
  const finish = () => {
    const program = generateProgram(p);
    update((d) => ({ ...d, profile: p, program }));
    onDone();
  };

  return (
    <div className="screen no-tab">
      <div className="stack">
        <div className="row">
          {(step > 0 || editing) && (
            <button className="icon-btn" aria-label="뒤로" onClick={() => (step > 0 ? setStep(step - 1) : onDone())}>‹</button>
          )}
          <div className="steps grow">{steps.map((_, i) => <div key={i} className={i <= step ? 'on' : ''} />)}</div>
        </div>
        <div className="title" style={{ marginTop: 12 }}>{steps[step]!.title}</div>
        {steps[step]!.body}
      </div>
      <div className="bottom-cta">
        <button className="btn primary block"
          onClick={() => (last ? finish() : setStep(step + 1))}>
          {last ? (editing ? '이 루틴으로 바꾸기' : '이대로 시작하기') : '다음'}
        </button>
      </div>
    </div>
  );
}

function sameSet<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
