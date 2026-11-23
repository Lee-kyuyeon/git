import { useMemo, useState } from 'react';
import {
  ALL_MUSCLES, PAIN_DISCLAIMER, generateProgram, weeklyQuests,
  type Experience, type Goal, type Joint, type Muscle, type Profile, type WorkActivity,
} from '@core';
import { useStore } from '../store.tsx';
import { Chips } from '../components/ui.tsx';
import { EXPERIENCE_KO, GYM_PRESET, JOINT_KO, MUSCLE_KO, WORK_KO } from '../labels.ts';
import { EquipmentPicker } from '../components/EquipmentPicker.tsx';
import { CLASS_INFO } from '../game.ts';
import { underCovered } from '../logic.ts';

const DEFAULT: Profile = {
  goal: 'hypertrophy', experience: 'beginner', daysPerWeek: 3, minutesPerSession: 60,
  equipment: GYM_PRESET, injuries: [], workActivity: 'sedentary', shiftWork: false, focusMuscles: [],
};

const ZERO = Object.fromEntries(ALL_MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;

/** 캐릭터 생성: 클래스 → 훈련 일정 → 몸 상태 → 첫 퀘스트 (4화면) */
export function Onboarding({ onDone, editing }: { onDone: () => void; editing?: boolean }) {
  const { data, update } = useStore();
  const [p, setP] = useState<Profile>(data.profile ?? DEFAULT);
  const [step, setStep] = useState(0);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const program = useMemo(() => (step === 3 ? generateProgram(p) : null), [step, p]);

  const screens = [
    {
      kicker: 'STEP 1 · 클래스',
      title: '어떤 캐릭터로 시작할까요?',
      body: (
        <div className="stack">
          <div className="class-grid">
            {(Object.keys(CLASS_INFO) as Goal[]).map((g) => (
              <button key={g} className={`class-card ${p.goal === g ? 'on' : ''}`} aria-pressed={p.goal === g} onClick={() => set('goal', g)}>
                <span className="emoji">{CLASS_INFO[g].emoji}</span>
                <b>{CLASS_INFO[g].name}</b>
                <div className="tiny" style={{ opacity: .8 }}>{CLASS_INFO[g].desc}</div>
              </button>
            ))}
          </div>
          <div className="section-label">시작 레벨 (운동 경력)</div>
          <div className="seg">
            {(Object.keys(EXPERIENCE_KO) as Experience[]).map((e) => (
              <button key={e} className={p.experience === e ? 'on' : ''} onClick={() => set('experience', e)}>
                {EXPERIENCE_KO[e].label}<div className="tiny" style={{ opacity: .75 }}>{EXPERIENCE_KO[e].desc}</div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      kicker: 'STEP 2 · 훈련 일정',
      title: '언제, 어디서 훈련하나요?',
      body: (
        <div className="stack">
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>일주일에</div>
            <div style={{ marginTop: 8 }}><Chips value={p.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}회` }))} /></div>
            <div className="section-label">한 번에</div>
            <div style={{ marginTop: 8 }}><Chips value={p.minutesPerSession} onChange={(v) => set('minutesPerSession', v)} options={[30, 45, 60, 75, 90].map((n) => ({ value: n, label: `${n}분` }))} /></div>
          </div>
          <EquipmentPicker value={p.equipment} onChange={(v) => set('equipment', v)} profile={p} />
        </div>
      ),
    },
    {
      kicker: 'STEP 3 · 몸 상태',
      title: '지금 몸 상태를 알려주세요',
      body: (
        <div className="stack">
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>불편한 곳</div>
            <div style={{ marginTop: 8 }}>
              <Chips multi value={p.injuries} onChange={(v: Joint[]) => set('injuries', v)}
                options={(Object.keys(JOINT_KO) as Joint[]).map((j) => ({ value: j, label: JOINT_KO[j] }))} />
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>운동을 빼지 않고, 부담이 적은 종목을 먼저 고르고 가볍게 시작하게 해요. {PAIN_DISCLAIMER}</p>
          </div>
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>평소 일하는 방식</div>
            <div style={{ marginTop: 8 }}>
              <Chips value={p.workActivity ?? 'standing'} onChange={(v: WorkActivity) => set('workActivity', v)}
                options={(Object.keys(WORK_KO) as WorkActivity[]).map((w) => ({ value: w, label: WORK_KO[w].label }))} />
            </div>
            <div className="row between" style={{ marginTop: 10 }}>
              <span className="small">교대·야간 근무</span>
              <button className={`toggle ${p.shiftWork ? 'on' : ''}`} role="switch" aria-checked={!!p.shiftWork} aria-label="교대 근무" onClick={() => set('shiftWork', !p.shiftWork)} />
            </div>
          </div>
          <div className="card">
            <div className="section-label" style={{ marginTop: 0 }}>집중 육성 부위 (선택)</div>
            <div style={{ marginTop: 8 }}>
              <Chips multi value={p.focusMuscles ?? []} onChange={(v: Muscle[]) => set('focusMuscles', v)}
                options={ALL_MUSCLES.filter((m) => m !== 'forearms').map((m) => ({ value: m, label: MUSCLE_KO[m] }))} />
            </div>
            <div className="section-label">체중 (선택)</div>
            <div className="row" style={{ marginTop: 8 }}>
              <input inputMode="decimal" placeholder="예: 70" style={{ maxWidth: 120 }} value={p.bodyWeightKg ?? ''}
                onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); set('bodyWeightKg', n > 20 && n < 300 ? n : undefined); }} />
              <span className="small muted">kg · 처음 추천 무게 계산에만 써요</span>
            </div>
            <div className="section-label">성별 (선택)</div>
            <div style={{ marginTop: 8 }}>
              <Chips value={p.sex ?? 'unspecified'} onChange={(v) => set('sex', v)}
                options={[{ value: 'female', label: '여성' }, { value: 'male', label: '남성' }, { value: 'unspecified', label: '밝히지 않음' }]} />
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>루틴은 성별과 관계없이 똑같이 짜요. 처음 추천 무게와 근육 그림 체형에만 반영돼요.</p>
          </div>
        </div>
      ),
    },
    {
      kicker: 'STEP 4 · 첫 퀘스트',
      title: '이번 주 퀘스트가 생성됐어요',
      body: program && (
        <div className="stack">
          <div className="card hero">
            <div className="row between">
              <span style={{ fontSize: 36 }}>{CLASS_INFO[p.goal].emoji}</span>
              <span className="tag gold">Lv.1</span>
            </div>
            <div className="h2" style={{ marginTop: 6 }}>{CLASS_INFO[p.goal].name} · 주 {p.daysPerWeek}회 {p.minutesPerSession}분</div>
            <div className="small muted">{program.days.map((d) => d.name).join(' → ')}</div>
          </div>
          <div className="card">
            {weeklyQuests(program, p.daysPerWeek, { volume: ZERO, sessions: 0, prs: 0 }).map((q) => (
              <div key={q.id} className="quest">
                <span className="box" />
                <span className="grow small bold">{q.title}</span>
                <span className="tag gold">+{q.xp}XP</span>
              </div>
            ))}
          </div>
          {underCovered(program).length > 0 && (
            <div className="card flat small">⏱️ 시간이 빠듯해 {underCovered(program).map((m) => MUSCLE_KO[m]).join(', ')} 운동량이 목표보다 적어요. 시간이나 횟수를 늘리면 더 좋아요.</div>
          )}
          <p className="tiny muted">퀘스트 목표 세트 수는 근육 성장 연구에서 권장하는 부위별 주간 볼륨으로 정했어요.</p>
        </div>
      ),
    },
  ];

  const last = step === screens.length - 1;
  const finish = () => {
    update((d) => ({ ...d, profile: p, program: generateProgram(p) }));
    onDone();
  };
  const s = screens[step]!;

  return (
    <div className="screen no-tab">
      <div className="stack">
        <div className="row">
          {(step > 0 || editing) && (
            <button className="icon-btn" aria-label="뒤로" onClick={() => (step > 0 ? setStep(step - 1) : onDone())}>‹</button>
          )}
          <div className="steps grow">{screens.map((_, i) => <div key={i} className={i <= step ? 'on' : ''} />)}</div>
        </div>
        <div>
          <div className="section-label" style={{ margin: 0, color: 'var(--accent)' }}>{s.kicker}</div>
          <div className="title" style={{ marginTop: 4 }}>{s.title}</div>
        </div>
        {s.body}
      </div>
      <div className="bottom-cta">
        <button className="btn primary block" onClick={() => (last ? finish() : setStep(step + 1))}>
          {last ? (editing ? '이 설정으로 다시 시작' : '⚔️ 모험 시작') : '다음'}
        </button>
      </div>
    </div>
  );
}
