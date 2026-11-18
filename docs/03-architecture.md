# 03. 아키텍처 & 데이터 모델

## 1. 기술 스택

> 대상 기기: **iPhone 16 Pro (iOS 26, Apple Intelligence 지원)** 한 대. Android는 고려하지 않습니다.
> 그래서 크로스플랫폼(React Native) 대신 **네이티브 SwiftUI**로 갑니다. 이유:
> 애플 내장 AI(Foundation Models), HealthKit, 잠금화면/다이내믹 아일랜드 휴식 타이머(Live Activity), Apple Watch가 모두 Swift 전용이거나 Swift에서 가장 쉽습니다.

| 계층 | 선택 | 이유 |
|---|---|---|
| 앱 | **SwiftUI** (iOS 26) | 네이티브 기능을 브리지 없이 사용 |
| 로컬 DB | SwiftData | 애플 기본 제공, 추가 비용·라이브러리 없음 |
| 서버 | **없음** | 비용 0원. 모든 데이터와 계산은 폰 안에서 처리 |
| 백업 | JSON 내보내기 → 파일 앱(iCloud Drive)에 저장, 가져오기로 복원 | 무료, 계정 불필요 |
| 로컬 AI | **Apple Foundation Models** (온디바이스 약 3B 모델) | 무료, 오프라인, 다운로드 없음. `@Generable`로 구조화 출력 |
| 휴식 타이머 | ActivityKit Live Activity + 로컬 알림 | 다이내믹 아일랜드와 잠금화면에 남은 시간 표시 |
| 건강 | HealthKit | 운동 기록, 칼로리, 체중 저장 |
| 핵심 로직 | `LiftLogCore` Swift 패키지 (현재 `core/` TS 구현을 이식) | UI와 분리, `swift test`로 테스트 |

> `core/` TypeScript 구현은 알고리즘 명세와 테스트 케이스의 기준(레퍼런스)으로 남겨 두고, 같은 테스트를 Swift로 옮겨 결과가 같은지 확인합니다.

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
| 2~3 | Xcode 프로젝트, SwiftUI 탭 골격, 온보딩, 루틴 화면 |
| 4~5 | 운동 진행 화면, 휴식 타이머, 로컬 DB |
| 6 | 기록/통계, 회복도 |
| 7 | 백업/복원, 내보내기, Live Activity 타이머 |
| 8 | 백업, 내 폰에 설치 |
