# Object Cluster 3D (`object-cluster-3d`)

3D 오브젝트(GLTF 또는 구체) 클러스터가 **방사형 버스트**로 등장해 **부유·텀블링**하고, **마우스로 밀어낼** 수 있으며, **스크롤(setProgress)**로 카메라가 클러스터를 **꿰뚫고 통과**한다. 실시간 큐브맵 환경반사(서로 비침) + 인디고 스카이돔 IBL + 그림자 + ACES 톤매핑 + 색 그레이딩이 적용된다.

> framework: vanilla · entry `object-cluster-3d.js` · export `ObjectCluster3D` · 의존 `three`(모델 사용 시 `three/addons`)
> 출처: 큐앤뱅 리믹스6 히어로 블루베리 클러스터에서 일반화(페이지 훅 — z순서 교차·전역 커서 연동·`hero:start-berries` 이벤트 — 제거).

## 설치 / 사용

```html
<script type="importmap">
  {
    "imports": {
      "three": "../../shared/vendor/three.module.min.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
</script>
<div id="stage" style="position:fixed;inset:0"></div>
<script type="module">
  import { ObjectCluster3D } from './object-cluster-3d.js';
  const cluster = new ObjectCluster3D('#stage', {
    count: 24,
    modelUrl: '/models/blueberry.glb',  // 생략 시 구체 폴백
    brand: '#4545da', tint: 0.2,
  });
  // 스크롤 → 카메라 통과
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    cluster.setProgress(max > 0 ? scrollY / max : 0);
  }, { passive: true });
</script>
```

- **모델 없이 구체만** 쓸 땐 `three/addons/` 매핑이 필요 없다(GLTFLoader는 `modelUrl`이 있을 때만 동적 import).
- `autoStart:false`로 두고 인트로 종료 시점에 `cluster.start()`를 호출하면 원본처럼 "신호 후 버스트 등장"이 된다.

## API

| 멤버 | 설명 |
|---|---|
| `new ObjectCluster3D(container, options)` | 캔버스 생성·부착 |
| `setProgress(0~1)` | 스크롤 진행도(카메라 접근→통과) |
| `start()` | 등장 트리거(autoStart=false일 때) + 루프 |
| `stop()` / `resize()` / `setOptions(p)` / `destroy()` | |
| `onHover = (isHover) => {}` | 커서가 오브젝트 반응 반경에 들어왔는지 |

## 주요 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `count` | `24` | 오브젝트 수 |
| `rMin`/`rMax` | `1.9`/`2.5` | 크기(중앙=크게·가장자리=작게) |
| `cloudX`/`cloudY`/`cloudZ` | `10.5`/`5.1`/`2.4` | 구름 퍼짐 |
| `modelUrl` | `null` | GLTF URL(없으면 구체) |
| `brand`/`tint`/`shadowLift` | `#4545da`/`0.2`/`0.25` | 색 그레이딩(브랜드색·틴트·어두운 골 리프트) |
| `mouseRadiusNdc`/`mousePush`/`mouseSweep` | `0.24`/`0.85`/`1.4` | 커서 반응 반경·밀기·쓸기 |
| `approachStart`/`approachEnd`/`passEnd` | `0.3`/`0.64`/`0.86` | 스크롤 통과 구간 |
| `autoStart` | `true` | 생성 즉시 등장 / `false`면 `start()` |
| `lowPower` | `null` | `null`=자동(`window.QNB.device`) / 강제 |

## 동작 원리 / 성능

- **배치**: 보겔 나선(`sqrt` 반경)으로 면적 균등 분포 → 빈틈 없이 고르게.
- **물리**: 거리 비례 복귀 스프링 + 부유 sine 드리프트 + 구-구 충돌(반발) + 마우스 push/sweep.
- **라이팅**: 매 프레임 큐브맵을 6면 렌더해 실시간 상호반사. **저사양에선 큐브맵을 시작 시 1회만 굽고 고정**, 그림자 off, pixelRatio·AA 강등(`lowPower`).
- 색 그레이딩은 `onBeforeCompile`로 `map_fragment`에 주입(어두운 골 리프트 + brand 틴트).
- 화면 밖이면 IntersectionObserver로 루프 정지. WebGL 컨텍스트 손실 복구 핸들러 포함.

## 메모

- 원본은 브랜드 GLB(블루베리)를 썼다. 라이브러리엔 모델을 동봉하지 않으므로 `modelUrl`로 자신의 GLTF를 지정하거나, 생략해 구체로 쓴다.
- `three/addons` CDN 버전은 `shared/vendor`의 three 코어 버전과 맞추는 것이 안전하다.
