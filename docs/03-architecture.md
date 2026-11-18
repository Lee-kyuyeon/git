# 03. 아키텍처 & 데이터 모델

## 1. 기술 스택 (제안)

| 계층 | 선택 | 이유 |
|---|---|---|
| 앱 | React Native (Expo) + TypeScript | iOS/Android 동시 개발, 1인/소규모 팀에 적합 |
| 로컬 DB | SQLite (expo-sqlite) + Drizzle ORM | 로컬 우선, 오프라인 기록 무손실 |
| 상태 | Zustand | 운동 진행 상태 |
| 서버 | **없음** | 비용 0원. 모든 데이터와 계산은 폰 안에서 처리 |
| 백업 | SQLite DB를 JSON으로 내보내 공유 시트로 iCloud Drive/Google Drive에 저장, 복원 시 가져오기 | 무료, 계정 불필요 |
| 로컬 AI | llama.rn (llama.cpp) + 소형 GGUF 모델 | 오프라인, 무료. 04 문서 7장 참고 |
| 핵심 로직 | `core/` 순수 TS 패키지 | 루틴 생성, 추천, 1RM, 회복도. UI와 분리해 테스트 |

## 2. 도메인 모델

```
User ─┬─ Profile (goal, experience, daysPerWeek, minutesPerSession, equipment[], injuries[], unit)
      ├─ Program ── ProgramDay[] ── PlannedExercise[] (exerciseId, sets, repMin, repMax, restSec, order)
      ├─ WorkoutSession ── SessionExercise[] ── SetLog[] (weight, reps, rpe, isWarmup, completedAt)
      ├─ BodyMetric[] (date, weightKg, bodyFatPct?)
      └─ Achievement[]

Exercise (정적 시드 데이터)
  id, nameKo, nameEn, primaryMuscles[], secondaryMuscles[], equipment,
  mechanic(compound|isolation), difficulty(1~3), stressedJoints[], cues[], alternatives[]
```

### 주요 테이블 (Postgres / SQLite 공통)

```sql
create table workout_session (
  id uuid primary key, user_id uuid not null,
  program_day_id uuid, started_at timestamptz not null, ended_at timestamptz,
  note text, updated_at timestamptz not null, deleted_at timestamptz
);
create table set_log (
  id uuid primary key, session_id uuid not null references workout_session(id),
  exercise_id text not null, set_index int not null,
  weight_kg numeric(6,2), reps int, rpe numeric(3,1), is_warmup boolean default false,
  completed_at timestamptz, updated_at timestamptz not null, deleted_at timestamptz
);
create index on set_log (exercise_id, completed_at);
```

## 3. 핵심 알고리즘 (`core/` 구현)

| 모듈 | 내용 |
|---|---|
| `oneRepMax.ts` | Epley / Brzycki 추정 1RM, 반복 수가 많을 때(>12) 신뢰도 하향 |
| `progression.ts` | 더블 프로그레션 + RPE 보정 → 다음 세션 무게/반복 추천, 콜드스타트 |
| `routineGenerator.ts` | 주당 횟수 → 분할, 슬롯 → 종목 선택(기구/부상 필터), 시간 예산 컷 |
| `recovery.ts` | 부위별 지수 감쇠 피로 모델 → 회복도 0~100% |
| `warmup.ts` | 작업 중량 기준 웜업 세트 생성 |
| `streak.ts` | 주 단위 목표 달성 연속 기록 |

## 4. 개발 로드맵

| 주차 | 산출물 |
|---|---|
| 1 | `core` 로직 + 테스트, 종목 시드 데이터(~150종) |
| 2~3 | Expo 앱 골격, 온보딩, 루틴 화면 |
| 4~5 | 운동 진행 화면, 휴식 타이머, 로컬 DB |
| 6 | 기록/통계, 회복도 |
| 7 | 백업/복원, 내보내기 |
| 8 | 백업, 내 폰에 설치 |
