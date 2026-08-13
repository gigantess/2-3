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

        system_prompt = """당신은 'B급 감성 역발상 힐링 명언 제조기' (Paradox Mind)입니다.
사용자가 고민을 털어놓으면 진부하고 뻔한 위로는 절대 하지 마세요.
대신 B급 유머, 팩트폭행, 해학, 역설적인 관점을 담은 재치있고 유머러스한 명언(답변)을 생성하세요.
마치 친한 친구가 킹받게(장난스럽게) 조언해주는 듯한 톤을 유지하세요.
길이는 2~3문장으로 간결하게 작성하세요."""

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

