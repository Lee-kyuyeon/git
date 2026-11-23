import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { delMany, get, keys, set } from 'idb-keyval';
import { EXERCISE_BY_ID, MACHINES, isBodyweightExercise, suggestStartWeight, type Equipment, type PlannedExercise, type Profile, type Program } from '@core';

export interface LoggedSet {
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  done: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  plan: PlannedExercise;
  sets: LoggedSet[];
  /** 추천 사유 (예: "모든 세트 10회 달성, +2.5kg") */
  reason?: string;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt?: number;
  /** 프로그램의 몇 번째 날인지. 자유 운동이면 null */
  dayIndex: number | null;
  dayName: string;
  exercises: SessionExercise[];
  feeling?: 'easy' | 'ok' | 'hard';
  /** 휴식 타이머 종료 시각 (ms). 경과 시간을 누적하지 않고 종료 시각으로 계산해야 백그라운드에서도 정확 */
  restEndsAt?: number;
  restTotal?: number;
}

export interface Settings {
  sound: boolean;
  voice: boolean;
  lastBackupAt?: number;
  /** 첫 운동 사용법 안내를 닫았는지 */
  coachSeen?: boolean;
}

export interface AppData {
  version: 1;
  profile?: Profile;
  program?: Program;
  sessions: Session[];
  active?: Session;
  /** 종목별 메모 (다음 운동 때 그대로 보임) */
  notes: Record<string, string>;
  settings: Settings;
}

export const EMPTY: AppData = { version: 1, sessions: [], notes: {}, settings: { sound: true, voice: true } };

const KEY = 'liftlog-data';

interface Store {
  data: AppData;
  loaded: boolean;
  update: (fn: (d: AppData) => AppData) => void;
  replaceAll: (d: AppData) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const pending = useRef<AppData | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    get<AppData>(KEY)
      .then((d) => { if (d) setData(migrate({ ...EMPTY, ...d, settings: { ...EMPTY.settings, ...d.settings } })); })
      .catch(() => {})
      .finally(() => setLoaded(true));
    // 없앤 '내 자세 영상' 기능이 남긴 영상 정리 (videos:<종목> 키)
    keys().then((ks) => delMany(ks.filter((k) => typeof k === 'string' && k.startsWith('videos:')))).catch(() => {});
    // 저장 공간 자동 삭제 방지 요청 (지원 브라우저만)
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const flush = useCallback(() => {
    if (pending.current) {
      set(KEY, pending.current).catch(() => {});
      pending.current = null;
    }
  }, []);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [flush]);

  const persist = useCallback((d: AppData) => {
    pending.current = d;
    window.clearTimeout(timer.current);
    // 기록 손실을 막기 위해 짧게 모아서 즉시 저장
    timer.current = window.setTimeout(flush, 250);
  }, [flush]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const replaceAll = useCallback((d: AppData) => {
    // 대기 중인 이전 데이터 저장이 덮어쓰지 않도록 취소
    window.clearTimeout(timer.current);
    pending.current = null;
    setData(d);
    set(KEY, d).catch(() => {});
  }, []);

  return <Ctx.Provider value={{ data, loaded, update, replaceAll }}>{children}</Ctx.Provider>;
}

/** 예전 기구 체계('machine' 하나)로 저장된 설정을 개별 기구로 변환 */
export function migrate(input: AppData): AppData {
  const d = fillStartWeights(input);
  const eq = d.profile?.equipment as string[] | undefined;
  if (!d.profile || !eq || !eq.includes('machine')) return d;
  const next = new Set<string>(eq.filter((q) => q !== 'machine'));
  MACHINES.forEach((m) => next.add(m));
  if (eq.includes('barbell')) next.add('squatRack');
  if (eq.includes('cable')) next.add('latPulldown');
  if (eq.includes('pullupBar')) next.add('dipStation');
  return { ...d, profile: { ...d.profile, equipment: [...next] as Equipment[] } };
}

/** 추천 시작 무게가 생기기 전에 만든 진행 중 운동: 아직 안 한 0kg 종목에 추천 무게 채우기 */
function fillStartWeights(d: AppData): AppData {
  const a = d.active;
  if (!a || !d.profile) return d;
  let changed = false;
  const exercises = a.exercises.map((e) => {
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex || isBodyweightExercise(ex) || e.sets.some((x) => x.done || x.weightKg > 0)) return e;
    const s = suggestStartWeight(ex, e.plan, d.profile!);
    changed = true;
    return { ...e, reason: s.note, sets: e.sets.map((x) => ({ ...x, weightKg: s.weightKg })) };
  });
  return changed ? { ...d, active: { ...a, exercises } } : d;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
