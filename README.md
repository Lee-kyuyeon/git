# LiftQuest: 근육마다 레벨업하는 운동 퀘스트 + 운동·근육 도감

국내 운동 앱 4종(플랜핏, 짐워크, 플릭, 데일리핏)을 **공개 정보 기반으로 기능 역설계**하고, 그 결과로 기획한 독자적인 운동 앱 프로젝트입니다.

## 문서
| 문서 | 내용 |
|---|---|
| [01-competitor-analysis.md](docs/01-competitor-analysis.md) | 4개 앱 기능 매트릭스, 기능별 구현 추론, 리뷰 페인 포인트, 가격 모델 |
| [02-product-spec.md](docs/02-product-spec.md) | 제품 정의, 차별점, MVP 범위, 화면 구조(IA), 사용자 흐름, 수익 모델 |
| [03-architecture.md](docs/03-architecture.md) | 기술 스택, 데이터 모델, 핵심 알고리즘, 로드맵 |
| [04-build-plan-planfit-base.md](docs/04-build-plan-planfit-base.md) | **개발 계획**: 플랜핏 뼈대 + 짐워크/플릭/데일리핏 장점 결합, 단계별 로드맵 |
| [05-anatomy-science-review.md](docs/05-anatomy-science-review.md) | 해부학·운동과학 근거 검토, 성별·직업 맞춤 근거, 반영 상태 |
| [06-ui-ux.md](docs/06-ui-ux.md) | 화면별 UX 설계, v2 게임화·도감 개편, 디자인 원칙, 검증 |

## 핵심 로직: `core/`
UI와 분리된 순수 TypeScript 도메인 로직입니다(런타임 의존성 없음).

- `routineGenerator.ts`: **부위별 주간 볼륨 목표 기반** 프로그램 생성 (목표, 경력, 빈도, 시간, 기구, 불편 부위, 일하는 방식, 집중 부위) + 대체 종목
- `progression.ts`: 더블 프로그레션 + RPE 보정 다음 무게 추천, 콜드스타트 보정
- `oneRepMax.ts`: Epley/Brzycki 1RM 추정
- `recovery.ts`: 부위별 추정 회복도(지수 감쇠, 경력·직업 보정)
- `pain.ts`: 통증 모니터링 (불편 부위 종목을 빼지 않고 조절)
- `warmup.ts`, `streak.ts`: 웜업 세트, 주간 연속 기록
- `exercises.ts`: 종목 데이터 124종 (자체 66 + free-exercise-db 번역 58), 16개 부위, 늘어난 위치 표시
- `exerciseGuide.ts`, `exercisesExtra.ts`, `muscleInfo.ts`: 124개 종목 수행 가이드(준비·동작·호흡·자극 부위·흔한 실수), 16개 근육 해부학 정보
- `game.ts`: 부위별 XP·레벨, 주간 퀘스트(근거 기반 볼륨 목표), 업적

```bash
cd core
npm install      # 개발용 타입만 설치 (typescript, @types/node)
npm test         # Node 22.18+ 내장 테스트 러너
npm run typecheck
```

## 웹앱: `app/`
아이폰 홈 화면에 설치해 쓰는 PWA입니다(Vite + React + TypeScript, 서버 없음, 데이터는 폰에 저장).

```bash
cd app
npm install
npm run dev      # 개발 서버
npm run build    # 배포용 빌드 (app/dist)
```

### 아이폰에 설치하기 (무료, Mac 불필요)
1. GitHub 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정합니다(최초 1회).
2. 이 브랜치를 `main`에 병합하면 `.github/workflows/deploy.yml`이 테스트 후 자동 배포합니다.
3. 아이폰 Safari로 `https://lee-kyuyeon.github.io/git/` 접속 → 공유 버튼 → **홈 화면에 추가**.

## 다음 단계
실제 폰에서 사용해 보며 피드백 반영 → 당일 회복도 기반 루틴 조정, 세트 타입(탑/백오프), 정체기 판정, 동작 일러스트

## 출처 · 라이선스
3D 근육 이미지(BodyParts3D, CC BY-SA 2.1 JP), 2D 근육 지도(MIT), 추가 종목 설명(퍼블릭 도메인)의 출처는 [ATTRIBUTION.md](ATTRIBUTION.md)를 보세요.
