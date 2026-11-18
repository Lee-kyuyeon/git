import { useEffect, useState } from 'react';

/** intervalMs마다 현재 시각을 갱신 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** 운동 중 화면 꺼짐 방지. 앱이 다시 보이면 재요청 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const req = () => navigator.wakeLock.request('screen').then((l) => {
      // 요청 중에 언마운트되면 바로 해제 (화면이 계속 켜져 있는 것 방지)
      if (cancelled) l.release().catch(() => {});
      else lock = l;
    }).catch(() => {});
    req();
    const onVis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

let audioCtx: AudioContext | null = null;

/** iOS는 사용자 동작 안에서 오디오를 한 번 열어야 이후 소리를 낼 수 있음 */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* 미지원 */ }
}

export function beep(times = 2) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (let i = 0; i < times; i++) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t0 + i * 0.25);
    g.gain.exponentialRampToValueAtTime(0.3, t0 + i * 0.25 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.25 + 0.18);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0 + i * 0.25);
    o.stop(t0 + i * 0.25 + 0.2);
  }
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
