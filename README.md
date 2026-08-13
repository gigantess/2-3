# 🧘‍♂️ Paradox Mind: B급 감성 '역발상 힐링' 명언 제조기

> **"뻔한 위로는 거부한다!"**  
> AI 코딩 도구를 활용하여 기획부터 바닐라 프론트엔드/파이썬 서버리스 백엔드 구현, Vercel 배포까지 전 과정을 직접 진행한 AI 연동 웹 서비스 프로젝트입니다.

---

## 📌 서비스 소개 (Overview)

### 💡 기획 배경 및 목적
진부하고 상투적인 위로 한마디에 피로감을 느끼는 현대인들(학업, 직장, 금전, 인생 고민 등)을 위해, 뻔한 어설픈 따뜻함 대신 **B급 유머와 해학이 담긴 역발상 팩트폭행 명언**을 AI로 생성하여 헛웃음과 실소를 유발하고 무거웠던 마음을 가볍게 환기시켜 주는 힐링 웹 서비스입니다.

### 👥 타겟 사용자
- 시험 기간만 되면 온갖 딴짓이 재미있고 공부하기 싫은 학생 📚
- 텅장이 된 통장을 보며 매일 퇴사를 꿈꾸는 직장인 🏢💸
- 그냥 다 귀찮고 인생의 의욕이 잠시 꺾인 현대인 🛌

---

## 🚀 핵심 기능 및 섹션 구성

1. **대문 (Hero Section)**  
   - B급 레트로/키치 감성의 파격적인 디자인과 둥근모꼴 폰트 적용.
   - 유쾌한 헤드라인과 이모지 애니메이션으로 힐링 톤앤매너 전달.

2. **AI 역발상 명언기 (Generator)**  
   - 고민 카테고리(공부, 직장, 금전, 인생) 선택 및 세부 고민 내용 입력 폼 제공.
   - **Vercel Serverless Functions(Python)** 및 AI API 연동을 통해 즉석에서 'B급 역발상 처방전' 카드 생성.
   - **실패 UX 적용**: 빈 입력 필수값 체크, API 오류(4xx/5xx) 및 응답 지연(타임아웃) 시 유쾌한 안내 메시지 출력.

3. **마인드 컨트롤 갤러리 (Gallery)**  
   - 남들의 팩폭과 해학이 담긴 유머 명언 카드 모음 섹션.

4. **처방전 보관함 (Archive & Storage - 🌟 보너스 미션)**  
   - 생성된 마음에 드는 AI 처방전을 **LocalStorage**에 저장하고 관리.
   - 디스코드 웹훅 공유 기능 연동으로 친구들과 AI 팩폭 명언을 함께 공유 가능.

5. **다크 모드 테마 (Dark Mode - 🌟 보너스 미션)**  
   - 🌙/☀️ 원클릭 테마 전환으로 레트로 다크 감성 UX 제공 및 시력 보호.

---

## 🛠️ 기술 스택 (Tech Stack) & 아키텍처

- **Frontend**: Pure HTML5, Vanilla CSS3 (Custom B-Kitsch Theme, 둥근모꼴 폰트), JavaScript (ES6+)
- **Backend**: Python 3.9 (Vercel Serverless Functions - `/api/quote.py`)
- **AI Integration**: OpenAI / Gemini API (역발상 프롬프트 엔지니어링 적용)
- **External Integration**: Browser LocalStorage, Discord Webhook
- **Deployment**: Vercel Cloud Platform (CI/CD 자동화)

---

## 🌐 배포 및 실행 안내

### 🔗 배포 URL
- **Vercel 라이브 서비스**: [https://2-3-1-ruddy.vercel.app/](https://2-3-1-ruddy.vercel.app/)

### 💻 로컬 실행 방법
1. 저장소 클론: `git clone https://github.com/username/repository.git`
2. 백엔드 패키지 설치: `pip install -r api/requirements.txt`
3. 프론트엔드 실행: Live Server 등을 활용해 `index.html` 오픈

### 🔑 환경 변수(API Key) 설정
- AI API 사용을 위한 시크릿 키는 보안을 위해 환경 변수로 관리됩니다.
- Vercel 대시보드 (**Settings > Environment Variables**)에서 `API_KEY` 등록 후 배포.
- **보안 수칙**: 소스 코드, 커밋 이력, README 등 외부에 절대 API 키를 노출하지 않습니다.

---

## 🎯 미션 달성 체크리스트 (Checklist)

### 1. 제출 패키지 및 기본 요구사항 (6/6)
- [x] **배포된 웹 서비스**: Vercel URL을 통해 실제 접속 및 전체 기능 동작 확인 완료
- [x] **페이지/섹션 구성**: 최소 3개 이상의 섹션(Hero, 명언기, 갤러리, 보관함) 및 상단 메뉴 이동 제공
- [x] **반응형 적용**: 데스크톱/태블릿/모바일(320px~) 전 크기에서 레이아웃 깨짐 없이 동작
- [x] **AI API 연동**: 사용자 고민 입력 → AI 처리 → 역발상 처방전 결과 출력 구현
- [x] **저장소 구조화**: GitHub 업로드 및 프론트엔드/백엔드(`api/`) 디렉터리 엄격 분리
- [x] **README.md 문서화**: 서비스 소개, 기술 스택, 실행/배포 가이드, 환경변수 관리, 미션 체크리스트 포함

### 2. 세부 기능 구현 및 UX 품질 (5/5)
- [x] **서비스 기획서 완성**: 서비스 목적, 타겟, 톤앤매너, AI 입출력 및 실패 처리 기준 명시
- [x] **순수 바닐라 개발**: React/Vue 등 프레임워크 없이 HTML/CSS/JS 및 Python Serverless 구현
- [x] **AI 기능 UX 충족**: 카테고리/입력 폼 제공, 로딩 중 애니메이션, 처방전 카드 렌더링
- [x] **실패 예외 처리**: 빈 입력 검증, 백엔드 타임아웃, 4xx/5xx API 에러에 대한 안내 UX 구현
- [x] **Vercel Serverless Function**: `/api/quote.py` 파이썬 엔드포인트를 이용한 AI 연동

### 3. 보너스 미션 (2/2)
- [x] **운영 자동화 및 데이터 저장 고도화**:
  - 생성된 AI 처방전을 `LocalStorage`에 저장하여 '처방전 보관함' 관리 기능 구현
  - 외부 도구(디스코드 웹훅 연동)를 통해 AI 결과 공유 흐름 확장
- [x] **사용자 경험(UX) 및 측정 고도화**:
  - 다크 모드/라이트 모드 테마 전환 및 마이크로 인터랙션(버튼 셰이크, 로딩 릴스 애니메이션) 적용

---

## 📄 증빙 자료 (Evidence & Deliverables)

### 1. 서비스 기획서
- 📄 [SERVICE_PLAN.md 기획서 보기](./doc/SERVICE_PLAN.md)

### 2. 스크린샷 캡쳐본

#### 🖥️ 데스크톱 화면
| 메인 Hero 화면 | AI 처방전 생성 화면 |
|---|---|
| ![웹 서비스 1](./screenshot/web_service1.png) | ![웹 서비스 AI 동작](./screenshot/web_service_ai.png) |

| 다크모드 적용 화면 | 처방전 보관함 화면 |
|---|---|
| ![웹 서비스 다크모드](./screenshot/web_service_darkmode.png) | ![웹 서비스 처방전 저장](./screenshot/web_service_storage.png) |

#### 📱 모바일 반응형 화면
| 모바일 메인 | 모바일 서브 | 모바일 AI 동작 |
|---|---|---|
| ![모바일 페이지 1](./screenshot/mobile_page1.png) | ![모바일 페이지 2](./screenshot/mobile_page2.png) | ![모바일 AI 동작](./screenshot/mobile_page_ai.png) |

| 모바일 다크모드 | 모바일 처방전 보관함 |
|---|---|
| ![모바일 다크모드](./screenshot/mobile_page_darkmode.png) | ![모바일 처방전 저장](./screenshot/mobile_page_storage.png) |

#### 🤖 AI 에이전트 도구 활용 증빙
- AI 코딩 도구 대화 및 코드 생성 과정 스크린샷
![AI 에이전트 활용 1](./screenshot/AI_agent_use1.png)
![AI 에이전트 활용 2](./screenshot/AI_agent_use2.png)