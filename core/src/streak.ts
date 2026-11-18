/**
 * 주 단위 연속 기록. 매일 운동을 강요하지 않도록 "이번 주 목표 횟수 달성"을 1주로 셉니다.
 * 주는 월요일에 시작합니다. 진행 중인 이번 주는 아직 실패로 보지 않습니다.
 */
export function weeklyStreak(sessionDates: Date[], targetPerWeek: number, now: Date): number {
  const counts = new Map<string, number>();
  for (const d of sessionDates) {
    const k = weekKey(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  let streak = 0;
  const cursor = startOfWeek(now);
  // 이번 주: 달성했으면 포함, 아직 미달이면 건너뜀
  if ((counts.get(weekKey(cursor)) ?? 0) >= targetPerWeek) streak++;
  cursor.setDate(cursor.getDate() - 7);

  while ((counts.get(weekKey(cursor)) ?? 0) >= targetPerWeek) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (r.getDay() + 6) % 7; // 월=0
  r.setDate(r.getDate() - day);
  return r;
}

function weekKey(d: Date): string {
  const s = startOfWeek(d);
  return `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`;
}
