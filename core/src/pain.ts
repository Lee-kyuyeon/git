/**
 * 통증 모니터링. 불편 부위의 종목을 미리 빼는 대신, 수행 중 통증 점수(0~10)로 조절합니다.
 * 근거: 요통·무릎 관절염·어깨 충돌증후군 모두 운동이 권장되고, "허용 가능한 통증" 범위 안의 운동이 쓰임.
 * 기준값(≤3 / 4~5 / >5)은 재활에서 흔히 쓰는 통증 모니터링 방식을 따른 휴리스틱이며 의료 판단을 대신하지 않습니다.
 */
export type PainAction =
  | { action: 'continue'; message: string }
  | { action: 'reduce'; loadFactor: number; message: string }
  | { action: 'swap'; message: string }
  | { action: 'stop'; message: string };

export function painDuringSet(score: number): PainAction {
  if (score <= 3) return { action: 'continue', message: '괜찮은 범위예요. 계속하세요.' };
  if (score <= 5) return { action: 'reduce', loadFactor: 0.8, message: '무게를 20% 낮추거나 통증 없는 범위까지만 움직여 보세요.' };
  if (score <= 7) return { action: 'swap', message: '이 종목은 멈추고 대체 종목으로 바꿀게요.' };
  return { action: 'stop', message: '통증이 커요. 오늘은 이 부위를 쉬고, 계속되면 전문가 상담을 권해요.' };
}

/** 다음 날 아침 통증이 운동 전보다 악화됐으면 다음 세션에서 해당 종목을 교체 제안 */
export function painNextDay(before: number, nextMorning: number): 'keep' | 'swap' {
  return nextMorning - before >= 2 ? 'swap' : 'keep';
}

/** 앱 첫 실행과 불편 부위 선택 시 보여줄 고지 */
export const PAIN_DISCLAIMER =
  '이 앱은 의료 서비스가 아닙니다. 날카로운 통증, 붓기, 저림, 힘이 빠지는 느낌이 있으면 즉시 중단하고 진료를 받으세요.';
