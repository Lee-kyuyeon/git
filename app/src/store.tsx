import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { get, set } from 'idb-keyval';
import type { PlannedExercise, Profile, Program } from '@core';

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
      .then((d) => { if (d) setData({ ...EMPTY, ...d, settings: { ...EMPTY.settings, ...d.settings } }); })
      .catch(() => {})
      .finally(() => setLoaded(true));
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

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
