from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import uuid
import sqlite3
import hashlib
import secrets
import edge_tts

from .tools import detect_command, execute_command


load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY bulunamadı. ~/NEXUS SİTE/.env dosyasını kontrol et."
    )


client = OpenAI(
    api_key=NVIDIA_API_KEY,
    base_url="https://integrate.api.nvidia.com/v1"
)


MODEL = "nvidia/nemotron-3-ultra-550b-a55b"

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "nexus.db")

SESSION_DAYS = 7
COOKIE_NAME = "nexus_session"


app = FastAPI(
    title="NEXUS AI",
    version="4.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


conversation_history = {}
MAX_HISTORY = 20
MESSAGE_LIMIT = 50
message_counts = {}


VOICES = {
    "Ahmet": "tr-TR-AhmetNeural",
    "Emel": "tr-TR-EmelNeural",
    "Aria": "en-US-AriaNeural",
    "Guy": "en-US-GuyNeural",
    "Jenny": "en-US-JennyNeural",
}


# ==============================
# DB HELPERS
# ==============================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}:{digest}"


def verify_password(password, stored):
    try:
        salt, _ = stored.split(":", 1)
    except ValueError:
        return False
    return hash_password(password, salt) == stored


def create_session(username):
    token = secrets.token_hex(32)
    expires_at = (datetime.utcnow() + timedelta(days=SESSION_DAYS)).isoformat()

    conn = get_db()
    conn.execute(
        "INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, ?)",
        (token, username, expires_at)
    )
    conn.commit()
    conn.close()

    return token, expires_at


def get_user_from_token(token):
    if not token:
        return None

    conn = get_db()

    session = conn.execute(
        "SELECT * FROM sessions WHERE token = ?",
        (token,)
    ).fetchone()

    if not session:
        conn.close()
        return None

    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
        return None

    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (session["username"],)
    ).fetchone()

    conn.close()

    return user


def user_to_dict(user):
    return {
        "logged_in": True,
        "username": user["username"],
        "pro": bool(user["pro"]),
        "admin": user["username"] == "ADMIN"
    }


# ==============================
# MODELS
# ==============================

class ChatRequest(BaseModel):
    message: str


class ClearRequest(BaseModel):
    clear: bool = True


class SpeakRequest(BaseModel):
    text: str
    voice: str = "tr-TR-AhmetNeural"


class AuthRequest(BaseModel):
    username: str
    password: str


class ProRequest(BaseModel):
    username: str
    pro: bool


SYSTEM_PROMPT = """
Sen NEXUS 4.0 adında gelişmiş kişisel bilgisayar asistanısın.

Kullanıcıyla Türkçe konuş.

Karakterin:
- Zeki
- Hızlı
- Doğal
- Hafif samimi
- Gereksiz uzun konuşmayan
- Teknik konularda yardımcı

Kullanıcının bilgisayarı Linux/CachyOS kullanıyor.

Bilgisayar işlemleri için backend tarafından sağlanan güvenli araçlar kullanılabilir.

Önemli:
- Gerçekten yaptığın bir işlemi yapmış gibi söyleme.
- Bir işlem backend tarafından gerçekleştirildiyse sonucunu belirt.
- Yapılmadıysa yapılmış gibi davranma.
- Tehlikeli veya yıkıcı işlemler önermeden önce kullanıcıdan onay iste.
"""


# ==============================
# AUTH ENDPOINTS
# ==============================

@app.post("/api/register")
def register(request: AuthRequest):
    username = request.username.strip()
    password = request.password

    if not username or not password:
        return JSONResponse(
            status_code=400,
            content={"detail": "Kullanıcı adı ve şifre gerekli."}
        )

    conn = get_db()

    existing = conn.execute(
        "SELECT id FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    if existing:
        conn.close()
        return JSONResponse(
            status_code=400,
            content={"detail": "Bu kullanıcı adı zaten kullanılıyor."}
        )

    conn.execute(
        "INSERT INTO users (username, password, pro, created_at) VALUES (?, ?, 0, ?)",
        (username, hash_password(password), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

    return {"success": True}


@app.post("/api/login")
def login(request: AuthRequest, response: Response):
    username = request.username.strip()
    password = request.password

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    conn.close()

    if not user or not verify_password(password, user["password"]):
        return JSONResponse(
            status_code=401,
            content={"detail": "Kullanıcı adı veya şifre hatalı."}
        )

    token, expires_at = create_session(username)

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 3600,
        path="/"
    )

    return {"success": True}


@app.post("/api/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)

    if token:
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()

    response.delete_cookie(COOKIE_NAME, path="/")

    return {"success": True}


@app.get("/api/me")
def me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    user = get_user_from_token(token)

    if not user:
        return {"logged_in": False}

    return user_to_dict(user)


@app.get("/api/users")
def list_users(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    current = get_user_from_token(token)

    if not current or current["username"] != "ADMIN":
        return JSONResponse(
            status_code=403,
            content={"detail": "Yetkin yok."}
        )

    conn = get_db()
    rows = conn.execute(
        "SELECT username, pro FROM users ORDER BY id"
    ).fetchall()
    conn.close()

    return [
        {"username": row["username"], "pro": bool(row["pro"])}
        for row in rows
    ]


@app.post("/api/pro")
def set_pro(payload: ProRequest, request: Request):
    token = request.cookies.get(COOKIE_NAME)
    current = get_user_from_token(token)

    if not current or current["username"] != "ADMIN":
        return JSONResponse(
            status_code=403,
            content={"detail": "Yetkin yok."}
        )

    conn = get_db()
    conn.execute(
        "UPDATE users SET pro = ? WHERE username = ?",
        (1 if payload.pro else 0, payload.username)
    )
    conn.commit()
    conn.close()

    return {"success": True}


# ==============================
# CORE ENDPOINTS
# ==============================

@app.get("/api")
def home():
    return {
        "status": "ONLINE",
        "name": "NEXUS",
        "version": "4.0",
        "model": MODEL,
        "time": datetime.now().isoformat()
    }


@app.get("/api/status")
def status():
    return {
        "online": True,
        "name": "NEXUS",
        "version": "4.0",
        "model": MODEL,
        "history": sum(len(v) for v in conversation_history.values()),
        "time": datetime.now().strftime("%H:%M:%S")
    }


@app.post("/api/chat")
def chat(request: ChatRequest, http_request: Request):
    token = http_request.cookies.get(COOKIE_NAME)
    user = get_user_from_token(token)

    if not user:
        return JSONResponse(
            status_code=401,
            content={"detail": "Giriş yapmalısın."}
        )

    username = user["username"]
    is_admin = username == "ADMIN"
    is_pro = bool(user["pro"])

    message = request.message.strip()

    if not message:
        return {"reply": "Boş mesaj gönderemezsin."}

    action, value = detect_command(message)

    if action:
        success, result = execute_command(action, value)

        return {
            "reply": result,
            "tool": action,
            "success": bool(success),
            "timestamp": datetime.now().isoformat()
        }

    if not is_admin and not is_pro:
        count = message_counts.get(username, 0)

        if count >= MESSAGE_LIMIT:
            return {
                "reply": (
                    "Bu sohbette 50 mesaj sınırına ulaştın. "
                    "Devam etmek için PRO'ya geç ya da yeni bir sohbet başlat."
                ),
                "limit_reached": True,
                "timestamp": datetime.now().isoformat()
            }

        message_counts[username] = count + 1

    history_list = conversation_history.setdefault(username, [])
    history_list.append({"role": "user", "content": message})

    history = history_list[-MAX_HISTORY:]

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *history
            ],
            temperature=0.7,
            max_tokens=2048
        )

        reply = response.choices[0].message.content or "Yanıt alınamadı."

        history_list.append({"role": "assistant", "content": reply})

        remaining = None

        if not is_admin and not is_pro:
            remaining = max(0, MESSAGE_LIMIT - message_counts.get(username, 0))

        return {
            "reply": reply,
            "model": MODEL,
            "timestamp": datetime.now().isoformat(),
            "remaining": remaining
        }

    except Exception as e:
        if history_list:
            history_list.pop()

        if not is_admin and not is_pro:
            message_counts[username] = max(0, message_counts.get(username, 1) - 1)

        return {"reply": f"NEXUS bağlantı hatası:\n{str(e)}"}


@app.post("/api/speak")
async def speak(request: SpeakRequest):
    text = request.text.strip()

    if not text:
        return {"error": "Boş metin."}

    if request.voice not in VOICES.values():
        return {"error": "Geçersiz ses."}

    filename = f"/tmp/nexus_{uuid.uuid4().hex}.mp3"

    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice=request.voice,
            rate="-5%",
            volume="+0%",
            pitch="+0Hz"
        )

        await communicate.save(filename)

        return FileResponse(
            filename,
            media_type="audio/mpeg",
            filename="nexus.mp3"
        )

    except Exception as error:
        return {"error": str(error)}


@app.post("/api/clear")
def clear_memory(request: ClearRequest, http_request: Request):
    token = http_request.cookies.get(COOKIE_NAME)
    user = get_user_from_token(token)

    if not user:
        return JSONResponse(
            status_code=401,
            content={"detail": "Giriş yapmalısın."}
        )

    username = user["username"]
    conversation_history[username] = []
    message_counts[username] = 0

    return {
        "success": True,
        "message": "NEXUS hafızası temizlendi."
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "nexus": "online",
        "version": "4.0"
    }
