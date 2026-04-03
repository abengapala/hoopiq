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

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

NBA_SYSTEM = """You are HoopIQ, an expert NBA analytics assistant.

IMPORTANT: You do NOT have access to real-time or current season data. Your training data may be outdated.
- Never state specific current win/loss records, standings, or stats as facts
- If asked about current records or stats, say: "I don't have live data — check HoopIQ's live Standings or Stats pages for current numbers."
- You CAN analyze matchups, explain advanced metrics, discuss strategy, and give historical context
- Always be clear when something is from your training data vs current season

Guidelines:
- Give expert, data-driven analysis
- Use specific stats and numbers only when referencing historical/verified data
- Be conversational but authoritative
- Keep responses concise (under 200 words)
- Never hallucinate current stats — acknowledge the limitation instead"""


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    game_id: Optional[str] = None  # passed by GameDetailPage for analysis caching


def get_groq_key() -> str:
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not set in backend/.env — get a free key at https://console.groq.com"
        )
    return key


@router.post("/")
async def chat(request: ChatRequest):
    """AI chatbot powered by Groq — fast Llama 3.1 inference."""
    GROQ_API_KEY = get_groq_key()

    messages = [{"role": "system", "content": NBA_SYSTEM}]
    for msg in (request.history or []):
        messages.append({
            "role": "assistant" if msg.role == "bot" else "user",
            "content": msg.text,
        })
    messages.append({"role": "user", "content": request.message})

    body = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 400,
        "temperature": 0.7,
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

            data = resp.json()
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
    """
    Game-specific AI analysis for GameDetailPage.
    - If game_id is provided and analysis is cached → return instantly, skip Groq
    - Otherwise call Groq and cache the result permanently
    """
    # ── Cache check ──────────────────────────────────────────
    if request.game_id:
        cached = get_cached_analysis(request.game_id)
        if cached:
            return {"analysis": cached, "cached": True}

    GROQ_API_KEY = get_groq_key()

    messages = [
        {"role": "system", "content": NBA_SYSTEM},
        {"role": "user", "content": request.message},
    ]

    body = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.65,
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

            data = resp.json()
            reply = (
                data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "No analysis available.")
            )

        # ── Write to cache ────────────────────────────────────
        if request.game_id:
            set_cached_analysis(request.game_id, reply)

        return {"analysis": reply, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")