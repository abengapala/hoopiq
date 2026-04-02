from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

NBA_SYSTEM = """You are HoopIQ, an expert NBA analytics assistant with deep knowledge of:
- All NBA teams, players, statistics, and history
- Current season standings, stats, and trends
- Advanced analytics (PER, BPM, VORP, TS%, eFG%, Ortg, Drtg, Net Rtg)
- Game predictions and win probability analysis
- Historical comparisons and records
- Injury impacts and lineup analysis
- Playoff seeding and championship odds

Guidelines:
- Give expert, data-driven analysis
- Use specific stats and numbers when relevant
- Be conversational but authoritative
- Keep responses concise (under 200 words)
- Reference specific players, teams, and matchups confidently"""


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/")
async def chat(request: ChatRequest):
    """AI chatbot powered by Google Gemini (free tier) - called server-side to avoid CORS."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not set in backend/.env — get a free key at https://aistudio.google.com/app/apikey"
        )

    GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

    # Build Gemini contents array from history
    contents = []
    for msg in (request.history or []):
        contents.append({
            "role": "model" if msg.role == "bot" else "user",
            "parts": [{"text": msg.text}],
        })
    contents.append({"role": "user", "parts": [{"text": request.message}]})

    body = {
        "system_instruction": {"parts": [{"text": NBA_SYSTEM}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 400, "temperature": 0.7},
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(GEMINI_URL, json=body)
            if resp.status_code != 200:
                err = resp.json().get("error", {})
                raise HTTPException(status_code=502, detail=err.get("message", "Gemini API error"))

            data = resp.json()
            reply = (
                data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "No response from Gemini.")
            )
            return {"message": reply}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
