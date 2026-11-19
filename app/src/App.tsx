import { lazy, Suspense, useEffect, useState } from 'react';
import { useStore } from './store.tsx';
const Onboarding = lazy(() => import('./screens/Onboarding.tsx').then((m) => ({ default: m.Onboarding })));
import { Home } from './screens/Home.tsx';
import { Workout } from './screens/Workout.tsx';
const Summary = lazy(() => import('./screens/Summary.tsx').then((m) => ({ default: m.Summary })));
const Routine = lazy(() => import('./screens/Routine.tsx').then((m) => ({ default: m.Routine })));
const Muscles = lazy(() => import('./screens/Muscles.tsx').then((m) => ({ default: m.Muscles })));
const History = lazy(() => import('./screens/History.tsx').then((m) => ({ default: m.History })));
const Me = lazy(() => import('./screens/Me.tsx').then((m) => ({ default: m.Me })));
import { useNow } from './hooks.ts';

type Tab = 'home' | 'muscles' | 'history' | 'me';

const TABS: Array<{ id: Tab; label: string; ico: string }> = [
  { id: 'home', label: '퀘스트', ico: '📜' },
  { id: 'muscles', label: '근육·도감', ico: '💪' },
  { id: 'history', label: '기록', ico: '📅' },
  { id: 'me', label: '나', ico: '👤' },
];

export function App() {
  const { data, loaded } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);

  // 진행 중 운동이 있으면 앱을 다시 열었을 때 바로 이어서
  useEffect(() => { if (loaded && data.active) setWorkoutOpen(true); }, [loaded]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, workoutOpen, summaryId, editing, routineOpen]);

  if (!loaded) return null;
  return <Suspense fallback={<div className="screen" aria-busy="true" />}>{render()}</Suspense>;

  function render() {
  if (!data.profile || !data.program || editing) {
    return <Onboarding editing={editing} onDone={() => { setEditing(false); setTab('home'); }} />;
  }
  if (summaryId) return <Summary id={summaryId} onClose={() => { setSummaryId(null); setTab('home'); }} />;
  if (workoutOpen && data.active) {
    return <Workout onMinimize={() => setWorkoutOpen(false)} onFinished={(id) => { setWorkoutOpen(false); setSummaryId(id); }} />;
  }

  return (
    <>
      {routineOpen ? (
        <Routine onBack={() => setRoutineOpen(false)} openWorkout={() => { setRoutineOpen(false); setWorkoutOpen(true); }} editProfile={() => { setRoutineOpen(false); setEditing(true); }} />
      ) : (
        <>
          {tab === 'home' && <Home openWorkout={() => setWorkoutOpen(true)} openRoutine={() => setRoutineOpen(true)} />}
          {tab === 'muscles' && <Muscles />}
          {tab === 'history' && <History />}
          {tab === 'me' && <Me editProfile={() => setEditing(true)} openRoutine={() => setRoutineOpen(true)} />}
        </>
      )}
      {data.active && <MiniBar startedAt={data.active.startedAt} name={data.active.dayName} onOpen={() => setWorkoutOpen(true)} />}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id} onClick={() => { setRoutineOpen(false); setTab(t.id); }}>
            <span className="ico">{t.ico}</span>{t.label}
          </button>
        ))}
      </nav>
    </>
  );
  }
}

function MiniBar({ startedAt, name, onOpen }: { startedAt: number; name: string; onOpen: () => void }) {
  const now = useNow(1000);
  const sec = Math.floor((now - startedAt) / 1000);
  return (
    <button className="mini-bar" onClick={onOpen}>
      <span>🏋️</span>
      <span className="grow" style={{ textAlign: 'left' }}>{name} 진행 중</span>
      <span className="num">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>
    </button>
  );
}
