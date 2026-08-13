import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "이 API는 POST 요청만 지원합니다."}, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        # 1. API Key Check
        api_key = os.environ.get("AI_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            self.send_error_response(500, "서버 설정 오류: Vercel 환경 변수(AI_API_KEY 또는 GEMINI_API_KEY)가 설정되지 않았습니다.")
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

        # 3. Call OpenAI API
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            system_prompt = """당신은 'B급 감성 역발상 힐링 명언 제조기' (Paradox Mind)입니다.
사용자가 고민을 털어놓으면 진부하고 뻔한 위로는 절대 하지 마세요.
대신 B급 유머, 팩트폭행, 해학, 역설적인 관점을 담은 재치있고 유머러스한 명언(답변)을 생성하세요.
마치 친한 친구가 킹받게(장난스럽게) 조언해주는 듯한 톤을 유지하세요.
길이는 2~3문장으로 간결하게 작성하세요."""

            user_prompt = f"카테고리: {category}\n고민 내용: {text}"

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                max_tokens=150
            )
            
            quote = response.choices[0].message.content
            
            # 4. Send Success Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response_data = {"quote": quote}
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            self.send_error_response(500, "현재 우주적 기운이 맞지 않아 명언 제조기가 고장났습니다. 나중에 다시 시도해주세요.")

    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))
