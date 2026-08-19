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

CATEGORY_LABELS = {
    'study': '📚 머리에 안 들어오는 공부',
    'work':  '🏢 퇴사 마려운 직장생활',
    'money': '💸 통장 아니고 텅장',
    'love':  '💔 답도 없는 연애·짝사랑',
    'relationship': '👥 기 빨리는 인간관계',
    'health': '🥗 작심삼일 다이어트·운동',
    'life':  '🛌 그냥 다 귀찮은 인생'
}

# Discord embed 색상 (카테고리별)
CATEGORY_COLORS = {
    'study': 0x4ecdc4,
    'work':  0xff6b6b,
    'money': 0xf7dc6f,
    'love':  0xff78cb,
    'relationship': 0x54a0ff,
    'health': 0x2ecc71,
    'life':  0xbb8fce
}

JSON_CONTENT_TYPE = 'application/json; charset=utf-8'

class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Vercel 로그 노이즈 억제"""
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        load_env_file()

        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
        if not webhook_url:
            self.send_error_response(500, "Discord Webhook URL이 서버에 설정되지 않았습니다.")
            return

        # 요청 본문 파싱
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8'))
            items = body.get('items', [])
        except json.JSONDecodeError:
            self.send_error_response(400, "잘못된 요청: JSON 형식이 아닙니다.")
            return

        if not items:
            self.send_error_response(400, "전송할 처방전이 없습니다.")
            return

        # Discord는 한 번에 최대 10개 embed 허용
        items = items[:10]

        embeds = []
        for item in items:
            category = item.get('category', 'life')
            category_label = CATEGORY_LABELS.get(category, '기타')
            color = CATEGORY_COLORS.get(category, 0xffd700)
            worry_text = item.get('worry', '(내용 없음)')[:1024]
            quote_text = item.get('quote', '(처방전 없음)')[:1024]
            date_str  = item.get('date', '')

            embeds.append({
                "title": "🧘‍♂️ 역발상 처방전 도착!",
                "color": color,
                "fields": [
                    {
                        "name": "📂 고민 카테고리",
                        "value": category_label,
                        "inline": True
                    },
                    {
                        "name": "\u200b",  # zero-width space for layout
                        "value": "\u200b",
                        "inline": True
                    },
                    {
                        "name": "😰 고민 내용",
                        "value": f"> {worry_text}",
                        "inline": False
                    },
                    {
                        "name": "💊 AI 처방전 (팩트폭행)",
                        "value": f"**{quote_text}**",
                        "inline": False
                    }
                ],
                "footer": {
                    "text": f"Paradox Mind • {date_str}"
                },
                "thumbnail": {
                    "url": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9d8-200d-2642-fe0f.png"
                }
            })

        discord_payload = {
            "username": "🧘 Paradox Mind Bot",
            "content": f"📬 **처방전 보관함에서 {len(items)}개의 팩트폭행이 도착했습니다!**\n뻔한 위로는 거부한다. 팩트만 남는다.",
            "embeds": embeds
        }

        try:
            data = json.dumps(discord_payload, ensure_ascii=False).encode('utf-8')
            req = urllib.request.Request(
                webhook_url,
                data=data,
                headers={
                    'Content-Type': 'application/json; charset=utf-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            )
            # Discord webhook은 성공 시 204 No Content 반환
            with urllib.request.urlopen(req, timeout=10) as res:
                res.read()

            self.send_response(200)
            self.send_header('Content-type', JSON_CONTENT_TYPE)
            self.end_headers()
            resp = {"success": True, "sent": len(items)}
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))

        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore')
            print(f"Discord Webhook Error: HTTP {e.code} - {err_body}")
            self.send_error_response(502, f"Discord 전송 실패 (HTTP {e.code}). 나중에 다시 시도해주세요.")
        except Exception as e:
            print(f"Discord send error: {str(e)}")
            self.send_error_response(500, f"전송 중 오류가 발생했습니다: {str(e)}")

    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', JSON_CONTENT_TYPE)
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))
