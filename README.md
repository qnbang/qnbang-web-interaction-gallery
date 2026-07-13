# 웹 인터랙션 컬렉션

재사용 가능한 **웹 인터랙션 효과 라이브러리** 모음. 각 효과는 자기완결 폴더로,
드롭인 ES 모듈 + 메타데이터 + 데모 + 문서를 갖춘다. 스킬/규칙처럼 일관된 구조로 관리한다.

## 빠른 시작

```bash
node build-registry.mjs   # effects/*/effect.json → registry.json
node server.mjs           # http://localhost:9821 (갤러리)
```

갤러리에서 각 효과의 데모를 열어 마우스로 만져볼 수 있다.

## 구조

```
웹인터랙션/
├── README.md             ← 이 파일 (카탈로그 개요)
├── CONVENTIONS.md        ← 효과 작성 규칙 (구조·모듈·메타 스키마·추가 절차)  ★먼저 읽기
├── registry.json         ← 자동 생성 인덱스 (build-registry.mjs)
├── gallery.html          ← 전체 효과 갤러리(카드·데모 링크·라이브 썸네일)
├── server.mjs            ← 정적 서버(갤러리)
├── new-effect.mjs        ← 새 효과 스캐폴더(_template 복제·치환)
├── build-registry.mjs    ← registry.json 빌더
├── shared/
│   └── vendor/           ← 공유 의존성 (three.module.min.js 등 여러 효과가 공유)
├── _template/            ← 새 효과 스켈레톤(규약 준수)
├── clones/               ← 클론 코딩(clonecraft) 원본 풀 프로젝트 수집소
│   ├── _작업중/          ← 클론 진행 중
│   └── _완료/            ← 클론 완료(효과 추출 대기·보관). 추출은 수동(요청 시)
└── effects/
    └── <name>/           ← 효과 1개 = 폴더
        ├── effect.json   ← 메타데이터 (framework: vanilla|react|vue)
        ├── <name>.js     ← 모듈(ES, named+default export) / react면 <name>.tsx
        ├── README.md     ← 옵션·API·동작원리
        ├── demo.html     ← 단독 데모(importmap) / react면 README 사용 예
        └── preview.png   ← (선택) 갤러리 썸네일
```

클론 코딩으로 모은 효과는 `clones/`에 원본을 보관하고, 재사용할 핵심만 **수동으로** `effects/`에 정제 등록한다(프레임워크 효과 수용 — [CONVENTIONS §8](CONVENTIONS.md)). 워크플로우: [clones/README.md](clones/README.md).

## 수록 효과

| 효과 | 설명 | 기술 |
|---|---|---|
| [fluid-particles](effects/fluid-particles/) | 텍스트/이미지를 입자로, 마우스가 움직이면 흐름을 타고 따라 이동하다 복귀 | Three.js · WebGL · 격자 유체 시뮬 |

> 표는 수동 요약이고, 정식 인덱스는 `registry.json`/갤러리가 자동 생성한다.

## 새 효과 추가

```bash
node new-effect.mjs magnetic-button "Magnetic Button" "커서를 끌어당기는 자석 버튼"
# → effects/magnetic-button/ 생성 (스켈레톤). 모듈/데모/README 채운 뒤:
node build-registry.mjs
node server.mjs            # 갤러리에서 확인
```

작성 규칙·메타 스키마·품질 체크리스트는 **[CONVENTIONS.md](CONVENTIONS.md)** 참고.

## 설계 원칙

- **자기완결** — 효과 1개 = 폴더 1개. 외부 의존은 `shared/`와 `effect.json.dependencies`로만.
- **드롭인** — 모듈은 `import { Effect } from './<name>.js'` + importmap만으로 동작. 경로 하드코딩 없음.
- **표준 라이프사이클** — `start/stop/destroy/resize` + 런타임 옵션 변경.
- **비침습** — 오버레이 캔버스는 `pointer-events:none`, 컨테이너만 차지, 화면 밖이면 자동 일시정지.
- **검색성** — `effect.json`의 description·tags·whenToUse로 무엇을·언제 쓸지 한눈에.
