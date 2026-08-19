import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

def load_env_file():
    """로컬 실행 시 .env 파일이 있으면 os.environ에 로드합니다."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception as e:
            print(f"Error loading .env file: {e}")

JSON_CONTENT_TYPE = 'application/json; charset=utf-8'

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', JSON_CONTENT_TYPE)
        self.end_headers()
        self.wfile.write(json.dumps({"message": "이 API는 POST 요청만 지원합니다."}, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        load_env_file()

        # 1. API Key Check
        gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("AI_API_KEY")

        if not gemini_key:
            self.send_error_response(500, "서버 설정 오류: Vercel 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다.")
            return

        # 2. Parse Request Body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
            category = body.get('category', '기타')
            text = body.get('text', '')
        except json.JSONDecodeError:
            self.send_error_response(400, "잘못된 요청: JSON 형식이 아닙니다.")
            return

        if not text:
            self.send_error_response(400, "잘못된 요청: 고민 내용(text)이 비어있습니다.")
            return

        system_prompt = """당신은 충청도식으로 말하는 10년지기 절친이다.
말투는 세상 느긋하고 순한데, 듣고 나면 "말은 조곤조곤하게 하는데 왜 이렇게 뼈를 때리지?" 싶은 사람이다.

상대를 위로하거나 가르치려 하지 마라.
고민 속에 숨은 **모순·자기합리화·쓸데없는 걱정**을 하나 찾아내어, **딴청 피우듯 툭 던지고 능청스러운 반어로 비틀어라.**

목표는 "맞는 말이라 열받는데 어이없어서 헛웃음 나오네ㅋㅋ"다.

---

[출력 규칙]
* 자연스러운 충청도 뉘앙스의 '반말'
* 정확히 2문장
* 공백 포함 45자 ~ 70자 내외 (최대 80자 엄수)
* 부가 설명, 인사말 없이 오직 '답변 2문장'만 출력

---

[문장 구성 공식]
* 1문장 (느긋한 팩폭): 남 일 보듯 태연하게 상대의 모순이나 상황을 짚음.
* 2문장 (능청스러운 반전): 엉뚱한 과장, 반어법, 허를 찌르는 비유로 펀치라인 완성.

---

[충청도식 화법 가이드]
* 사투리를 억지로 남발하지 마라. (표준어 80% + 충청도 뉘앙스/어미 20%)
* 자주 쓰는 어미: "~여", "~겨", "~가벼", "~아녀", "~것지", "~남", "그려", "워뗘"
* 직설적으로 비꼬지 말고, '인정해 주는 척' 능청스럽게 과장하거나 축소해라.
  - (예: 너무 늦을 때 -> "내 제사상에 올리겄어", 너무 아낄 때 -> "빌딩 올리겄네")
* 화내거나 다그치지 말고, 힘을 뺀 채 평온하게 말해라.

---

[좋은 답변 예시 (Few-Shot)]

* 고민: "다이어트해야 하는데 세상엔 맛있는 게 너무 많아."
  -> "그려, 숟가락 놓는 게 지구 드는 것보다 힘들긴 혀. 이참에 천하장사 대회나 나가보는 건 워뗘?"

* 고민: "연락 안 오는 짝남 때문에 하루 종일 폰만 보고 있어."
  -> "그 친구 폰은 진작에 박물관 들어간 모양이여. 냅둬~ 국보급 유물 되겄네."

* 고민: "완벽하게 준비해서 시작하려다 보니 아무것도 못 하겠어."
  -> "준비만 하다가 환갑잔치 먼저 치르게 생겼어. 아주 나라를 구하려고 그러는겨?"

---

[금지 사항]
* 훈계, 교훈, 자기계발서 명언 ("힘내", "너를 믿어", "포기하지 마")
* 과도한 비속어나 악의적인 인신공격
* 질문으로 끝나거나 대화를 계속 이어가려는 문장
* 3문장 이상의 장황한 설명
"""

        category_map = {
            'study': '공부/시험',
            'work': '직장/취업/퇴사',
            'money': '돈/재테크/텅장',
            'love': '연애/짝사랑/이별',
            'relationship': '인간관계/친구/가족',
            'health': '다이어트/건강/운동',
            'life': '인생/게으름/일상'
        }
        category_name = category_map.get(category, category)
        user_prompt = f"카테고리: {category_name}\n고민 내용: {text}"

        # 3. Call LLM API (Gemini)
        quote = None
        gemini_models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite']
        last_error = None
        
        for model in gemini_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                payload = {
                    "system_instruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "contents": [
                        {"parts": [{"text": user_prompt}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.85,
                        "maxOutputTokens": 120
                    }
                }
                data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                
                with urllib.request.urlopen(req, timeout=4) as res:
                    result = json.loads(res.read().decode('utf-8'))
                    quote = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    if quote:
                        break
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='ignore')
                print(f"Gemini API Error ({model}): HTTP {e.code} - {err_body}")
                last_error = f"HTTP {e.code}: {err_body}"
            except Exception as e:
                print(f"Error calling Gemini API ({model}): {str(e)}")
                last_error = str(e)
        
        if not quote:
            print(f"All Gemini models failed. Last error: {last_error}")
            self.send_error_response(500, "현재 우주적 기운이 맞지 않아 명언 제조기가 고장났습니다. 나중에 다시 시도해주세요.")
            return

        # 4. Send Success Response
        self.send_response(200)
        self.send_header('Content-type', JSON_CONTENT_TYPE)
        self.end_headers()
        response_data = {"quote": quote}
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', JSON_CONTENT_TYPE)
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))

