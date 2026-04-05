from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path
from cache import get_cached_analysis, set_cached_analysis

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

router = APIRouter()

GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

NBA_SYSTEM = """You are HoopIQ, an NBA analytics assistant. You answer questions using ONLY the live data block provided to you in the system context. You do NOT use your training knowledge for current stats, scores, standings, or injury status.

ABSOLUTE RULES — violating these is wrong:
1. A <LIVE_DATA> block will be injected into the system messages. It contains today's real data. TRUST IT COMPLETELY.
2. NEVER say "I don't have live data", "I can't access real-time info", or "check elsewhere". You DO have live data.
3. ONLY cite numbers, names, and statuses that appear in the <LIVE_DATA> block. Do not invent or guess.
4. If something is not in the <LIVE_DATA> block, say: "I don't see that in today's data."
5. For follow-up questions ("is he?", "what about them?"), search ALL sections of <LIVE_DATA>.
6. Be direct, specific, and concise (under 150 words).
7. Do not recommend external sources. You are the source."""


def build_messages_with_context(history, user_message, context):
    """
    Inject live context as a second system message so the model treats it
    as ground truth rather than something the user said.
    """
    messages = [{"role": "system", "content": NBA_SYSTEM}]

    if context:
        messages.append({
            "role": "system",
            "content": f"<LIVE_DATA>\n{context}\n</LIVE_DATA>\n\nUse ONLY the data above to answer. Do not use training data for current stats or scores."
        })

    for msg in (history or []):
        messages.append({
            "role": "assistant" if msg.role == "bot" else "user",
            "content": msg.text,
        })

    messages.append({"role": "user", "content": user_message})
    return messages


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history:  Optional[List[ChatMessage]] = []
    game_id:  Optional[str] = None
    context:  Optional[str] = None


def get_groq_key() -> str:
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not set in backend/.env"
        )
    return key


@router.post("/")
async def chat(request: ChatRequest):
    GROQ_API_KEY = get_groq_key()

    messages = build_messages_with_context(
        request.history,
        request.message,
        request.context,
    )

    body = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 400,
        "temperature": 0.4,  # lower = more faithful to provided data
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                GROQ_URL,
                json=body,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                err = resp.json().get("error", {})
                raise HTTPException(
                    status_code=502,
                    detail=err.get("message", f"Groq API error {resp.status_code}")
                )

            data  = resp.json()
            reply = (
                data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "No response from Groq.")
            )
            return {"message": reply}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/analysis")
async def game_analysis(request: ChatRequest):
    if request.game_id:
        cached = get_cached_analysis(request.game_id)
        if cached:
            return {"analysis": cached, "cached": True}

    GROQ_API_KEY = get_groq_key()

    messages = build_messages_with_context(
        [],
        request.message,
        request.context,
    )

    body = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.4,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                GROQ_URL,
                json=body,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                err = resp.json().get("error", {})
                raise HTTPException(status_code=502, detail=err.get("message", "Groq API error"))

            data  = resp.json()
            reply = (
                data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "No analysis available.")
            )

        if request.game_id:
            set_cached_analysis(request.game_id, reply)

        return {"analysis": reply, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")