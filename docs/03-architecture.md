# 03. 아키텍처 & 데이터 모델

## 1. 기술 스택

> 대상: **iPhone 16 Pro (iOS 26) Safari에서 홈 화면에 추가해 쓰는 웹앱(PWA)**.
> Mac이 없어 네이티브 iOS 앱은 빌드/설치할 수 없습니다. PWA는 Mac 없이, 비용 없이, 7일 만료 없이 설치되고,
> 이미 만든 `core/` TypeScript 로직을 그대로 씁니다. 개발과 배포도 전부 이 클라우드 환경에서 할 수 있습니다.

| 계층 | 선택 | 이유 |
|---|---|---|
| 앱 | **Vite + React + TypeScript**, `vite-plugin-pwa` | 홈 화면 설치, 오프라인 동작(서비스 워커) |
| 로컬 DB | IndexedDB (Dexie) | 폰 안에 저장, 오프라인 무손실. `navigator.storage.persist()` 요청 |
| 핵심 로직 | `core/` TS 패키지 그대로 사용 | 루틴 생성, 추천, 1RM, 회복도 |
| 서버 | **없음** | 비용 0원 |
| 배포 | **GitHub Pages** (공개 저장소라 무료), GitHub Actions로 자동 배포 | 푸시하면 폰에서 바로 업데이트 |
| 백업 | JSON 파일을 공유 시트(Web Share API)로 파일 앱/iCloud Drive에 저장, 가져오기로 복원 | 무료, 계정 불필요 |
| 음성 안내 | Web Speech API (`speechSynthesis`, 한국어 음성) | 무료, 오프라인 |
| 화면 꺼짐 방지 | Screen Wake Lock API | 운동 중 화면 유지 |
| 로컬 AI | 기본: 버튼형 조건 입력. 실험: WebLLM(WebGPU) + 소형 모델 | 04 문서 7장 |

### 네이티브 대비 포기하는 것
| 기능 | PWA에서 | 대안 |
|---|---|---|
| 애플 내장 AI (Foundation Models) | 불가 | WebLLM 실험 또는 버튼형 |
| HealthKit 연동 | 불가 | 체중은 앱 안에서 직접 기록 |
| 잠금화면/다이내믹 아일랜드 타이머 | 불가 | 화면 켜둠(Wake Lock) + 종료 시각 기준 계산이라 앱을 다시 열어도 정확 |
| 백그라운드 알림 | 서버 없이 불가 | 앱 화면 안에서 소리와 음성으로 알림 |
| Apple Watch | 불가 | 제외 |
| 진동 | Safari 미지원 | 소리와 음성 |

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

[04-build-plan-planfit-base.md](04-build-plan-planfit-base.md) 5장을 따릅니다.
