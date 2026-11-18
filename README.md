# LiftLog (가칭): 운동 루틴·기록 앱

국내 운동 앱 4종(플랜핏, 짐워크, 플릭, 데일리핏)을 **공개 정보 기반으로 기능 역설계**하고, 그 결과로 기획한 독자적인 운동 앱 프로젝트입니다.

## 문서
| 문서 | 내용 |
|---|---|
| [01-competitor-analysis.md](docs/01-competitor-analysis.md) | 4개 앱 기능 매트릭스, 기능별 구현 추론, 리뷰 페인 포인트, 가격 모델 |
| [02-product-spec.md](docs/02-product-spec.md) | 제품 정의, 차별점, MVP 범위, 화면 구조(IA), 사용자 흐름, 수익 모델 |
| [03-architecture.md](docs/03-architecture.md) | 기술 스택, 데이터 모델, 핵심 알고리즘, 로드맵 |
| [04-build-plan-planfit-base.md](docs/04-build-plan-planfit-base.md) | **개발 계획**: 플랜핏 뼈대 + 짐워크/플릭/데일리핏 장점 결합, 단계별 로드맵 |
| [05-anatomy-science-review.md](docs/05-anatomy-science-review.md) | 해부학·운동과학 근거로 루틴 생성, 추천, 회복도, 부상 처리 검토 + 개선 작업 |

## 핵심 로직: `core/`
UI와 분리된 순수 TypeScript 도메인 로직입니다(런타임 의존성 없음).

- `routineGenerator.ts`: 목표, 주당 횟수, 시간, 보유 기구, 불편 부위로 주간 프로그램 자동 생성 + 대체 종목
- `progression.ts`: 더블 프로그레션 + RPE 보정 다음 무게 추천, 콜드스타트 보정
- `oneRepMax.ts`: Epley/Brzycki 1RM 추정
- `recovery.ts`: 부위별 근육 회복도(지수 감쇠 피로 모델)
- `warmup.ts`, `streak.ts`: 웜업 세트, 주간 연속 기록
- `exercises.ts`: 종목 시드 데이터(43종)

```bash
cd core
npm install      # 개발용 타입만 설치 (typescript, @types/node)
npm test         # Node 22.18+ 내장 테스트 러너
npm run typecheck
```

## 다음 단계
docs/04의 1주차: `core`에 당일 조정, 세트 타입, 정체기 판정 추가 + `app/` PWA 골격과 GitHub Pages 배포 (iPhone 16 Pro 홈 화면 설치)
