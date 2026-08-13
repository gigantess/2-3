# 🤖 [Gemini Code Assist] AI 웹 서비스 구축 실행 가이드 (Prompt Guide)

본 문서는 **Gemini Code Assist**가 사용자와 협력하여 **Vanilla Frontend + Python Serverless Backend 기반 AI 웹 서비스**를 단계별로 구축하고 배포할 수 있도록 작성된 체계적 지침서입니다.

---

## 🎯 1. 프로젝트 핵심 스펙 및 제약 사항

| 구분 | 요구 스펙 및 제약 사항 |
| :--- | :--- |
| **프론트엔드** | **순수 Vanilla HTML5, CSS3, JavaScript** (React, Vue 등 프레임워크 사용 금지) |
| **백엔드** | **Vercel Serverless Functions (Python 3.10+)** (`api/` 폴더 내 위치) |
| **AI API 연동** | Python 백엔드를 통한 AI API(OpenAI/Claude 등) 호출 및 결과 전달 |
| **화면 구성** | 최소 3개 이상의 페이지/섹션, 네비게이션 이동, 반응형 UI (Mobile/Desktop) |
| **AI 기능 UX** | 사용자 입력 → 로딩 UI → AI 결과 출력 및 **3가지 예외 처리 필수 구현** |
| **보안 요구사항** | API Key는 **환경 변수(`os.environ`)**로만 관리 (`.env` 파일 Git 추적 금지) |

---

## 📁 2. 표준 프로젝트 디렉토리 구조

```text
project-root/
├── api/
│   └── generate.py        # Vercel Serverless Function (Python 백엔드)
├── css/
│   └── style.css          # 반응형 CSS (Flexbox/Grid, Media Query)
├── js/
│   ├── main.js            # UI 이벤트, 스크롤 이동 및 DOM 제어
│   └── api.js             # fetch API 연동, 로딩 및 예외 처리
├── images/                # 파비콘 및 정적 이미지
├── index.html             # 단일 페이지 애플리케이션(SPA) 구조의 HTML
├── requirements.txt       # Python 백엔드 의존성 패키지 목록
├── .gitignore             # .env, __pycache__ 등 보안/캐시 제외 설정
└── README.md              # 프로젝트 가이드 및 제출 문서
```

---

## ⚙️ 3. 단계별 개발 실행 지침 (Gemini Code Assist 지시사항)

### Phase 1: 프로젝트 초기화 및 서비스 기획 정의

1. **디렉토리 및 기본 파일 생성**
   - 위 2항의 표준 디렉토리 구조에 맞춰 폴더와 빈 파일 생성.
   - `.gitignore` 생성 및 아래 내용 명시:
     ```text
     .env
     __pycache__/
     *.pyc
     .DS_Store
     ```

2. **서비스 기획서 작성 (`SERVICE_PLAN.md`)**
   - **서비스명 및 목소리/톤**: B급 감성 '역발상 힐링' 명언 제조기 (Paradox Mind) / 유쾌하고 역설적인 톤.
   - **타겟 사용자 & 목적**: 진부한 위로에 지친 현대인들에게 유머러스한 역발상 명언으로 실소를 유발하고 힐링 경험 제공.
   - **섹션 구성 (최소 3개)**: `Hero (소개)`, `AI 명언기 (AI 기능 실행)`, `마인드 컨트롤 갤러리 (FAQ/안내)`.
   - **AI 기능 명세**:
     - **입력**: 사용자의 고민 카테고리 및 텍스트.
     - **출력**: B급 유머와 해학이 담긴 AI 기반 역발상 명언.
     - **실패 처리 기준**: 빈 입력, API 오류(500/400), 타임아웃(10초) 상황에 대한 B급 감성 안내 메시지 정의.

---

### Phase 2: 순수 프론트엔드 UI/UX 구현 (Vanilla HTML/CSS/JS)

1. **`index.html` 작성**
   - Semantic HTML5 태그(`header`, `nav`, `main`, `section`, `footer`) 활용.
   - 최소 3개 섹션 포함 및 내비게이션 메뉴 구성 (클릭 시 해당 섹션으로 Smooth Scroll).
   - AI 입력 Form, 결과 표시 영역, 로딩 스피너 UI, 에러 안내 메시지 박스 생성.

2. **`css/style.css` 구현**
   - Flexbox 및 CSS Grid를 활용한 레이아웃 설계.
   - **반응형 미디어 쿼리(Media Query)** 작성:
     - Desktop (`1024px` 이상): 다컬럼 배치 및 와이드 헤더.
     - Mobile (`768px` 이하): 단일 컬럼 및 모바일 최적화 메뉴.

3. **`js/main.js` 구현**
   - 메뉴 클릭 시 스무스 스크롤 이동 이벤트 핸들러.
   - DOM 요소 참조 및 UI 초기화 로직.

---

### Phase 3: Python Serverless Backend & AI API 연동

1. **`requirements.txt` 작성**
   ```text
   openai>=1.0.0
   ```

2. **`api/generate.py` 작성 (Vercel Serverless Function)**
   - `http.server.BaseHTTPRequestHandler` 기반 표준 핸들러 작성.
   - 환경 변수 `AI_API_KEY` 로드 및 미설정 시 500 에러 반환.
   - 클라이언트 POST 요청 바디 파싱 → AI API 호출 → JSON 응답 반환.
   - Try-Except 구조로 서버 측 예외 안전하게 처리.

3. **`js/api.js` 연동 및 3대 예외 처리 구현**
   - **[예외 1: 빈 입력]** 제출 전 JS 검증으로 "필수 입력값을 확인해주세요." 출력.
   - **[예외 2: 타임아웃]** `AbortController`를 활용하여 10초 초과 시 "요청 시간이 초과되었습니다." 안내.
   - **[예외 3: API 오류]** HTTP status 4xx/5xx 응답 시 "서비스 처리 중 오류가 발생했습니다." 안내.
   - **[정상 동작]** 로딩 스피너 표시 → `fetch('/api/generate')` → 결과 DOM 렌더링.

---

### Phase 4: Vercel 배포 및 보안 검증

1. **API Key 보안 검증**
   - 코드, HTML, JS, README 내에 API Key가 하드코딩되었는지 전수 점검.
   - Git commit 이력에 `.env` 또는 Key 노출 여부 재확인.

2. **Vercel 배포**
   - GitHub 저장소 연결 후 Vercel Project 생성.
   - Vercel 대시보드 **Settings > Environment Variables**에 `AI_API_KEY` 등록.
   - 배포 URL 생성 확인 및 실제 브라우저/모바일 테스트 진행.

---

### Phase 5: 최종 문서화 및 제출 패키지 5종 정리

1. **`README.md` 최종 작성**
   - 서비스 소개 및 주요 기능
   - 기술 스택 (Vanilla HTML/CSS/JS, Python, Vercel Serverless)
   - Vercel 배포 URL
   - 로컬 실행 방법 및 Vercel 환경 변수(`AI_API_KEY`) 설정 가이드

2. **제출 패키지 5종 검증 체크리스트**
   - [ ] **1. 배포 URL**: Vercel 공개 URL (모바일/데스크톱 대응, 3개 섹션, AI 기능 동작)
   - [ ] **2. GitHub 저장소**: 프론트(`index.html`, `css/`, `js/`)와 백엔드(`api/`) 구조 분리
   - [ ] **3. README.md**: 개요, 기술 스택, 배포 URL, 실행/환경변수 가이드 포함
   - [ ] **4. 서비스 기획서**: 목적, 타겟, 페이지 구성, AI 입/출력 및 실패 처리 기준
   - [ ] **5. 증빙 자료**: 스크린샷 1세트(데스크톱, 모바일, AI동작) + AI 코딩 도구 사용 로그/캡처 1세트
