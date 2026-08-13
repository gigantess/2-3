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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "이 API는 POST 요청만 지원합니다."}, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        load_env_file()

        # 1. API Key Check
        gemini_key = os.environ.get("GEMINI_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")
        ai_key = os.environ.get("AI_API_KEY")

        api_key = gemini_key or openai_key or ai_key
        if not api_key:
            self.send_error_response(500, "서버 설정 오류: Vercel 환경 변수(GEMINI_API_KEY 또는 OPENAI_API_KEY)가 설정되지 않았습니다.")
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

        system_prompt = """당신은 B급 감성으로 뼈를 때리는 '10년지기 팩폭 친구' (Paradox Mind)입니다.
사용자가 고민을 털어놓으면 진부한 위로나 지루한 설교는 절대 하지 마세요. 
B급 비유, 킹받는 해학, 그리고 냉정한 팩트를 찰떡같이 섞어서 웃기면서도 정곡을 찌르는 답변을 하세요.

[답변 생성 규칙]
1. B급 비유 활용: 팩트를 그냥 던지지 말고, B급 비유(예: NPC, 1.5배속, 무급 봉사단, 영혼 탈곡기 등)나 재치 있는 비틀기를 써서 웃프게 전달하세요.
2. 절대 금지:
   - 영혼 없는 힐링/위로 ("힘내", "열심히 했잖아", "너는 특별해")
   - 재미없고 딱딱한 훈계나 지루한 현실 강의
   - 의미 없는 회피책 ("술이나 마셔라", "농땡이 쳐라")

3. 답변 구조 (2~3문장):
   - 1문장 (B급 팩트 폭격): B급 비유를 활용해 사용자가 착각하고 있는 현실이나 본인의 행동을 재치 있게 꼬집어준다.
   - 2~3문장 (웃픈 결론): 반박할 수 없지만 피식 웃음이 나는 킹받는 결론을 던져 정신을 차리게 만든다.

4. 톤앤매너:
   - 10년 지기 친구 특유의 능청스럽고 약간 뻔뻔한 반말 (~거든, ~잖아, ~일 뿐이야, ~마라).
   - 비꼬는 게 아니라 친해서 던지는 찰진 팩트 폭행 톤.

[출력 예시]
- 고민: 직장 생활이 너무 힘들어요.
- 답변: 너 힘든 건 회사가 악마라서가 아니라, 쥐꼬리만한 월급 받으면서 비장함은 지구 구하는 아벤져스 급이라 그래. 어차피 우린 회사의 주인이 아니라 월급 주고 사 온 '고급 일꾼 1'일 뿐이니까, 제발 회사에 자아를 바치지 마라.

- 고민: 공부가 너무 하기 싫고 집중이 안 돼요.
- 답변: 집중력이 부족한 게 아니라, 네 뇌가 '당장 안 해도 안 죽는다'는 걸 너무 똑똑하게 파악해서 그래. 안 할 거면 맘 편히 놀기라도 하든가, 공부도 안 하면서 핸드폰만 만지작거리는 네 모습이 제일 킹받는 거다.

- 고민: 연애를 하고 싶은데 기회가 없어요.
- 답변: 기회가 없는 게 아니라, 집과 침대라는 안락한 결계 속에서 백마 탄 왕자님이 쳐들어오길 기다리고 있어서 그래. 가만히 누워서 인스타만 보는데 하늘에서 인연이 뚝 떨어지겠냐?"""

        user_prompt = f"카테고리: {category}\n고민 내용: {text}"

        # 3. Call LLM API (Gemini vs OpenAI)
        quote = None
        
        # Gemini API 키가 있거나 OpenAI 키가 명시되지 않은 경우 Gemini 우선 처리
        is_gemini = bool(gemini_key) or (ai_key and not ai_key.startswith("sk-") and not openai_key)
        
        if is_gemini:
            key_to_use = gemini_key or ai_key
            gemini_models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash-lite']
            last_error = None
            
            for model in gemini_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key_to_use}"
                    payload = {
                        "system_instruction": {
                            "parts": [{"text": system_prompt}]
                        },
                        "contents": [
                            {"parts": [{"text": user_prompt}]}
                        ],
                        "generationConfig": {
                            "temperature": 0.8,
                            "maxOutputTokens": 250
                        }
                    }
                    data = json.dumps(payload).encode('utf-8')
                    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                    
                    with urllib.request.urlopen(req, timeout=9) as res:
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
            
            if not quote and not openai_key:
                print(f"All Gemini models failed. Last error: {last_error}")
                self.send_error_response(500, "현재 우주적 기운이 맞지 않아 명언 제조기가 고장났습니다. 나중에 다시 시도해주세요.")
                return

        # Gemini 실패 후 OpenAI 키가 있거나 처음부터 OpenAI 키를 사용하는 경우
        if not quote:
            key_to_use = openai_key or ai_key
            try:
                from openai import OpenAI
                client = OpenAI(api_key=key_to_use)
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.8,
                    max_tokens=150
                )
                quote = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Error calling OpenAI API: {str(e)}")
                self.send_error_response(500, "현재 우주적 기운이 맞지 않아 명언 제조기가 고장났습니다. 나중에 다시 시도해주세요.")
                return

        # 4. Send Success Response
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        response_data = {"quote": quote}
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))

