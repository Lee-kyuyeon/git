import { useEffect, useState } from 'react';
import { useStore } from './store.tsx';
import { Onboarding } from './screens/Onboarding.tsx';
import { Home } from './screens/Home.tsx';
import { Workout } from './screens/Workout.tsx';
import { Summary } from './screens/Summary.tsx';
import { Routine } from './screens/Routine.tsx';
import { History } from './screens/History.tsx';
import { Me } from './screens/Me.tsx';
import { useNow } from './hooks.ts';

type Tab = 'home' | 'routine' | 'history' | 'me';

const TABS: Array<{ id: Tab; label: string; ico: string }> = [
  { id: 'home', label: '오늘', ico: '🏠' },
  { id: 'routine', label: '루틴', ico: '📋' },
  { id: 'history', label: '기록', ico: '📅' },
  { id: 'me', label: '나', ico: '👤' },
];

export function App() {
  const { data, loaded } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // 진행 중 운동이 있으면 앱을 다시 열었을 때 바로 이어서
  useEffect(() => { if (loaded && data.active) setWorkoutOpen(true); }, [loaded]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, workoutOpen, summaryId, editing]);

  if (!loaded) return null;
  if (!data.profile || !data.program || editing) {
    return <Onboarding editing={editing} onDone={() => { setEditing(false); setTab('home'); }} />;
  }
  if (summaryId) return <Summary id={summaryId} onClose={() => { setSummaryId(null); setTab('home'); }} />;
  if (workoutOpen && data.active) {
    return <Workout onMinimize={() => setWorkoutOpen(false)} onFinished={(id) => { setWorkoutOpen(false); setSummaryId(id); }} />;
  }

  return (
    <>
      {tab === 'home' && <Home openWorkout={() => setWorkoutOpen(true)} goTab={setTab} />}
      {tab === 'routine' && <Routine openWorkout={() => setWorkoutOpen(true)} editProfile={() => setEditing(true)} />}
      {tab === 'history' && <History />}
      {tab === 'me' && <Me editProfile={() => setEditing(true)} />}
      {data.active && <MiniBar startedAt={data.active.startedAt} name={data.active.dayName} onOpen={() => setWorkoutOpen(true)} />}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            <span className="ico">{t.ico}</span>{t.label}
          </button>
        ))}
      </nav>
    </>
  );
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
